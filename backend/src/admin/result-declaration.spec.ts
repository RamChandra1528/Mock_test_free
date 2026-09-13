import { AdminService } from "./admin.service";
import { StudentService } from "../student/student.service";
import { CreateExamDto } from "./admin.dto";

describe("manual result declaration", () => {
  const setup = () => {
    const settings = { showResultImmediately: false, allowAnswerReview: true };
    const attempt = {
      id: "attempt", status: "SUBMITTED", attemptNumber: 1, submittedAt: new Date(),
      score: 8, totalMarks: 10, percentage: 80, accuracy: 80, timeTakenSeconds: 60,
      correctCount: 8, wrongCount: 2, unansweredCount: 0, answers: [],
      exam: { id: "exam", title: "Test", settings, questions: [], sections: [] },
    };
    const prisma = {
      exam: {
        findUnique: jest.fn().mockResolvedValue({ id: "exam", status: "PUBLISHED", settings }),
        findMany: jest.fn().mockResolvedValue([]),
      },
      examSettings: { upsert: jest.fn(async ({ update }) => Object.assign(settings, update)) },
      attempt: {
        count: jest.fn().mockResolvedValue(1),
        findFirst: jest.fn().mockResolvedValue(attempt),
        findMany: jest.fn().mockResolvedValue([attempt]),
      },
      userStatistic: { findUnique: jest.fn().mockResolvedValue(null) },
    };
    return { settings, attempt, prisma, admin: new AdminService(prisma as any), student: new StudentService(prisma as any) };
  };

  it("holds new exam results by default", () => {
    expect(new CreateExamDto().showResultImmediately).toBe(false);
  });

  it("hides scores and keys until declaration, then releases persisted results", async () => {
    const { admin, student, prisma } = setup();
    await expect(student.result("student", "attempt")).rejects.toThrow("Results have not been released");
    await expect(student.review("student", "attempt")).rejects.toThrow("until results are released");
    const hidden = await student.history("student", { page: 1, limit: 10 } as any);
    expect(hidden.items[0]).toMatchObject({ score: null, percentage: null, accuracy: null, resultAvailable: false, reviewAvailable: false });
    const dashboard = await student.dashboard("student");
    expect(dashboard.stats).toMatchObject({ averageScore: 0, bestScore: 0, averageAccuracy: 0 });
    expect(dashboard.recentAttempts[0].score).toBeNull();
    await admin.declareResult("exam");
    expect(prisma.examSettings.upsert).toHaveBeenCalledWith({ where: { examId: "exam" },
      create: { examId: "exam", showResultImmediately: true }, update: { showResultImmediately: true } });
    expect(await student.result("student", "attempt")).toMatchObject({ score: 8, percentage: 80 });
    expect(await student.review("student", "attempt")).toMatchObject({ questions: [] });
    expect((await student.history("student", { page: 1, limit: 10 } as any)).items[0])
      .toMatchObject({ score: 8, resultAvailable: true, reviewAvailable: true });
    await admin.declareResult("exam");
    expect(prisma.examSettings.upsert).toHaveBeenCalledTimes(1);
  });

  it("preserves answer-review restrictions after declaration", async () => {
    const { admin, student, settings } = setup();
    settings.allowAnswerReview = false;
    await admin.declareResult("exam");
    await expect(student.review("student", "attempt")).rejects.toThrow("Answer review is disabled");
    expect(await student.result("student", "attempt")).toMatchObject({ score: 8 });
  });

  it("does not release results for missing exams, drafts or exams without submissions", async () => {
    const { admin, prisma } = setup();
    prisma.exam.findUnique.mockResolvedValueOnce(null as any);
    await expect(admin.declareResult("missing")).rejects.toThrow("Exam not found");
    prisma.exam.findUnique.mockResolvedValueOnce({ status: "DRAFT" } as any);
    await expect(admin.declareResult("exam")).rejects.toThrow("Publish the exam");
    prisma.attempt.count.mockResolvedValueOnce(0);
    await expect(admin.declareResult("exam")).rejects.toThrow("No submitted attempts");
    expect(prisma.examSettings.upsert).not.toHaveBeenCalled();
  });

  it("excludes held results from performance queries", async () => {
    const { student, prisma } = setup();
    prisma.attempt.findMany.mockResolvedValueOnce([]);
    await student.performance("student");
    expect(prisma.attempt.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ exam: { OR: [
        { settings: { is: null } }, { settings: { is: { showResultImmediately: true } } },
      ] } }),
    }));
  });
});
