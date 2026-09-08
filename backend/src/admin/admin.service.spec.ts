import { BadRequestException } from "@nestjs/common";
import { AdminService } from "./admin.service";

describe("AdminService question creation", () => {
  const prisma = {
    exam: { findUnique: jest.fn() },
    attempt: { count: jest.fn().mockResolvedValue(0) },
    question: { count: jest.fn(), create: jest.fn() },
  } as any;
  const service = new AdminService(prisma);
  const dto = {
    examId: "00000000-0000-4000-8000-000000000000",
    text: "A valid question?",
    difficulty: "MEDIUM" as const,
    marks: 2,
    negativeMarks: 0.5,
    options: ["A", "B", "C", "D"].map((label, index) => ({
      label,
      text: `Option ${label}`,
      isCorrect: index === 0,
    })),
  };
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.exam.findUnique.mockResolvedValue({
      id: dto.examId,
      status: "DRAFT",
    });
  });
  it("persists question options through the repository layer", async () => {
    prisma.question.count.mockResolvedValue(0);
    prisma.question.create.mockResolvedValue({ id: "q1" });
    await expect(service.createQuestion(dto)).resolves.toEqual({ id: "q1" });
    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          order: 1,
          options: { create: dto.options },
        }),
      }),
    );
  });
  it("requires exactly one correct option", async () => {
    await expect(
      service.createQuestion({
        ...dto,
        options: dto.options.map((o) => ({ ...o, isCorrect: false })),
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});

describe("AdminService exam creation", () => {
  it("persists exam configuration in the related settings record", async () => {
    const prisma = {
      exam: {
        create: jest.fn().mockResolvedValue({
          id: "exam",
          title: "Banking Mock",
          settings: { attemptLimit: 2, randomizeQuestions: true },
        }),
      },
    } as any;
    const service = new AdminService(prisma);
    await service.createExam({
      title: "Banking Mock",
      categoryId: "00000000-0000-4000-8000-000000000000",
      durationMinutes: 30,
      totalMarks: 100,
      marksPerQuestion: 2,
      negativeMarks: 0.5,
      difficulty: "MEDIUM" as const,
      attemptLimit: 2,
      randomizeQuestions: true,
      randomizeOptions: false,
      showResultImmediately: true,
      allowAnswerReview: true,
      requireExplanations: false,
      allowResume: true,
    });
    expect(prisma.exam.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          title: "Banking Mock",
          settings: {
            create: expect.objectContaining({
              attemptLimit: 2,
              randomizeQuestions: true,
            }),
          },
        }),
      }),
    );
  });
});

describe("AdminService bilingual question duplication", () => {
  it("copies Hindi question, explanation, and option content", async () => {
    const source = {
      id: "question",
      examId: "exam",
      sectionId: null,
      subjectId: null,
      topicId: null,
      text: "English question",
      textHi: "हिन्दी प्रश्न",
      imageUrl: null,
      explanation: "English explanation",
      explanationHi: "हिन्दी व्याख्या",
      difficulty: "MEDIUM",
      marks: 2,
      negativeMarks: 0.5,
      options: [
        {
          label: "A",
          text: "English option",
          textHi: "हिन्दी विकल्प",
          imageUrl: null,
          isCorrect: true,
        },
      ],
    };
    const prisma = {
      exam: {
        findUnique: jest.fn().mockResolvedValue({
          id: "exam",
          status: "DRAFT",
        }),
      },
      attempt: { count: jest.fn().mockResolvedValue(0) },
      question: {
        findUnique: jest.fn().mockResolvedValue(source),
        aggregate: jest.fn().mockResolvedValue({ _max: { order: 3 } }),
        create: jest.fn().mockResolvedValue({ id: "copy" }),
      },
    } as any;
    const service = new AdminService(prisma);

    await service.duplicateQuestion("question");

    expect(prisma.question.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          textHi: "हिन्दी प्रश्न (कॉपी)",
          explanationHi: "हिन्दी व्याख्या",
          options: {
            create: [expect.objectContaining({ textHi: "हिन्दी विकल्प" })],
          },
        }),
      }),
    );
  });

  it("copies every Hindi field while duplicating an exam", async () => {
    const source = {
      id: "exam",
      title: "English exam",
      titleHi: "हिन्दी परीक्षा",
      description: "English description",
      descriptionHi: "हिन्दी विवरण",
      instructions: "English instructions",
      instructionsHi: "हिन्दी निर्देश",
      categoryId: "category",
      subjectId: "subject",
      durationMinutes: 30,
      totalMarks: 2,
      marksPerQuestion: 2,
      negativeMarks: 0.5,
      difficulty: "MEDIUM",
      settings: {},
      sections: [
        {
          id: "section",
          subjectId: "subject",
          name: "Mathematics",
          nameHi: "गणित",
          order: 1,
        },
      ],
      questions: [
        {
          id: "question",
          sectionId: "section",
          subjectId: "subject",
          topicId: null,
          text: "English question",
          textHi: "हिन्दी प्रश्न",
          imageUrl: null,
          explanation: "English explanation",
          explanationHi: "हिन्दी व्याख्या",
          difficulty: "EASY",
          marks: 2,
          negativeMarks: 0.5,
          order: 1,
          options: [
            {
              label: "A",
              text: "English option",
              textHi: "हिन्दी विकल्प",
              imageUrl: null,
              isCorrect: true,
            },
          ],
        },
      ],
    };
    const tx = {
      exam: {
        create: jest.fn().mockResolvedValue({ id: "copy" }),
        findUnique: jest.fn().mockResolvedValue({ id: "copy" }),
      },
      examSection: {
        create: jest.fn().mockResolvedValue({ id: "copied-section" }),
      },
      question: { create: jest.fn().mockResolvedValue({ id: "copied-q" }) },
    };
    const prisma = {
      exam: { findUnique: jest.fn().mockResolvedValue(source) },
      $transaction: jest.fn((callback) => callback(tx)),
    } as any;
    const service = new AdminService(prisma);

    await service.duplicateExam("exam");

    expect(tx.exam.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        titleHi: "हिन्दी परीक्षा (कॉपी)",
        descriptionHi: "हिन्दी विवरण",
        instructionsHi: "हिन्दी निर्देश",
      }),
    });
    expect(tx.examSection.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ nameHi: "गणित" }),
    });
    expect(tx.question.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        sectionId: "copied-section",
        textHi: "हिन्दी प्रश्न",
        explanationHi: "हिन्दी व्याख्या",
        options: {
          create: [expect.objectContaining({ textHi: "हिन्दी विकल्प" })],
        },
      }),
    });
  });
});
