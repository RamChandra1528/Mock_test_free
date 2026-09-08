import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Difficulty, Prisma, UserStatus } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import {
  CreateExamDto,
  CreateQuestionDto,
  ExamQueryDto,
  ExamSectionDto,
  PageQueryDto,
  QuestionQueryDto,
  TaxonomyDto,
  TopicDto,
  UpdateExamDto,
  UpdateQuestionDto,
} from "./admin.dto";

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [
      students,
      exams,
      questions,
      attempts,
      published,
      drafts,
      recentAttempts,
      popular,
      analyticsAttempts,
      accuracyAnswers,
    ] = await Promise.all([
      this.prisma.user.count({ where: { role: { code: "STUDENT" } } }),
      this.prisma.exam.count(),
      this.prisma.question.count(),
      this.prisma.attempt.count(),
      this.prisma.exam.count({ where: { status: "PUBLISHED" } }),
      this.prisma.exam.count({ where: { status: "DRAFT" } }),
      this.prisma.attempt.findMany({
        where: { status: { not: "IN_PROGRESS" } },
        orderBy: { submittedAt: "desc" },
        take: 10,
        include: {
          user: { select: { fullName: true } },
          exam: { select: { title: true } },
        },
      }),
      this.prisma.attempt.groupBy({
        by: ["examId"],
        _count: true,
        orderBy: { _count: { examId: "desc" } },
        take: 5,
      }),
      this.prisma.attempt.findMany({
        where: { status: { not: "IN_PROGRESS" }, submittedAt: { gte: since } },
        take: 5000,
        orderBy: { submittedAt: "asc" },
        select: {
          submittedAt: true,
          percentage: true,
          examId: true,
          userId: true,
          exam: { select: { title: true } },
          user: { select: { fullName: true } },
        },
      }),
      this.prisma.attemptAnswer.findMany({
        where: { attempt: { status: { not: "IN_PROGRESS" } } },
        take: 5000,
        orderBy: { savedAt: "desc" },
        select: {
          selectedOptionId: true,
          isCorrect: true,
          question: { select: { id: true, order: true, text: true } },
        },
      }),
    ]);
    const examNames = await this.prisma.exam.findMany({
      where: { id: { in: popular.map((p) => p.examId) } },
      select: { id: true, title: true },
    });
    const daily = new Map<string, number>();
    const examScores = new Map<string, { name: string; scores: number[] }>();
    const studentScores = new Map<string, { name: string; scores: number[] }>();
    for (const attempt of analyticsAttempts) {
      if (attempt.submittedAt) {
        const date = attempt.submittedAt.toISOString().slice(0, 10);
        daily.set(date, (daily.get(date) ?? 0) + 1);
      }
      const exam = examScores.get(attempt.examId) ?? {
        name: attempt.exam.title,
        scores: [],
      };
      exam.scores.push(Number(attempt.percentage));
      examScores.set(attempt.examId, exam);
      const student = studentScores.get(attempt.userId) ?? {
        name: attempt.user.fullName,
        scores: [],
      };
      student.scores.push(Number(attempt.percentage));
      studentScores.set(attempt.userId, student);
    }
    const questionScores = new Map<
      string,
      { question: string; order: number; correct: number; attempted: number }
    >();
    for (const answer of accuracyAnswers) {
      const row = questionScores.get(answer.question.id) ?? {
        question: answer.question.text,
        order: answer.question.order,
        correct: 0,
        attempted: 0,
      };
      if (answer.selectedOptionId) {
        row.attempted++;
        if (answer.isCorrect) row.correct++;
      }
      questionScores.set(answer.question.id, row);
    }
    return {
      stats: { students, exams, questions, attempts, published, drafts },
      recentAttempts: recentAttempts.map((a) => ({
        id: a.id,
        student: a.user.fullName,
        exam: a.exam.title,
        score: a.score,
        submittedAt: a.submittedAt,
      })),
      popularExams: popular.map((p) => ({
        name: examNames.find((e) => e.id === p.examId)?.title ?? "Exam",
        attempts: p._count,
      })),
      attemptsOverTime: [...daily].map(([date, count]) => ({ date, count })),
      averageScoreByExam: [...examScores.values()]
        .map((item) => ({ name: item.name, score: avg(item.scores) }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 8),
      studentPerformance: [...studentScores.values()]
        .map((item) => ({ name: item.name, score: avg(item.scores) }))
        .sort((left, right) => right.score - left.score)
        .slice(0, 8),
      questionAccuracy: [...questionScores.values()]
        .filter((item) => item.attempted > 0)
        .map((item) => ({
          name: `Q${item.order}`,
          question: item.question,
          accuracy: round((item.correct / item.attempted) * 100),
        }))
        .sort((left, right) => left.accuracy - right.accuracy)
        .slice(0, 10),
    };
  }

  async exams(query: ExamQueryDto) {
    const where: Prisma.ExamWhereInput = {
      status: query.status,
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { titleHi: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.exam.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          category: true,
          subject: true,
          settings: true,
          _count: { select: { questions: true, attempts: true } },
        },
      }),
      this.prisma.exam.count({ where }),
    ]);
    return {
      items: items.map(flattenExamSettings),
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }

  async exam(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        category: true,
        subject: true,
        settings: true,
        sections: true,
        _count: { select: { questions: true, attempts: true } },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    return flattenExamSettings(exam);
  }
  async createExam(dto: CreateExamDto) {
    const { exam, settings } = splitExamDto(dto);
    const created = await this.prisma.exam.create({
      data: {
        ...exam,
        settings: { create: settings },
      } as Prisma.ExamCreateArgs["data"],
      include: { settings: true },
    });
    return flattenExamSettings(created);
  }
  async updateExam(id: string, dto: UpdateExamDto) {
    await this.ensureDraftExam(id);
    const { exam, settings } = splitExamDto(dto);
    const updated = await this.prisma.exam.update({
      where: { id },
      data: {
        ...exam,
        settings: { upsert: { create: settings, update: settings } },
      },
      include: { settings: true },
    });
    return flattenExamSettings(updated);
  }
  async declareResult(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id }, include: { settings: true },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (exam.status === "DRAFT")
      throw new BadRequestException("Publish the exam before declaring results");
    if (exam.settings?.showResultImmediately ?? true)
      return { success: true, resultAvailable: true };
    const completed = await this.prisma.attempt.count({
      where: { examId: id, status: { not: "IN_PROGRESS" } },
    });
    if (!completed)
      throw new BadRequestException("No submitted attempts are available to declare");
    await this.prisma.examSettings.upsert({
      where: { examId: id },
      create: { examId: id, showResultImmediately: true },
      update: { showResultImmediately: true },
    });
    return { success: true, resultAvailable: true };
  }

  async deleteExam(id: string) {
    const exam = await this.exam(id);
    if (exam._count.attempts > 0)
      throw new BadRequestException(
        "Exams with attempts cannot be deleted; unpublish or archive it instead",
      );
    await this.prisma.exam.delete({ where: { id } });
    return { success: true };
  }

  async publish(id: string, publish: boolean) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      include: { settings: true, questions: { include: { options: true } } },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (publish) {
      if (!exam.durationMinutes || Number(exam.totalMarks) <= 0)
        throw new BadRequestException(
          "Set a valid duration and total marks before publishing",
        );
      if (!exam.questions.length)
        throw new BadRequestException(
          "Add at least one question before publishing",
        );
      const invalid = exam.questions.find(
        (q) =>
          !q.text.trim() ||
          q.options.length !== 4 ||
          q.options.some((option) => !option.text.trim()) ||
          q.options.filter((o) => o.isCorrect).length !== 1 ||
          Number(q.marks) <= 0 ||
          Number(q.negativeMarks) < 0 ||
          (exam.settings?.requireExplanations && !q.explanation?.trim()),
      );
      if (invalid)
        throw new BadRequestException(
          `Question ${invalid.order} is incomplete or does not have exactly one correct answer`,
        );
      const calculatedTotal = exam.questions.reduce(
        (sum, question) => sum + Number(question.marks),
        0,
      );
      if (Math.abs(calculatedTotal - Number(exam.totalMarks)) > 0.001)
        throw new BadRequestException(
          `Total marks must equal the sum of question marks (${calculatedTotal})`,
        );
    }
    return this.prisma.exam.update({
      where: { id },
      data: {
        status: publish ? "PUBLISHED" : "DRAFT",
        publishedAt: publish ? new Date() : null,
      },
    });
  }

  async duplicateExam(id: string) {
    const source = await this.prisma.exam.findUnique({
      where: { id },
      include: {
        settings: true,
        sections: { orderBy: { order: "asc" } },
        questions: { include: { options: true }, orderBy: { order: "asc" } },
      },
    });
    if (!source) throw new NotFoundException("Exam not found");
    return this.prisma.$transaction(async (tx) => {
      const copy = await tx.exam.create({
        data: {
          title: `${source.title} (Copy)`,
          titleHi: source.titleHi ? `${source.titleHi} (कॉपी)` : null,
          description: source.description,
          descriptionHi: source.descriptionHi,
          instructions: source.instructions,
          instructionsHi: source.instructionsHi,
          categoryId: source.categoryId,
          subjectId: source.subjectId,
          durationMinutes: source.durationMinutes,
          totalMarks: source.totalMarks,
          marksPerQuestion: source.marksPerQuestion,
          negativeMarks: source.negativeMarks,
          difficulty: source.difficulty,
          settings: {
            create: {
              attemptLimit: source.settings?.attemptLimit,
              randomizeQuestions: source.settings?.randomizeQuestions ?? false,
              randomizeOptions: source.settings?.randomizeOptions ?? false,
              showResultImmediately:
                source.settings?.showResultImmediately ?? true,
              allowAnswerReview: source.settings?.allowAnswerReview ?? true,
              requireExplanations:
                source.settings?.requireExplanations ?? false,
              allowResume: source.settings?.allowResume ?? true,
            },
          },
        },
      });
      const sectionIds = new Map<string, string>();
      for (const section of source.sections) {
        const copied = await tx.examSection.create({
          data: {
            examId: copy.id,
            subjectId: section.subjectId,
            name: section.name,
            nameHi: section.nameHi,
            order: section.order,
          },
        });
        sectionIds.set(section.id, copied.id);
      }
      for (const q of source.questions) {
        await tx.question.create({
          data: {
            examId: copy.id,
            sectionId: q.sectionId ? sectionIds.get(q.sectionId) : undefined,
            text: q.text,
            textHi: q.textHi,
            imageUrl: q.imageUrl,
            explanation: q.explanation,
            explanationHi: q.explanationHi,
            difficulty: q.difficulty,
            marks: q.marks,
            negativeMarks: q.negativeMarks,
            order: q.order,
            subjectId: q.subjectId,
            topicId: q.topicId,
            options: {
              create: q.options.map((o) => ({
                label: o.label,
                text: o.text,
                textHi: o.textHi,
                imageUrl: o.imageUrl,
                isCorrect: o.isCorrect,
              })),
            },
          },
        });
      }
      return tx.exam.findUnique({
        where: { id: copy.id },
        include: { settings: true, _count: { select: { questions: true } } },
      });
    });
  }

  async questions(query: QuestionQueryDto) {
    const where: Prisma.QuestionWhereInput = {
      examId: query.examId,
      subjectId: query.subjectId,
      topicId: query.topicId,
      difficulty: query.difficulty,
      ...(query.search
        ? {
            OR: [
              { text: { contains: query.search } },
              { textHi: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.question.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: [{ examId: "asc" }, { order: "asc" }],
        include: {
          options: { orderBy: { label: "asc" } },
          exam: { select: { title: true, titleHi: true } },
          subject: true,
          topic: true,
        },
      }),
      this.prisma.question.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }

  async createQuestion(dto: CreateQuestionDto) {
    this.validateOptions(dto);
    await this.validateQuestionRelations(dto);
    await this.ensureMutableQuestionSet(dto.examId);
    const order =
      dto.order ??
      (await this.prisma.question.count({ where: { examId: dto.examId } })) + 1;
    const { options, ...question } = dto;
    return this.prisma.question.create({
      data: { ...question, order, options: { create: options } },
      include: { options: true },
    });
  }

  async updateQuestion(id: string, dto: UpdateQuestionDto) {
    this.validateOptions(dto);
    const exists = await this.prisma.question.findUnique({ where: { id } });
    if (!exists) throw new NotFoundException("Question not found");
    if (dto.examId !== exists.examId)
      throw new BadRequestException(
        "Move a question by duplicating it into the target exam",
      );
    await this.ensureDraftExam(exists.examId);
    await this.ensureMutableQuestionSet(exists.examId);
    await this.validateQuestionRelations(dto);
    const { options, ...question } = dto;
    return this.prisma.$transaction(async (tx) => {
      await tx.questionOption.deleteMany({ where: { questionId: id } });
      return tx.question.update({
        where: { id },
        data: { ...question, options: { create: options } },
        include: { options: true },
      });
    });
  }

  async deleteQuestion(id: string) {
    const question = await this.prisma.question.findUnique({
      where: { id },
      select: { examId: true },
    });
    if (!question) throw new NotFoundException("Question not found");
    await this.ensureDraftExam(question.examId);
    await this.ensureMutableQuestionSet(question.examId);
    try {
      await this.prisma.question.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new BadRequestException(
        "Question cannot be deleted after it has been used in an attempt",
      );
    }
  }
  async duplicateQuestion(id: string) {
    const source = await this.prisma.question.findUnique({
      where: { id },
      include: { options: true },
    });
    if (!source) throw new NotFoundException("Question not found");
    await this.ensureDraftExam(source.examId);
    await this.ensureMutableQuestionSet(source.examId);
    const order =
      (
        await this.prisma.question.aggregate({
          where: { examId: source.examId },
          _max: { order: true },
        })
      )._max.order ?? 0;
    return this.prisma.question.create({
      data: {
        examId: source.examId,
        sectionId: source.sectionId,
        subjectId: source.subjectId,
        topicId: source.topicId,
        text: `${source.text} (Copy)`,
        textHi: source.textHi ? `${source.textHi} (कॉपी)` : null,
        imageUrl: source.imageUrl,
        explanation: source.explanation,
        explanationHi: source.explanationHi,
        difficulty: source.difficulty,
        marks: source.marks,
        negativeMarks: source.negativeMarks,
        order: order + 1,
        options: {
          create: source.options.map((option) => ({
            label: option.label,
            text: option.text,
            textHi: option.textHi,
            imageUrl: option.imageUrl,
            isCorrect: option.isCorrect,
          })),
        },
      },
      include: { options: true },
    });
  }
  async bulkDeleteQuestions(ids: string[]) {
    if (
      await this.prisma.question.count({
        where: { id: { in: ids }, exam: { status: { not: "DRAFT" } } },
      })
    )
      throw new BadRequestException(
        "Unpublish affected exams before deleting their questions",
      );
    if (
      await this.prisma.question.count({
        where: { id: { in: ids }, exam: { attempts: { some: {} } } },
      })
    )
      throw new BadRequestException(
        "Questions in an exam with attempt history cannot be deleted",
      );
    const result = await this.prisma.question.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true, deleted: result.count };
  }
  private validateOptions(dto: CreateQuestionDto) {
    if (
      dto.options.length !== 4 ||
      [...dto.options.map((option) => option.label.toUpperCase())]
        .sort()
        .join("") !== "ABCD"
    )
      throw new BadRequestException(
        "Provide exactly four options labelled A, B, C, and D",
      );
    if (dto.options.filter((o) => o.isCorrect).length !== 1)
      throw new BadRequestException("Exactly one option must be correct");
  }
  private async validateQuestionRelations(dto: CreateQuestionDto) {
    await this.ensureDraftExam(dto.examId);
    if (
      dto.sectionId &&
      !(await this.prisma.examSection.findFirst({
        where: { id: dto.sectionId, examId: dto.examId },
      }))
    )
      throw new BadRequestException(
        "Section does not belong to the selected exam",
      );
    if (dto.topicId) {
      const topic = await this.prisma.topic.findUnique({
        where: { id: dto.topicId },
      });
      if (!topic || topic.subjectId !== dto.subjectId)
        throw new BadRequestException(
          "Topic does not belong to the selected subject",
        );
    }
  }
  private async ensureDraftExam(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: { id: true, status: true },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (exam.status !== "DRAFT")
      throw new BadRequestException(
        "Unpublish this exam before changing its configuration or questions",
      );
    return exam;
  }
  private async ensureMutableQuestionSet(examId: string) {
    if (await this.prisma.attempt.count({ where: { examId } }))
      throw new BadRequestException(
        "This exam has attempt history. Duplicate the exam to change its questions or sections.",
      );
  }

  categories() {
    return this.prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { exams: true } } },
    });
  }
  createCategory(dto: TaxonomyDto) {
    return this.prisma.category.create({ data: dto });
  }
  updateCategory(id: string, dto: TaxonomyDto) {
    return this.prisma.category.update({ where: { id }, data: dto });
  }
  async deleteCategory(id: string) {
    try {
      await this.prisma.category.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new BadRequestException("Category is in use and cannot be deleted");
    }
  }
  subjects() {
    return this.prisma.subject.findMany({
      orderBy: { name: "asc" },
      include: { topics: true, _count: { select: { questions: true } } },
    });
  }
  createSubject(dto: TaxonomyDto) {
    return this.prisma.subject.create({
      data: { name: dto.name, nameHi: dto.nameHi },
    });
  }
  updateSubject(id: string, dto: TaxonomyDto) {
    return this.prisma.subject.update({
      where: { id },
      data: { name: dto.name, nameHi: dto.nameHi },
    });
  }
  async deleteSubject(id: string) {
    const linked = await this.prisma.subject.findUnique({
      where: { id },
      select: {
        _count: { select: { exams: true, sections: true, questions: true } },
      },
    });
    if (!linked) throw new NotFoundException("Subject not found");
    if (
      linked._count.exams ||
      linked._count.sections ||
      linked._count.questions
    )
      throw new BadRequestException("Subject is in use and cannot be deleted");
    try {
      await this.prisma.subject.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new BadRequestException("Subject is in use and cannot be deleted");
    }
  }
  createTopic(dto: TopicDto) {
    return this.prisma.topic.create({ data: dto });
  }
  updateTopic(id: string, dto: TopicDto) {
    return this.prisma.topic.update({ where: { id }, data: dto });
  }
  async deleteTopic(id: string) {
    const linked = await this.prisma.topic.findUnique({
      where: { id },
      select: { _count: { select: { questions: true } } },
    });
    if (!linked) throw new NotFoundException("Topic not found");
    if (linked._count.questions)
      throw new BadRequestException("Topic is in use and cannot be deleted");
    try {
      await this.prisma.topic.delete({ where: { id } });
      return { success: true };
    } catch {
      throw new BadRequestException("Topic is in use and cannot be deleted");
    }
  }

  sections(examId: string) {
    return this.prisma.examSection.findMany({
      where: { examId },
      orderBy: { order: "asc" },
      include: { subject: true, _count: { select: { questions: true } } },
    });
  }
  async createSection(examId: string, dto: ExamSectionDto) {
    await this.ensureDraftExam(examId);
    await this.ensureMutableQuestionSet(examId);
    return this.prisma.examSection.create({
      data: { examId, ...dto },
      include: { subject: true },
    });
  }
  async updateSection(examId: string, id: string, dto: ExamSectionDto) {
    await this.ensureDraftExam(examId);
    await this.ensureMutableQuestionSet(examId);
    const section = await this.prisma.examSection.findFirst({
      where: { id, examId },
    });
    if (!section) throw new NotFoundException("Section not found");
    return this.prisma.examSection.update({
      where: { id },
      data: dto,
      include: { subject: true },
    });
  }
  async deleteSection(examId: string, id: string) {
    await this.ensureDraftExam(examId);
    await this.ensureMutableQuestionSet(examId);
    const result = await this.prisma.examSection.deleteMany({
      where: { id, examId },
    });
    if (!result.count) throw new NotFoundException("Section not found");
    return { success: true };
  }

  async students(query: PageQueryDto) {
    const where: Prisma.UserWhereInput = {
      role: { code: "STUDENT" },
      ...(query.search
        ? {
            OR: [
              { fullName: { contains: query.search } },
              { email: { contains: query.search } },
            ],
          }
        : {}),
    };
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          fullName: true,
          email: true,
          status: true,
          createdAt: true,
          _count: { select: { attempts: true } },
        },
      }),
      this.prisma.user.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }
  async setStudentStatus(id: string, status: UserStatus) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: { code: "STUDENT" } },
      select: { id: true },
    });
    if (!user) throw new NotFoundException("Student not found");
    return this.prisma.user.update({
      where: { id },
      data: { status },
      select: { id: true, status: true },
    });
  }
  async student(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, role: { code: "STUDENT" } },
      select: {
        id: true,
        fullName: true,
        email: true,
        status: true,
        createdAt: true,
      },
    });
    if (!user) throw new NotFoundException("Student not found");
    const attempts = await this.prisma.attempt.findMany({
      where: { userId: id },
      orderBy: { createdAt: "desc" },
      include: { exam: { select: { title: true } } },
    });
    const completed = attempts.filter(
      (attempt) => attempt.status !== "IN_PROGRESS",
    );
    return {
      user,
      metrics: {
        attempts: completed.length,
        averageScore: avg(completed.map((a) => Number(a.percentage))),
        bestScore: completed.length
          ? Math.max(...completed.map((a) => Number(a.percentage)))
          : 0,
        averageAccuracy: avg(completed.map((a) => Number(a.accuracy))),
        totalCorrect: completed.reduce(
          (sum, a) => sum + (a.correctCount ?? 0),
          0,
        ),
        totalWrong: completed.reduce((sum, a) => sum + (a.wrongCount ?? 0), 0),
      },
      attempts: attempts.map((a) => ({
        id: a.id,
        exam: a.exam.title,
        attemptNumber: a.attemptNumber,
        status: a.status,
        score: Number(a.score),
        totalMarks: Number(a.totalMarks),
        percentage: Number(a.percentage),
        accuracy: Number(a.accuracy),
        timeTakenSeconds: a.timeTakenSeconds,
        date: a.submittedAt ?? a.createdAt,
      })),
    };
  }

  async attempts(query: PageQueryDto) {
    const where: Prisma.AttemptWhereInput = query.search
      ? {
          OR: [
            { user: { fullName: { contains: query.search } } },
            { user: { email: { contains: query.search } } },
            { exam: { title: { contains: query.search } } },
          ],
        }
      : {};
    const [items, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where,
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        orderBy: { createdAt: "desc" },
        include: {
          user: { select: { fullName: true, email: true } },
          exam: { select: { title: true } },
        },
      }),
      this.prisma.attempt.count({ where }),
    ]);
    return {
      items,
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }

  async analytics() {
    const attempts = await this.prisma.attempt.findMany({
      where: { status: { not: "IN_PROGRESS" } },
      include: { exam: { select: { id: true, title: true } } },
    });
    const byExam = new Map<
      string,
      { name: string; scores: number[]; accuracy: number[]; times: number[] }
    >();
    attempts.forEach((a) => {
      const row = byExam.get(a.examId) ?? {
        name: a.exam.title,
        scores: [],
        accuracy: [],
        times: [],
      };
      row.scores.push(Number(a.percentage));
      row.accuracy.push(Number(a.accuracy));
      row.times.push(a.timeTakenSeconds ?? 0);
      byExam.set(a.examId, row);
    });
    const questionAnswers = await this.prisma.attemptAnswer.findMany({
      where: { attempt: { status: { not: "IN_PROGRESS" } } },
      select: {
        isCorrect: true,
        selectedOptionId: true,
        question: {
          select: {
            id: true,
            order: true,
            text: true,
            difficulty: true,
            exam: { select: { title: true } },
          },
        },
      },
    });
    const questionMap = new Map<
      string,
      {
        id: string;
        question: string;
        exam: string;
        order: number;
        difficulty: Difficulty;
        correct: number;
        attempted: number;
      }
    >();
    questionAnswers.forEach((answer) => {
      const row = questionMap.get(answer.question.id) ?? {
        id: answer.question.id,
        question: answer.question.text,
        exam: answer.question.exam.title,
        order: answer.question.order,
        difficulty: answer.question.difficulty,
        correct: 0,
        attempted: 0,
      };
      if (answer.selectedOptionId) {
        row.attempted++;
        if (answer.isCorrect) row.correct++;
      }
      questionMap.set(row.id, row);
    });
    return {
      exams: [...byExam.values()].map((x) => ({
        name: x.name,
        attempts: x.scores.length,
        averageScore: avg(x.scores),
        highestScore: Math.max(...x.scores),
        lowestScore: Math.min(...x.scores),
        averageAccuracy: avg(x.accuracy),
        averageTime: avg(x.times),
      })),
      questions: [...questionMap.values()]
        .map((q) => ({
          ...q,
          correctRate: q.attempted ? avg([(q.correct / q.attempted) * 100]) : 0,
        }))
        .sort((a, b) => a.correctRate - b.correctRate)
        .slice(0, 20),
    };
  }

  async examAnalytics(id: string) {
    const exam = await this.prisma.exam.findUnique({
      where: { id },
      select: {
        id: true,
        title: true,
        totalMarks: true,
        questions: {
          orderBy: { order: "asc" },
          select: { id: true, order: true, text: true },
        },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    const attempts = await this.prisma.attempt.findMany({
      where: { examId: id, status: { not: "IN_PROGRESS" } },
      orderBy: { submittedAt: "asc" },
      select: {
        id: true,
        score: true,
        percentage: true,
        accuracy: true,
        timeTakenSeconds: true,
        submittedAt: true,
        answers: {
          select: { questionId: true, selectedOptionId: true, isCorrect: true },
        },
      },
    });
    const questionStats = new Map(
      exam.questions.map((q) => [
        q.id,
        { ...q, correct: 0, wrong: 0, unanswered: 0 },
      ]),
    );
    attempts.forEach((attempt) => {
      const answerMap = new Map(
        attempt.answers.map((answer) => [answer.questionId, answer]),
      );
      exam.questions.forEach((question) => {
        const row = questionStats.get(question.id)!;
        const answer = answerMap.get(question.id);
        if (!answer?.selectedOptionId) row.unanswered++;
        else if (answer.isCorrect) row.correct++;
        else row.wrong++;
      });
    });
    const scores = attempts.map((a) => Number(a.percentage));
    return {
      exam: { id: exam.id, title: exam.title },
      summary: {
        attempts: attempts.length,
        averageScore: avg(scores),
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        averageAccuracy: avg(attempts.map((a) => Number(a.accuracy))),
        averageTime: avg(attempts.map((a) => a.timeTakenSeconds ?? 0)),
      },
      overTime: attempts.map((attempt, index) => ({
        attempt: index + 1,
        date: attempt.submittedAt,
        score: Number(attempt.percentage),
        accuracy: Number(attempt.accuracy),
      })),
      questions: [...questionStats.values()].map((q) => ({
        ...q,
        correctRate:
          q.correct + q.wrong
            ? round((q.correct / (q.correct + q.wrong)) * 100)
            : 0,
      })),
    };
  }
}

const avg = (values: number[]) =>
  values.length ? round(values.reduce((a, b) => a + b, 0) / values.length) : 0;
const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;

const EXAM_SETTING_KEYS = [
  "attemptLimit",
  "randomizeQuestions",
  "randomizeOptions",
  "showResultImmediately",
  "allowAnswerReview",
  "requireExplanations",
  "allowResume",
] as const;

function splitExamDto(dto: CreateExamDto | UpdateExamDto) {
  const exam: Record<string, unknown> = { ...dto };
  const settings: Record<string, unknown> = {};
  for (const key of EXAM_SETTING_KEYS) {
    if (key in exam) {
      settings[key] = exam[key];
      delete exam[key];
    }
  }
  return { exam, settings };
}

function flattenExamSettings(exam: any) {
  const { settings, ...data } = exam;
  return { ...data, ...(settings ?? {}) };
}
