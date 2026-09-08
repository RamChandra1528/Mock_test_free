import "reflect-metadata";
import { Language } from "@prisma/client";
import { validate } from "class-validator";
import { UpdateLanguageDto } from "./student.dto";
import { StudentService } from "./student.service";

describe("StudentService attempt creation", () => {
  it("uses the configured exam duration to create the authoritative end time", async () => {
    const prisma = {
      exam: {
        findFirst: jest.fn().mockResolvedValue({
          id: "exam",
          status: "PUBLISHED",
          durationMinutes: 30,
          settings: { attemptLimit: null, allowResume: true },
          _count: { questions: 20 },
        }),
      },
      attempt: {
        findFirst: jest.fn().mockResolvedValue(null),
        count: jest.fn().mockResolvedValue(0),
        create: jest
          .fn()
          .mockImplementation(({ data }) => ({ id: "attempt", ...data })),
      },
    } as any;
    const service = new StudentService(prisma);
    jest
      .spyOn(service, "getAttempt")
      .mockResolvedValue({ id: "attempt" } as any);
    await service.start("student", "exam");
    const data = prisma.attempt.create.mock.calls[0][0].data;
    expect(data.expectedEndTime.getTime() - data.startTime.getTime()).toBe(
      30 * 60 * 1000,
    );
  });

  it("calculates and locks a submitted attempt on the backend", async () => {
    const tx = {
      attempt: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn().mockResolvedValue({}),
      },
      attemptAnswer: { update: jest.fn().mockResolvedValue({}) },
      userStatistic: { upsert: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      userStatistic: { findUnique: jest.fn().mockResolvedValue(null) },
      $transaction: jest.fn((callback) => callback(tx)),
    } as any;
    const service = new StudentService(prisma);
    jest.spyOn(service as any, "ownedAttempt").mockResolvedValue({
      id: "attempt",
      status: "IN_PROGRESS",
      startTime: new Date(Date.now() - 60_000),
      exam: {
        durationMinutes: 30,
        totalMarks: 4,
        settings: { showResultImmediately: true },
        questions: [
          {
            id: "q1",
            marks: 2,
            negativeMarks: 0.5,
            options: [
              { id: "correct-1", isCorrect: true },
              { id: "wrong-1", isCorrect: false },
            ],
          },
          {
            id: "q2",
            marks: 2,
            negativeMarks: 0.5,
            options: [
              { id: "correct-2", isCorrect: true },
              { id: "wrong-2", isCorrect: false },
            ],
          },
        ],
      },
      answers: [
        { id: "answer-1", questionId: "q1", selectedOptionId: "correct-1" },
        { id: "answer-2", questionId: "q2", selectedOptionId: "wrong-2" },
      ],
    });
    jest.spyOn(service, "result").mockResolvedValue({ id: "attempt" } as any);

    await expect(service.submit("student", "attempt")).resolves.toEqual({
      id: "attempt",
    });
    expect(tx.attempt.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "attempt", status: "IN_PROGRESS" },
      }),
    );
    expect(tx.attempt.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          score: 1.5,
          correctCount: 1,
          wrongCount: 1,
          unansweredCount: 0,
          accuracy: 50,
          percentage: 37.5,
        }),
      }),
    );
  });
});

describe("StudentService bilingual delivery", () => {
  it("returns both languages during an active attempt without answer keys", async () => {
    const service = new StudentService({} as any);
    const ownedAttempt = jest
      .spyOn(service as any, "ownedAttempt")
      .mockResolvedValue({
        id: "attempt",
        status: "IN_PROGRESS",
        attemptNumber: 1,
        startTime: new Date(),
        expectedEndTime: new Date(Date.now() + 60_000),
        currentQuestion: 0,
        exam: {
          id: "exam",
          title: "English title",
          titleHi: "हिन्दी शीर्षक",
          durationMinutes: 30,
          totalMarks: 2,
          settings: {
            randomizeQuestions: false,
            randomizeOptions: false,
          },
          sections: [{ id: "section", name: "Math", nameHi: "गणित" }],
          questions: [
            {
              id: "question",
              text: "Question text",
              textHi: "प्रश्न पाठ",
              explanation: "must remain private",
              explanationHi: "यह निजी रहना चाहिए",
              imageUrl: null,
              order: 1,
              sectionId: "section",
              subject: { name: "Math", nameHi: "गणित" },
              options: [
                {
                  id: "option-a",
                  label: "A",
                  text: "Answer",
                  textHi: "उत्तर",
                  imageUrl: null,
                  isCorrect: true,
                },
              ],
            },
          ],
        },
        answers: [
          {
            questionId: "question",
            selectedOptionId: "option-a",
            markedForReview: false,
            visited: true,
            savedAt: new Date(),
            isCorrect: true,
            marksAwarded: 2,
          },
        ],
      });

    const result = (await service.getAttempt("student", "attempt")) as any;
    expect(result.exam).toMatchObject({
      title: "English title",
      titleHi: "हिन्दी शीर्षक",
    });
    expect(result.questions[0]).toMatchObject({
      text: "Question text",
      textHi: "प्रश्न पाठ",
      options: [{ text: "Answer", textHi: "उत्तर" }],
    });
    expect(result.questions[0]).not.toHaveProperty("explanation");
    expect(result.questions[0]).not.toHaveProperty("explanationHi");
    expect(result.questions[0].options[0]).not.toHaveProperty("isCorrect");
    expect(result.answers[0]).not.toHaveProperty("isCorrect");
    expect(result.answers[0]).not.toHaveProperty("marksAwarded");

    const query = ownedAttempt.mock.calls[0][2] as any;
    expect(query.exam.include.questions.select).not.toHaveProperty(
      "explanation",
    );
    expect(query.exam.include.questions.select).not.toHaveProperty(
      "explanationHi",
    );
    expect(
      query.exam.include.questions.select.options.select,
    ).not.toHaveProperty("isCorrect");
  });

  it("updates only the authenticated user's validated preference", async () => {
    const prisma = {
      user: {
        update: jest.fn().mockResolvedValue({
          id: "student",
          preferredLanguage: Language.HI,
        }),
      },
    } as any;
    const service = new StudentService(prisma);

    await expect(
      service.updateLanguage("student", { preferredLanguage: Language.HI }),
    ).resolves.toEqual({ id: "student", preferredLanguage: Language.HI });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: "student" },
      data: { preferredLanguage: Language.HI },
      select: { id: true, preferredLanguage: true },
    });

    const invalid = Object.assign(new UpdateLanguageDto(), {
      preferredLanguage: "FR",
    });
    expect(await validate(invalid)).not.toHaveLength(0);
  });
});
