import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Difficulty, Prisma, QuestionStatus } from "@prisma/client";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
import { extname, join } from "path";
import * as mammoth from "mammoth";
import readXlsxFile from "read-excel-file/node";
import { parse as parseCsv } from "csv-parse/sync";
import { PrismaService } from "../prisma/prisma.service";
import { ConfirmImportDto, UpdateImportedQuestionDto } from "./admin.dto";

export type ParsedQuestion = {
  text: string;
  textHi?: string;
  optionA?: string;
  optionAHi?: string;
  optionB?: string;
  optionBHi?: string;
  optionC?: string;
  optionCHi?: string;
  optionD?: string;
  optionDHi?: string;
  correctAnswer?: string;
  explanation?: string;
  explanationHi?: string;
  subjectName?: string;
  subjectNameHi?: string;
  topicName?: string;
  topicNameHi?: string;
  difficulty?: Difficulty;
  marks?: number;
  negativeMarks?: number;
  warnings?: string[];
};

export interface QuestionExtractionService {
  supports(extension: string): boolean;
  extract(path: string, buffer: Buffer): Promise<ParsedQuestion[]>;
}

@Injectable()
export class ImportService {
  private readonly uploadDir: string;
  constructor(
    private readonly prisma: PrismaService,
    config: ConfigService,
  ) {
    this.uploadDir = join(
      config.get("UPLOAD_DIR", "uploads"),
      "private",
      "imports",
    );
  }

  async upload(userId: string, file?: Express.Multer.File) {
    if (!file)
      throw new BadRequestException(
        "Choose a PDF, DOCX, XLSX, CSV, or JSON file",
      );
    const extension = extname(file.originalname).toLowerCase();
    if (![".pdf", ".docx", ".xlsx", ".csv", ".json"].includes(extension))
      throw new BadRequestException("Unsupported file type");
    validateDocumentSignature(extension, file.buffer);
    await mkdir(this.uploadDir, { recursive: true });
    const storedPath = join(this.uploadDir, `${randomUUID()}${extension}`);
    await writeFile(storedPath, file.buffer);
    const paperImport = await this.prisma.paperImport.create({
      data: {
        fileName: file.originalname,
        storedPath,
        mimeType: file.mimetype,
        uploadedById: userId,
      },
    });
    try {
      const parsed = await this.extract(extension, storedPath, file.buffer);
      if (!parsed.length)
        throw new Error(
          "No questions were detected. Check the document format; scanned PDFs require an OCR extraction provider.",
        );
      const enhanced = await Promise.all(
        parsed.map(async (question, order) => {
          const warnings = [...(question.warnings ?? [])];
          if (!question.correctAnswer)
            warnings.push("Correct answer could not be detected.");
          if (
            ![
              question.optionA,
              question.optionB,
              question.optionC,
              question.optionD,
            ].every(Boolean)
          )
            warnings.push("One or more options could not be detected.");
          const needle = question.text.trim().slice(0, 80);
          const duplicate =
            needle.length > 20
              ? await this.prisma.question.findFirst({
                  where: { text: { contains: needle } },
                  select: { id: true },
                })
              : null;
          if (duplicate) warnings.push("Possible duplicate question detected.");
          return {
            ...question,
            duplicateOfId: duplicate?.id,
            warnings,
            order: order + 1,
            difficulty: question.difficulty ?? Difficulty.MEDIUM,
            marks: question.marks ?? 1,
            negativeMarks: question.negativeMarks ?? 0,
          };
        }),
      );
      const warningCount = enhanced.filter((q) => q.warnings.length).length;
      await this.prisma.paperImport.update({
        where: { id: paperImport.id },
        data: {
          status: "REVIEW",
          detectedCount: enhanced.length,
          warningCount,
          importedQuestions: {
            create: enhanced.map((q) => ({
              ...q,
              warnings: q.warnings as Prisma.InputJsonValue,
            })),
          },
        },
      });
      return this.preview(paperImport.id);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Unable to parse file";
      await this.prisma.paperImport.update({
        where: { id: paperImport.id },
        data: { status: "FAILED", errorMessage: message },
      });
      throw new BadRequestException(
        `The file was uploaded but could not be parsed: ${message}`,
      );
    }
  }

  async preview(id: string) {
    const item = await this.prisma.paperImport.findUnique({
      where: { id },
      include: { importedQuestions: { orderBy: { order: "asc" } } },
    });
    if (!item) throw new NotFoundException("Import not found");
    return item;
  }

  async updateQuestion(
    importId: string,
    id: string,
    dto: UpdateImportedQuestionDto,
  ) {
    const item = await this.prisma.importedQuestion.findFirst({
      where: { id, importId },
    });
    if (!item) throw new NotFoundException("Imported question not found");
    const updated = await this.prisma.importedQuestion.update({
      where: { id },
      data: {
        ...dto,
        status:
          dto.duplicateAction === "SKIP"
            ? "SKIPPED"
            : dto.status ?? (item.status === "SKIPPED"
              ? "PENDING"
              : item.status),
        warnings: this.warningsFor({ ...item, ...dto }),
      },
    });
    await this.syncCounts(importId);
    return updated;
  }

  async deleteQuestion(importId: string, id: string) {
    const result = await this.prisma.importedQuestion.deleteMany({
      where: { id, importId },
    });
    if (!result.count)
      throw new NotFoundException("Imported question not found");
    await this.syncCounts(importId);
    return { success: true };
  }

  async confirm(importId: string, dto: ConfirmImportDto) {
    const targetExam = await this.prisma.exam.findUnique({
      where: { id: dto.examId },
      select: { status: true },
    });
    if (!targetExam) throw new NotFoundException("Target exam not found");
    if (targetExam.status !== "DRAFT")
      throw new BadRequestException(
        "Imported questions can only be added to a draft exam",
      );
    if (await this.prisma.attempt.count({ where: { examId: dto.examId } }))
      throw new BadRequestException(
        "This exam has attempt history. Create or duplicate an exam before importing new questions.",
      );
    const paper = await this.prisma.paperImport.findUnique({
      where: { id: importId },
      include: {
        importedQuestions: {
          where: { status: { not: QuestionStatus.SKIPPED } },
          orderBy: { order: "asc" },
        },
      },
    });
    if (!paper) throw new NotFoundException("Import not found");
    if (paper.status === "CONFIRMED")
      throw new BadRequestException("This import was already confirmed");
    const eligible = paper.importedQuestions.filter(
      (question) => question.duplicateAction !== "SKIP",
    );
    const selected = dto.questionIds?.length
      ? eligible.filter((q) => dto.questionIds!.includes(q.id))
      : eligible;
    if (!selected.length)
      throw new BadRequestException("Select at least one question");
    const invalid = selected.find(
      (q) =>
        !q.text.trim() ||
        !q.optionA?.trim() ||
        !q.optionB?.trim() ||
        !q.optionC?.trim() ||
        !q.optionD?.trim() ||
        Number(q.marks) <= 0 ||
        Number(q.negativeMarks) < 0 ||
        !["A", "B", "C", "D"].includes((q.correctAnswer ?? "").toUpperCase()),
    );
    if (invalid)
      throw new BadRequestException(
        `Question ${invalid.order} must have text, four options and a correct answer`,
      );
    const max = await this.prisma.question.aggregate({
      where: { examId: dto.examId },
      _max: { order: true },
    });
    await this.prisma.$transaction(
      async (tx) => {
        // A large paper often repeats the same subject and topic hundreds of
        // times. Cache their upserts so the import does not issue two extra
        // database queries for every question.
        const subjects = new Map<string, { id: string }>();
        const topics = new Map<string, { id: string }>();
        let nextOrder = (max._max.order ?? 0) + 1;

        for (const q of selected) {
          const subjectName = q.subjectName?.trim();
          const topicName = q.topicName?.trim();
          let subject = subjectName ? subjects.get(subjectName) : undefined;
          if (subjectName && !subject) {
            subject = await tx.subject.upsert({
              where: { name: subjectName },
              update: { nameHi: q.subjectNameHi?.trim() || undefined },
              create: {
                name: subjectName,
                nameHi: q.subjectNameHi?.trim() || undefined,
              },
            });
            subjects.set(subjectName, subject);
          }

          const topicKey =
            subject && topicName ? `${subject.id}:${topicName}` : undefined;
          let topic = topicKey ? topics.get(topicKey) : undefined;
          if (subject && topicName && topicKey && !topic) {
            topic = await tx.topic.upsert({
              where: {
                subjectId_name: { subjectId: subject.id, name: topicName },
              },
              update: { nameHi: q.topicNameHi?.trim() || undefined },
              create: {
                subjectId: subject.id,
                name: topicName,
                nameHi: q.topicNameHi?.trim() || undefined,
              },
            });
            topics.set(topicKey, topic);
          }
          const options = (
            [
              ["A", q.optionA!, q.optionAHi],
              ["B", q.optionB!, q.optionBHi],
              ["C", q.optionC!, q.optionCHi],
              ["D", q.optionD!, q.optionDHi],
            ] as Array<[string, string, string | null]>
          ).map(([label, text, textHi]) => ({
            label,
            text,
            textHi,
            isCorrect: label === q.correctAnswer!.toUpperCase(),
          }));
          if (q.duplicateAction === "REPLACE" && q.duplicateOfId) {
            const existing = await tx.question.findUnique({
              where: { id: q.duplicateOfId },
              select: { exam: { select: { status: true } } },
            });
            if (!existing)
              throw new BadRequestException(
                `The duplicate matched by question ${q.order} no longer exists. Choose Keep.`,
              );
            if (existing.exam.status !== "DRAFT")
              throw new BadRequestException(
                `Question ${q.order} matches a published exam and cannot replace it. Choose Keep or Skip.`,
              );
            if (
              await tx.attemptAnswer.count({
                where: { questionId: q.duplicateOfId },
              })
            )
              throw new BadRequestException(
                `Question ${q.order} matches a question with attempt history and cannot replace it. Choose Keep or Skip.`,
              );
            await tx.questionOption.deleteMany({
              where: { questionId: q.duplicateOfId },
            });
            await tx.question.update({
              where: { id: q.duplicateOfId },
              data: {
                subjectId: subject?.id,
                topicId: topic?.id,
                text: q.text,
                textHi: q.textHi,
                explanation: q.explanation,
                explanationHi: q.explanationHi,
                difficulty: q.difficulty,
                marks: q.marks,
                negativeMarks: q.negativeMarks,
                options: { create: options },
              },
            });
          } else {
            await tx.question.create({
              data: {
                examId: dto.examId,
                subjectId: subject?.id,
                topicId: topic?.id,
                text: q.text,
                textHi: q.textHi,
                explanation: q.explanation,
                explanationHi: q.explanationHi,
                difficulty: q.difficulty,
                marks: q.marks,
                negativeMarks: q.negativeMarks,
                order: nextOrder++,
                options: { create: options },
              },
            });
          }
        }
        await tx.importedQuestion.updateMany({
          where: { id: { in: selected.map((question) => question.id) } },
          data: { status: "APPROVED" },
        });
        await tx.paperImport.update({
          where: { id: importId },
          data: { status: "CONFIRMED", examId: dto.examId },
        });
      },
      { maxWait: 10_000, timeout: 120_000 },
    );
    return { success: true, imported: selected.length, examId: dto.examId };
  }

  private async extract(
    extension: string,
    path: string,
    buffer: Buffer,
  ): Promise<ParsedQuestion[]> {
    if (extension === ".json")
      return this.fromRows(JSON.parse(buffer.toString("utf8")));
    if (extension === ".csv")
      return this.fromRows(
        parseCsv(buffer.toString("utf8"), {
          // Spreadsheet applications commonly prefix UTF-8 CSV files with a
          // byte-order mark. Without this option the first header becomes
          // "\uFEFFquestion", so every otherwise valid row is discarded.
          bom: true,
          columns: true,
          skip_empty_lines: true,
          trim: true,
        }),
      );
    if (extension === ".xlsx") {
      const rows = await readXlsxFile(buffer);
      const headers = (rows.shift() ?? []).map((cell) =>
        String(cell ?? "").trim(),
      );
      return this.fromRows(
        rows.map((row) =>
          Object.fromEntries(
            headers.map((header, index) => [header, row[index]]),
          ),
        ),
      );
    }
    if (extension === ".docx") {
      const result = await mammoth.extractRawText({ buffer });
      return parseQuestionText(result.value);
    }
    if (extension === ".pdf") {
      const pdfParse: (
        data: Buffer,
      ) => Promise<{ text: string }> = require("pdf-parse");
      return parseQuestionText((await pdfParse(await readFile(path))).text);
    }
    throw new Error("Unsupported format");
  }

  private fromRows(rows: unknown): ParsedQuestion[] {
    if (!Array.isArray(rows))
      throw new Error("The file must contain a list of questions");
    return rows
      .map((raw: Record<string, unknown>) => ({
        text: String(raw.question ?? raw.text ?? "").trim(),
        textHi: val(
          raw.question_hi ?? raw.question_hindi ?? raw.textHi ?? raw.text_hindi,
        ),
        optionA: val(raw.option_a ?? raw.optionA),
        optionAHi: val(raw.option_a_hi ?? raw.option_a_hindi ?? raw.optionAHi),
        optionB: val(raw.option_b ?? raw.optionB),
        optionBHi: val(raw.option_b_hi ?? raw.option_b_hindi ?? raw.optionBHi),
        optionC: val(raw.option_c ?? raw.optionC),
        optionCHi: val(raw.option_c_hi ?? raw.option_c_hindi ?? raw.optionCHi),
        optionD: val(raw.option_d ?? raw.optionD),
        optionDHi: val(raw.option_d_hi ?? raw.option_d_hindi ?? raw.optionDHi),
        correctAnswer: val(raw.correct_answer ?? raw.correctAnswer)
          ?.toUpperCase()
          .replace(/[^A-D]/g, ""),
        explanation: val(raw.explanation),
        explanationHi: val(
          raw.explanation_hi ?? raw.explanation_hindi ?? raw.explanationHi,
        ),
        subjectName: val(raw.subject),
        subjectNameHi: val(
          raw.subject_hi ?? raw.subject_hindi ?? raw.subjectNameHi,
        ),
        topicName: val(raw.topic),
        topicNameHi: val(raw.topic_hi ?? raw.topic_hindi ?? raw.topicNameHi),
        difficulty: parseDifficulty(raw.difficulty),
        marks: num(raw.marks, 1),
        negativeMarks: num(raw.negative_marks ?? raw.negativeMarks, 0),
      }))
      .filter((q) => q.text);
  }

  private warningsFor(q: {
    text?: string;
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
    correctAnswer?: string | null;
    duplicateOfId?: string | null;
  }) {
    const warnings: string[] = [];
    if (!q.text) warnings.push("Question text is missing.");
    if (![q.optionA, q.optionB, q.optionC, q.optionD].every(Boolean))
      warnings.push("One or more options could not be detected.");
    if (!q.correctAnswer)
      warnings.push("Correct answer could not be detected.");
    if (q.duplicateOfId) warnings.push("Possible duplicate question detected.");
    return warnings as Prisma.InputJsonValue;
  }

  private async syncCounts(importId: string) {
    const questions = await this.prisma.importedQuestion.findMany({
      where: { importId },
      select: { status: true, warnings: true },
    });
    await this.prisma.paperImport.update({
      where: { id: importId },
      data: {
        detectedCount: questions.length,
        warningCount: questions.filter(
          (question) =>
            question.status !== "SKIPPED" &&
            Array.isArray(question.warnings) &&
            question.warnings.length > 0,
        ).length,
      },
    });
  }
}

const val = (value: unknown) =>
  value == null || value === "" ? undefined : String(value).trim();
const num = (value: unknown, fallback: number) =>
  value == null || String(value).trim() === ""
    ? fallback
    : Number.isFinite(Number(value)) ? Number(value) : fallback;
const parseDifficulty = (value: unknown): Difficulty => {
  const parsed = String(value ?? "").toUpperCase();
  return parsed === "EASY" || parsed === "HARD"
    ? (parsed as Difficulty)
    : Difficulty.MEDIUM;
};

function validateDocumentSignature(extension: string, buffer: Buffer) {
  if (!buffer.length)
    throw new BadRequestException("The uploaded file is empty");
  if (
    extension === ".pdf" &&
    buffer.subarray(0, 5).toString("ascii") !== "%PDF-"
  )
    throw new BadRequestException("The uploaded file is not a valid PDF");
  if (
    (extension === ".docx" || extension === ".xlsx") &&
    !buffer.subarray(0, 2).equals(Buffer.from("PK"))
  )
    throw new BadRequestException(
      `The uploaded file is not a valid ${extension.slice(1).toUpperCase()} document`,
    );
  if (
    (extension === ".csv" || extension === ".json") &&
    buffer.subarray(0, Math.min(buffer.length, 4096)).includes(0)
  )
    throw new BadRequestException(
      "The uploaded text file contains binary data",
    );
}

export function parseQuestionText(text: string): ParsedQuestion[] {
  const normalized = text.replace(/\r/g, "").replace(/\u00a0/g, " ");
  const starts = [
    ...normalized.matchAll(
      /(?:^|\n)\s*(?:(?:Q(?:uestion)?\s*\.?\s*)(\d{1,4})(?:[.):]\s*|\s+)|(\d{1,4})[.)]\s+)/gim,
    ),
  ];
  const blocks = starts.map((match, i) =>
    normalized.slice(
      match.index! + match[0].length,
      starts[i + 1]?.index ?? normalized.length,
    ),
  );
  return blocks
    .map((block) => {
      const answer = block
        .match(/(?:answer|ans(?:wer)?)\s*[:.-]\s*\(?([A-D])\)?/i)?.[1]
        ?.toUpperCase();
      const explanation = block
        .match(/(?:explanation|solution)\s*[:.-]\s*([\s\S]+)$/i)?.[1]
        ?.trim();
      const clean = block
        .replace(/(?:answer|ans(?:wer)?)\s*[:.-][\s\S]*$/i, "")
        .trim();
      const optionMatches = [
        ...clean.matchAll(
          /(?:^|\n)\s*(?:\(([A-Da-d])\)|([A-Da-d])[.)])\s+([^\n]+(?:\n(?!\s*(?:\([A-Da-d]\)|[A-Da-d][.)])\s).*)?)/g,
        ),
      ];
      const first = optionMatches[0]?.index ?? clean.length;
      const question: ParsedQuestion = {
        text: clean.slice(0, first).trim(),
        correctAnswer: answer,
        explanation,
      };
      optionMatches.forEach((match) => {
        const label = (match[1] ?? match[2]).toUpperCase();
        (question as Record<string, unknown>)[`option${label}`] =
          match[3].trim();
      });
      return question;
    })
    .filter((question) => question.text.length > 2);
}
