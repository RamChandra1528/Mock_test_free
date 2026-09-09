import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { AttemptStatus, Difficulty, Prisma } from "@prisma/client";
import { createHash } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import {
  AttemptHistoryQueryDto,
  ExamListQueryDto,
  SaveAnswerDto,
  UpdateLanguageDto,
  UpdateProfileDto,
} from "./student.dto";
import { calculateScore } from "./scoring";

@Injectable()
export class StudentService {
  private readonly logger = new Logger(StudentService.name);
  constructor(private readonly prisma: PrismaService) {}

  categories() {
    return this.prisma.category.findMany({
      where: { exams: { some: { status: "PUBLISHED" } } },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameHi: true },
    });
  }
  subjects() {
    return this.prisma.subject.findMany({
      where: {
        OR: [
          { exams: { some: { status: "PUBLISHED" } } },
          { questions: { some: { exam: { status: "PUBLISHED" } } } },
        ],
      },
      orderBy: { name: "asc" },
      select: { id: true, name: true, nameHi: true },
    });
  }

  async dashboard(userId: string) {
    const [available, attempts] = await Promise.all([
      this.prisma.exam.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { publishedAt: "desc" },
        take: 6,
        include: {
          category: true,
          subject: true,
          settings: true,
          _count: { select: { questions: true, attempts: true } },
          attempts: {
            where: { userId },
            select: {
              id: true,
              status: true,
              score: true,
              totalMarks: true,
              percentage: true,
              expectedEndTime: true,
            },
          },
        },
      }),
      this.prisma.attempt.findMany({
        where: { userId, status: { not: "IN_PROGRESS" } },
        orderBy: { submittedAt: "desc" },
        include: {
          exam: {
            select: {
              title: true,
              titleHi: true,
              settings: {
                select: {
                  showResultImmediately: true,
                  allowAnswerReview: true,
                },
              },
            },
          },
        },
      }),
    ]);
    const released = attempts.filter((a) => a.exam.settings?.showResultImmediately ?? true);
    const scores = released.map((a) => Number(a.percentage));
    const totalAnswered = attempts.reduce(
      (sum, a) => sum + (a.correctCount ?? 0) + (a.wrongCount ?? 0),
      0,
    );
    return {
      stats: {
        testsAttempted: attempts.length,
        averageScore: avg(scores),
        bestScore: scores.length ? Math.max(...scores) : 0,
        averageAccuracy: avg(released.map((a) => Number(a.accuracy))),
        totalQuestionsAttempted: totalAnswered,
      },
      availableExams: available.map(toExamCard),
      recentAttempts: attempts.slice(0, 6).map(toAttemptRow),
    };
  }

  async exams(userId: string, query: ExamListQueryDto) {
    const attemptedIds = query.status
      ? (
          await this.prisma.attempt.findMany({
            where: { userId, status: { not: "IN_PROGRESS" } },
            distinct: ["examId"],
            select: { examId: true },
          })
        ).map((a) => a.examId)
      : [];
    const where: Prisma.ExamWhereInput = {
      status: "PUBLISHED",
      categoryId: query.categoryId,
      subjectId: query.subjectId,
      ...(query.difficulty &&
      ["EASY", "MEDIUM", "HARD"].includes(query.difficulty)
        ? { difficulty: query.difficulty as Difficulty }
        : {}),
      ...(query.search
        ? {
            OR: [
              { title: { contains: query.search } },
              { titleHi: { contains: query.search } },
              { category: { name: { contains: query.search } } },
              { category: { nameHi: { contains: query.search } } },
              { subject: { name: { contains: query.search } } },
              { subject: { nameHi: { contains: query.search } } },
            ],
          }
        : {}),
      ...(query.status === "attempted"
        ? { id: { in: attemptedIds } }
        : query.status === "not-attempted"
          ? { id: { notIn: attemptedIds } }
          : {}),
      ...(query.minDuration || query.maxDuration
        ? {
            durationMinutes: { gte: query.minDuration, lte: query.maxDuration },
          }
        : {}),
    };
    const orderBy: Prisma.ExamOrderByWithRelationInput =
      query.sort === "difficulty"
        ? { difficulty: "asc" }
        : query.sort === "popular"
          ? { attempts: { _count: "desc" } }
          : { publishedAt: "desc" };
    let rankedPageIds: string[] | undefined;
    let rankedTotal: number | undefined;
    if (query.sort === "highest-score") {
      const candidates = await this.prisma.exam.findMany({
        where,
        orderBy: { publishedAt: "desc" },
        select: { id: true },
      });
      const scores = await this.prisma.attempt.groupBy({
        by: ["examId"],
        where: {
          userId,
          status: { not: "IN_PROGRESS" },
          examId: { in: candidates.map((exam) => exam.id) },
          exam: { OR: [{ settings: { is: null } }, { settings: { is: { showResultImmediately: true } } }] },
        },
        _max: { percentage: true },
      });
      const scoreByExam = new Map(
        scores.map((score) => [score.examId, Number(score._max.percentage)]),
      );
      const ranked = candidates.sort(
        (left, right) =>
          (scoreByExam.get(right.id) ?? -1) - (scoreByExam.get(left.id) ?? -1),
      );
      rankedTotal = ranked.length;
      rankedPageIds = ranked
        .slice((query.page - 1) * query.limit, query.page * query.limit)
        .map((exam) => exam.id);
    }
    const [items, total] = await Promise.all([
      this.prisma.exam.findMany({
        where: rankedPageIds ? { ...where, id: { in: rankedPageIds } } : where,
        skip: rankedPageIds ? undefined : (query.page - 1) * query.limit,
        take: rankedPageIds ? undefined : query.limit,
        orderBy,
        include: {
          category: true,
          subject: true,
          settings: true,
          _count: { select: { questions: true, attempts: true } },
          attempts: {
            where: { userId },
            orderBy: { attemptNumber: "desc" },
            select: {
              id: true,
              status: true,
              score: true,
              totalMarks: true,
              percentage: true,
              expectedEndTime: true,
            },
          },
        },
      }),
      rankedTotal === undefined
        ? this.prisma.exam.count({ where })
        : Promise.resolve(rankedTotal),
    ]);
    const mapped = items.map(toExamCard);
    if (rankedPageIds)
      mapped.sort(
        (left, right) =>
          rankedPageIds.indexOf(left.id) - rankedPageIds.indexOf(right.id),
      );
    return {
      items: mapped,
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }

  async examDetails(userId: string, id: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id, status: "PUBLISHED" },
      include: {
        category: true,
        subject: true,
        settings: true,
        sections: { orderBy: { order: "asc" } },
        _count: { select: { questions: true } },
        attempts: {
          where: { userId },
          orderBy: { attemptNumber: "desc" },
          select: {
            id: true,
            status: true,
            expectedEndTime: true,
            percentage: true,
          },
        },
      },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    const { settings, attempts, ...details } = exam;
    const safeAttempts = attempts.map((attempt) => ({ ...attempt,
      percentage: (settings?.showResultImmediately ?? true) ? attempt.percentage : null,
    }));
    return {
      ...details,
      ...(settings ?? {}),
      questionCount: exam._count.questions,
      attempts: safeAttempts,
      latestAttempt: safeAttempts[0] ?? null,
    };
  }

  async start(userId: string, examId: string) {
    const exam = await this.prisma.exam.findFirst({
      where: { id: examId, status: "PUBLISHED" },
      include: { settings: true, _count: { select: { questions: true } } },
    });
    if (!exam) throw new NotFoundException("Exam not found");
    if (!exam._count.questions)
      throw new BadRequestException("This exam has no questions");
    const active = await this.prisma.attempt.findFirst({
      where: { userId, examId, status: "IN_PROGRESS" },
      orderBy: { attemptNumber: "desc" },
    });
    if (active) {
      if (active.expectedEndTime <= new Date()) {
        await this.submitInternal(active.id, userId, true);
      } else if (exam.settings?.allowResume ?? true)
        return this.getAttempt(userId, active.id);
      else throw new BadRequestException("An attempt is already in progress");
    }
    const count = await this.prisma.attempt.count({
      where: { userId, examId },
    });
    if (exam.settings?.attemptLimit && count >= exam.settings.attemptLimit)
      throw new BadRequestException(
        "You have reached the attempt limit for this exam",
      );
    const startTime = new Date();
    try {
      const attempt = await this.prisma.attempt.create({
        data: {
          userId,
          examId,
          attemptNumber: count + 1,
          startTime,
          expectedEndTime: new Date(
            startTime.getTime() + exam.durationMinutes * 60_000,
          ),
        },
      });
      return this.getAttempt(userId, attempt.id);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
        const concurrent = await this.prisma.attempt.findFirst({
          where: { userId, examId, status: "IN_PROGRESS" },
          orderBy: { attemptNumber: "desc" },
        });
        if (concurrent && (exam.settings?.allowResume ?? true))
          return this.getAttempt(userId, concurrent.id);
        throw new ConflictException("An attempt was started concurrently");
      }
      throw error;
    }
  }

  async getAttempt(userId: string, attemptId: string) {
    const attempt = await this.ownedAttempt(userId, attemptId, {
      exam: {
        include: {
          settings: true,
          questions: {
            orderBy: { order: "asc" },
            select: {
              id: true,
              text: true,
              textHi: true,
              imageUrl: true,
              order: true,
              sectionId: true,
              subject: { select: { name: true, nameHi: true } },
              options: {
                select: {
                  id: true,
                  label: true,
                  text: true,
                  textHi: true,
                  imageUrl: true,
                },
              },
            },
          },
          sections: { orderBy: { order: "asc" } },
        },
      },
      answers: true,
    });
    if (
      attempt.status === "IN_PROGRESS" &&
      attempt.expectedEndTime <= new Date()
    ) {
      await this.submitInternal(attempt.id, userId, true);
      return {
        id: attempt.id,
        status: "EXPIRED",
        expired: true,
        resultAvailable: attempt.exam.settings?.showResultImmediately ?? true,
      };
    }
    if (attempt.status !== "IN_PROGRESS")
      return {
        id: attempt.id,
        status: attempt.status,
        resultAvailable: attempt.exam.settings?.showResultImmediately ?? true,
      };
    const questions = stableShuffle(
      attempt.exam.questions,
      attempt.exam.settings?.randomizeQuestions ? attempt.id : "",
    );
    const safeQuestions = questions.map((q) => ({
      id: q.id,
      text: q.text,
      textHi: q.textHi,
      imageUrl: q.imageUrl,
      order: q.order,
      sectionId: q.sectionId,
      subject: q.subject,
      options: stableShuffle(
        q.options,
        attempt.exam.settings?.randomizeOptions ? `${attempt.id}${q.id}` : "",
      ).map((option) => ({
        id: option.id,
        label: option.label,
        text: option.text,
        textHi: option.textHi,
        imageUrl: option.imageUrl,
      })),
    }));
    return {
      id: attempt.id,
      status: attempt.status,
      attemptNumber: attempt.attemptNumber,
      startTime: attempt.startTime,
      expectedEndTime: attempt.expectedEndTime,
      serverTime: new Date(),
      currentQuestion: attempt.currentQuestion,
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        titleHi: attempt.exam.titleHi,
        durationMinutes: attempt.exam.durationMinutes,
        totalMarks: attempt.exam.totalMarks,
        sections: attempt.exam.sections,
      },
      questions: safeQuestions,
      answers: attempt.answers.map((a) => ({
        questionId: a.questionId,
        selectedOptionId: a.selectedOptionId,
        markedForReview: a.markedForReview,
        visited: a.visited,
        savedAt: a.savedAt,
      })),
    };
  }

  async saveAnswer(userId: string, attemptId: string, dto: SaveAnswerDto) {
    const attempt = await this.ownedAttempt(userId, attemptId, { exam: true });
    if (attempt.status !== "IN_PROGRESS")
      throw new BadRequestException("This attempt is read-only");
    if (attempt.expectedEndTime <= new Date()) {
      await this.submitInternal(attempt.id, userId, true);
      throw new BadRequestException(
        "Time is up. Your exam was submitted automatically",
      );
    }
    const question = await this.prisma.question.findFirst({
      where: { id: dto.questionId, examId: attempt.examId },
      include: { options: { select: { id: true } } },
    });
    if (!question)
      throw new BadRequestException("Question does not belong to this exam");
    if (
      dto.selectedOptionId &&
      !question.options.some((o) => o.id === dto.selectedOptionId)
    )
      throw new BadRequestException("Option does not belong to this question");
    await this.prisma.$transaction([
      this.prisma.attemptAnswer.upsert({
        where: {
          attemptId_questionId: { attemptId, questionId: dto.questionId },
        },
        create: {
          attemptId,
          questionId: dto.questionId,
          selectedOptionId: dto.selectedOptionId ?? null,
          markedForReview: dto.markedForReview,
          visited: dto.visited,
        },
        update: {
          selectedOptionId: dto.selectedOptionId ?? null,
          markedForReview: dto.markedForReview,
          visited: dto.visited,
        },
      }),
      this.prisma.attempt.update({
        where: { id: attemptId },
        data: { currentQuestion: dto.currentQuestion },
      }),
    ]);
    return {
      success: true,
      savedAt: new Date(),
      remainingSeconds: Math.max(
        0,
        Math.floor((attempt.expectedEndTime.getTime() - Date.now()) / 1000),
      ),
    };
  }

  submit(userId: string, attemptId: string) {
    return this.submitInternal(attemptId, userId, false);
  }

  private async submitInternal(
    attemptId: string,
    userId: string,
    expired: boolean,
  ) {
    const attempt = await this.ownedAttempt(userId, attemptId, {
      exam: {
        include: { settings: true, questions: { include: { options: true } } },
      },
      answers: true,
    });
    if (attempt.status !== "IN_PROGRESS")
      throw new BadRequestException("This attempt was already submitted");
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const items = attempt.exam.questions.map((q) => ({
      selectedOptionId: answerMap.get(q.id)?.selectedOptionId,
      correctOptionId: q.options.find((o) => o.isCorrect)!.id,
      marks: Number(q.marks),
      negativeMarks: Number(q.negativeMarks),
    }));
    const result = calculateScore(items, Number(attempt.exam.totalMarks));
    const now = new Date();
    const timeTakenSeconds = Math.min(
      Math.floor((now.getTime() - attempt.startTime.getTime()) / 1000),
      attempt.exam.durationMinutes * 60,
    );
    const existingStats = await this.prisma.userStatistic.findUnique({
      where: { userId },
    });
    const previousAttempts = existingStats?.totalAttempts ?? 0;
    const totalAttempts = previousAttempts + 1;
    const averageScore = round(
      (Number(existingStats?.averageScore ?? 0) * previousAttempts +
        result.percentage) /
        totalAttempts,
    );
    const averageAccuracy = round(
      (Number(existingStats?.averageAccuracy ?? 0) * previousAttempts +
        result.accuracy) /
        totalAttempts,
    );
    await this.prisma.$transaction(async (tx) => {
      const claimed = await tx.attempt.updateMany({
        where: { id: attempt.id, status: "IN_PROGRESS" },
        data: {
          status: expired ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED,
        },
      });
      if (!claimed.count)
        throw new BadRequestException("This attempt was already submitted");
      for (const q of attempt.exam.questions) {
        const answer = answerMap.get(q.id);
        if (!answer) continue;
        const correctId = q.options.find((o) => o.isCorrect)!.id;
        const isCorrect = answer.selectedOptionId
          ? answer.selectedOptionId === correctId
          : null;
        await tx.attemptAnswer.update({
          where: { id: answer.id },
          data: {
            isCorrect,
            marksAwarded: !answer.selectedOptionId
              ? 0
              : isCorrect
                ? q.marks
                : new Prisma.Decimal(-Number(q.negativeMarks)),
          },
        });
      }
      await tx.attempt.update({
        where: { id: attempt.id },
        data: {
          submittedAt: now,
          timeTakenSeconds,
          score: result.score,
          totalMarks: attempt.exam.totalMarks,
          correctCount: result.correct,
          wrongCount: result.wrong,
          unansweredCount: result.unanswered,
          accuracy: result.accuracy,
          percentage: result.percentage,
        },
      });
      await tx.userStatistic.upsert({
        where: { userId },
        create: {
          userId,
          totalAttempts: 1,
          totalQuestions: items.length,
          totalCorrect: result.correct,
          totalWrong: result.wrong,
          averageScore: result.percentage,
          highestScore: result.percentage,
          lowestScore: result.percentage,
          averageAccuracy: result.accuracy,
        },
        update: {
          totalAttempts,
          totalQuestions: { increment: items.length },
          totalCorrect: { increment: result.correct },
          totalWrong: { increment: result.wrong },
          averageScore,
          highestScore: Math.max(
            Number(existingStats?.highestScore ?? result.percentage),
            result.percentage,
          ),
          lowestScore: Math.min(
            Number(existingStats?.lowestScore ?? result.percentage),
            result.percentage,
          ),
          averageAccuracy,
        },
      });
    });
    if (!(attempt.exam.settings?.showResultImmediately ?? true))
      return {
        id: attempt.id,
        status: expired ? AttemptStatus.EXPIRED : AttemptStatus.SUBMITTED,
        resultAvailable: false,
      };
    return this.result(userId, attemptId);
  }

  async result(userId: string, attemptId: string) {
    const attempt = await this.ownedAttempt(userId, attemptId, {
      exam: {
        include: {
          settings: true,
          sections: true,
          questions: {
            select: {
              id: true,
              sectionId: true,
              subject: { select: { name: true, nameHi: true } },
            },
          },
        },
      },
      answers: true,
    });
    if (attempt.status === "IN_PROGRESS")
      throw new BadRequestException("Submit the exam before viewing results");
    if (!(attempt.exam.settings?.showResultImmediately ?? true))
      throw new ForbiddenException(
        "Results have not been released for this exam",
      );
    const answerMap = new Map(attempt.answers.map((a) => [a.questionId, a]));
    const groups = new Map<
      string,
      {
        section: string;
        sectionHi: string | null;
        correct: number;
        wrong: number;
        unattempted: number;
        score: number;
      }
    >();
    attempt.exam.questions.forEach((q) => {
      const section = attempt.exam.sections.find((s) => s.id === q.sectionId);
      const name = section?.name ?? q.subject?.name ?? "General";
      const nameHi = section?.nameHi ?? q.subject?.nameHi ?? null;
      const key = section?.id ?? q.subject?.name ?? "general";
      const row = groups.get(key) ?? {
        section: name,
        sectionHi: nameHi,
        correct: 0,
        wrong: 0,
        unattempted: 0,
        score: 0,
      };
      const answer = answerMap.get(q.id);
      if (!answer?.selectedOptionId) row.unattempted++;
      else if (answer.isCorrect) row.correct++;
      else row.wrong++;
      row.score += Number(answer?.marksAwarded ?? 0);
      groups.set(key, row);
    });
    return {
      id: attempt.id,
      exam: {
        id: attempt.exam.id,
        title: attempt.exam.title,
        titleHi: attempt.exam.titleHi,
        allowAnswerReview: attempt.exam.settings?.allowAnswerReview ?? true,
      },
      attemptNumber: attempt.attemptNumber,
      status: attempt.status,
      score: Number(attempt.score),
      totalMarks: Number(attempt.totalMarks),
      correct: attempt.correctCount,
      wrong: attempt.wrongCount,
      unanswered: attempt.unansweredCount,
      accuracy: Number(attempt.accuracy),
      percentage: Number(attempt.percentage),
      timeTakenSeconds: attempt.timeTakenSeconds,
      submittedAt: attempt.submittedAt,
      sections: [...groups.values()].map((r) => ({
        ...r,
        score: round(r.score),
        accuracy:
          r.correct + r.wrong
            ? round((r.correct / (r.correct + r.wrong)) * 100)
            : 0,
      })),
    };
  }

  async review(userId: string, attemptId: string, questionId?: string) {
    const attempt = await this.ownedAttempt(userId, attemptId, {
      exam: {
        include: {
          settings: true,
          questions: {
            ...(questionId ? { where: { id: questionId } } : {}),
            orderBy: { order: "asc" },
            include: {
              options: { orderBy: { label: "asc" } },
              subject: { select: { name: true, nameHi: true } },
            },
          },
        },
      },
      answers: questionId ? { where: { questionId } } : true,
    });
    if (attempt.status === "IN_PROGRESS")
      throw new ForbiddenException(
        "Answer keys are not available during an active exam",
      );
    if (!(attempt.exam.settings?.showResultImmediately ?? true))
      throw new ForbiddenException(
        "Answer keys are unavailable until results are released",
      );
    if (!(attempt.exam.settings?.allowAnswerReview ?? true))
      throw new ForbiddenException("Answer review is disabled for this exam");
    const answers = new Map(attempt.answers.map((a) => [a.questionId, a]));
    return {
      exam: { title: attempt.exam.title, titleHi: attempt.exam.titleHi },
      questions: attempt.exam.questions.map((q) => {
        const answer = answers.get(q.id);
        return {
          id: q.id,
          order: q.order,
          text: q.text,
          textHi: q.textHi,
          imageUrl: q.imageUrl,
          explanation: q.explanation,
          explanationHi: q.explanationHi,
          subject: q.subject?.name ?? "General",
          subjectHi: q.subject?.nameHi ?? null,
          options: q.options.map((o) => ({
            id: o.id,
            label: o.label,
            text: o.text,
            textHi: o.textHi,
            imageUrl: o.imageUrl,
            isCorrect: o.isCorrect,
          })),
          selectedOptionId: answer?.selectedOptionId ?? null,
          markedForReview: answer?.markedForReview ?? false,
          status: !answer?.selectedOptionId
            ? "UNATTEMPTED"
            : answer.isCorrect
              ? "CORRECT"
              : "WRONG",
          marksAwarded: Number(answer?.marksAwarded ?? 0),
        };
      }),
    };
  }

  async history(userId: string, query: AttemptHistoryQueryDto) {
    const where: Prisma.AttemptWhereInput = {
      userId,
      status: { not: AttemptStatus.IN_PROGRESS },
      ...(query.search
        ? {
            exam: {
              OR: [
                { title: { contains: query.search } },
                { titleHi: { contains: query.search } },
              ],
            },
          }
        : {}),
    };
    const orderBy: Prisma.AttemptOrderByWithRelationInput =
      query.sort === "score"
        ? { percentage: "desc" }
        : query.sort === "accuracy"
          ? { accuracy: "desc" }
          : { submittedAt: "desc" };
    const sortByResult = query.sort === "score" || query.sort === "accuracy";
    const [items, total] = await Promise.all([
      this.prisma.attempt.findMany({
        where,
        skip: sortByResult ? undefined : (query.page - 1) * query.limit,
        take: sortByResult ? undefined : query.limit,
        orderBy: sortByResult ? { submittedAt: "desc" } : orderBy,
        include: {
          exam: {
            select: {
              title: true,
              titleHi: true,
              settings: {
                select: {
                  showResultImmediately: true,
                  allowAnswerReview: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.attempt.count({ where }),
    ]);
    const rows = items.map(toAttemptRow);
    if (sortByResult) {
      const metric = query.sort === "score" ? "percentage" : "accuracy";
      rows.sort((a, b) => {
        if (a[metric] === null) return b[metric] === null ? 0 : 1;
        if (b[metric] === null) return -1;
        return b[metric]! - a[metric]!;
      });
    }
    return {
      items: sortByResult ? rows.slice((query.page - 1) * query.limit, query.page * query.limit) : rows,
      total,
      page: query.page,
      pages: Math.ceil(total / query.limit),
    };
  }

  async performance(userId: string) {
    const attempts = await this.prisma.attempt.findMany({
      where: { userId, status: { not: "IN_PROGRESS" },
        exam: { OR: [{ settings: { is: null } }, { settings: { is: { showResultImmediately: true } } }] },
      },
      orderBy: { submittedAt: "asc" },
      include: {
        exam: { select: { title: true, titleHi: true } },
        answers: {
          include: { question: { include: { subject: true, topic: true } } },
        },
      },
    });
    const subjectMap = new Map<
      string,
      {
        name: string;
        nameHi: string | null;
        correct: number;
        wrong: number;
        total: number;
      }
    >();
    const topicMap = new Map<
      string,
      {
        name: string;
        nameHi: string | null;
        correct: number;
        wrong: number;
        total: number;
      }
    >();
    attempts
      .flatMap((a) => a.answers)
      .forEach((a) => {
        const subjectKey = a.question.subject?.id ?? "general";
        const row = subjectMap.get(subjectKey) ?? {
          name: a.question.subject?.name ?? "General",
          nameHi: a.question.subject?.nameHi ?? null,
          correct: 0,
          wrong: 0,
          total: 0,
        };
        const topicKey = a.question.topic?.id;
        const topicRow = topicKey
          ? (topicMap.get(topicKey) ?? {
              name: a.question.topic!.name,
              nameHi: a.question.topic?.nameHi ?? null,
              correct: 0,
              wrong: 0,
              total: 0,
            })
          : null;
        if (a.selectedOptionId) {
          row.total++;
          a.isCorrect ? row.correct++ : row.wrong++;
          if (topicRow) {
            topicRow.total++;
            a.isCorrect ? topicRow.correct++ : topicRow.wrong++;
          }
        }
        subjectMap.set(subjectKey, row);
        if (topicKey && topicRow) topicMap.set(topicKey, topicRow);
      });
    const subjects = [...subjectMap.entries()]
      .map(([, s]) => ({
        subject: s.name,
        subjectHi: s.nameHi,
        accuracy: s.total ? round((s.correct / s.total) * 100) : 0,
        correct: s.correct,
        wrong: s.wrong,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
    const topics = [...topicMap.entries()]
      .map(([, values]) => ({
        topic: values.name,
        topicHi: values.nameHi,
        accuracy: values.total
          ? round((values.correct / values.total) * 100)
          : 0,
        correct: values.correct,
        wrong: values.wrong,
      }))
      .sort((a, b) => b.accuracy - a.accuracy);
    const areas = [
      ...subjects.map((area) => ({
        name: area.subject,
        nameHi: area.subjectHi,
        type: "Subject",
        accuracy: area.accuracy,
      })),
      ...topics.map((area) => ({
        name: area.topic,
        nameHi: area.topicHi,
        type: "Topic",
        accuracy: area.accuracy,
      })),
    ];
    const activity = new Map<string, number>();
    for (const attempt of attempts) {
      if (!attempt.submittedAt) continue;
      const date = attempt.submittedAt.toISOString().slice(0, 10);
      activity.set(date, (activity.get(date) ?? 0) + 1);
    }
    const scores = attempts.map((a) => Number(a.percentage));
    return {
      metrics: {
        averageScore: avg(scores),
        highestScore: scores.length ? Math.max(...scores) : 0,
        lowestScore: scores.length ? Math.min(...scores) : 0,
        averageAccuracy: avg(attempts.map((a) => Number(a.accuracy))),
        totalTests: attempts.length,
        totalQuestions: attempts.reduce(
          (n, a) =>
            n +
            (a.correctCount ?? 0) +
            (a.wrongCount ?? 0) +
            (a.unansweredCount ?? 0),
          0,
        ),
        totalCorrect: attempts.reduce((n, a) => n + (a.correctCount ?? 0), 0),
        totalWrong: attempts.reduce((n, a) => n + (a.wrongCount ?? 0), 0),
        totalUnanswered: attempts.reduce(
          (n, a) => n + (a.unansweredCount ?? 0),
          0,
        ),
      },
      progression: attempts.map((a, i) => ({
        attempt: i + 1,
        exam: a.exam.title,
        examHi: a.exam.titleHi,
        date: a.submittedAt,
        score: Number(a.percentage),
        accuracy: Number(a.accuracy),
      })),
      subjects,
      topics,
      activity: [...activity].map(([date, tests]) => ({ date, tests })),
      strongAreas: areas
        .filter((area) => area.accuracy >= 75)
        .sort((left, right) => right.accuracy - left.accuracy)
        .slice(0, 4),
      weakAreas: areas
        .filter((area) => area.accuracy < 70)
        .sort((left, right) => left.accuracy - right.accuracy)
        .slice(0, 3),
    };
  }

  profile(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        fullName: true,
        email: true,
        preferredLanguage: true,
        createdAt: true,
        _count: { select: { attempts: true } },
      },
    });
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { fullName: dto.fullName.trim() },
      select: {
        id: true,
        fullName: true,
        email: true,
        preferredLanguage: true,
        role: { select: { code: true } },
      },
    });
    return { ...user, role: user.role.code };
  }

  async updateLanguage(userId: string, dto: UpdateLanguageDto) {
    return this.prisma.user.update({
      where: { id: userId },
      data: { preferredLanguage: dto.preferredLanguage },
      select: { id: true, preferredLanguage: true },
    });
  }

  async expireDueAttempts() {
    const due = await this.prisma.attempt.findMany({
      where: { status: "IN_PROGRESS", expectedEndTime: { lte: new Date() } },
      select: { id: true, userId: true },
      take: 100,
    });
    for (const attempt of due) {
      try {
        await this.submitInternal(attempt.id, attempt.userId, true);
      } catch (error) {
        this.logger.warn(
          `Could not expire attempt ${attempt.id}: ${error instanceof Error ? error.message : String(error)}`,
        );
      }
    }
    return due.length;
  }

  private async ownedAttempt<T extends Prisma.AttemptInclude>(
    userId: string,
    id: string,
    include: T,
  ) {
    const attempt = await this.prisma.attempt.findFirst({
      where: { id, userId },
      include,
    });
    if (!attempt) throw new NotFoundException("Attempt not found");
    return attempt as Prisma.AttemptGetPayload<{ include: T }>;
  }
}

const toExamCard = (exam: any) => {
  const active = exam.attempts.find(
    (a: any) =>
      a.status === "IN_PROGRESS" && new Date(a.expectedEndTime) > new Date(),
  );
  const completed = exam.attempts.filter(
    (a: any) => a.status !== "IN_PROGRESS",
  );
  return {
    id: exam.id,
    title: exam.title,
    titleHi: exam.titleHi,
    description: exam.description,
    descriptionHi: exam.descriptionHi,
    category: exam.category.name,
    categoryHi: exam.category.nameHi,
    subject: exam.subject?.name,
    subjectHi: exam.subject?.nameHi,
    durationMinutes: exam.durationMinutes,
    totalMarks: Number(exam.totalMarks),
    negativeMarks: Number(exam.negativeMarks),
    difficulty: exam.difficulty,
    questionCount: exam._count.questions,
    attemptsCount: exam._count.attempts,
    attemptStatus: active ? "RESUME" : completed.length ? "COMPLETED" : "NEW",
    activeAttemptId: active?.id,
    bestScore: completed.length && (exam.settings?.showResultImmediately ?? true)
      ? Math.max(...completed.map((a: any) => Number(a.percentage)))
      : null,
  };
};
const toAttemptRow = (a: any) => ({
  id: a.id,
  test: a.exam.title,
  testHi: a.exam.titleHi,
  attemptNumber: a.attemptNumber,
  date: a.submittedAt,
  score: (a.exam.settings?.showResultImmediately ?? true) ? Number(a.score) : null,
  totalMarks: Number(a.totalMarks),
  percentage: (a.exam.settings?.showResultImmediately ?? true) ? Number(a.percentage) : null,
  accuracy: (a.exam.settings?.showResultImmediately ?? true) ? Number(a.accuracy) : null,
  timeTakenSeconds: a.timeTakenSeconds,
  status: a.status,
  resultAvailable: a.exam.settings?.showResultImmediately ?? true,
  reviewAvailable:
    (a.exam.settings?.showResultImmediately ?? true) &&
    (a.exam.settings?.allowAnswerReview ?? true),
});
const avg = (v: number[]) =>
  v.length ? round(v.reduce((a, b) => a + b, 0) / v.length) : 0;
const round = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;
function stableShuffle<T>(items: T[], seed: string): T[] {
  if (!seed) return items;
  return [...items].sort((a: any, b: any) =>
    createHash("sha256")
      .update(seed + a.id)
      .digest("hex")
      .localeCompare(
        createHash("sha256")
          .update(seed + b.id)
          .digest("hex"),
      ),
  );
}
