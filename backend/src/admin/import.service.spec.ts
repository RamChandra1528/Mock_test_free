import { ImportService, parseQuestionText } from "./import.service";

describe("question import parser", () => {
  it("extracts numbered questions, options, answer and explanation", () => {
    const [question] = parseQuestionText(
      "Q1. What is 2 + 2?\nA. 2\nB. 3\nC. 4\nD. 5\nAnswer: C\nExplanation: Two plus two is four.",
    );
    expect(question).toMatchObject({
      text: "What is 2 + 2?",
      optionA: "2",
      optionD: "5",
      correctAnswer: "C",
      explanation: "Two plus two is four.",
    });
  });
  it("supports parenthesized option labels", () => {
    const [question] = parseQuestionText(
      "Question 1. Pick A\n(a) Alpha\n(b) Beta\n(c) Gamma\n(d) Delta",
    );
    expect(question.optionB).toBe("Beta");
  });
  it("recognizes a Question 1 heading without trailing punctuation", () => {
    const [question] = parseQuestionText(
      "Question 1 Pick the prime number\nA. 4\nB. 6\nC. 7\nD. 8\nAnswer: C",
    );
    expect(question).toMatchObject({
      text: "Pick the prime number",
      optionC: "7",
      correctAnswer: "C",
    });
  });

  it("maps Hindi columns from structured imports", () => {
    const service = new ImportService(
      {} as any,
      { get: jest.fn().mockReturnValue("uploads") } as any,
    );
    const [question] = (service as any).fromRows([
      {
        question: "What is two plus two?",
        question_hi: "दो और दो कितना होता है?",
        option_a: "Three",
        option_a_hi: "तीन",
        option_b: "Four",
        option_b_hi: "चार",
        option_c: "Five",
        option_c_hi: "पाँच",
        option_d: "Six",
        option_d_hi: "छह",
        correct_answer: "B",
        explanation: "Two plus two is four.",
        explanation_hi: "दो और दो चार होता है।",
        subject: "Mathematics",
        subject_hi: "गणित",
      },
    ]);

    expect(question).toMatchObject({
      textHi: "दो और दो कितना होता है?",
      optionBHi: "चार",
      explanationHi: "दो और दो चार होता है।",
      subjectNameHi: "गणित",
    });
  });

  it("copies Hindi fields into confirmed questions and options", async () => {
    const tx = {
      subject: {
        upsert: jest.fn().mockResolvedValue({ id: "subject" }),
      },
      topic: {
        upsert: jest.fn().mockResolvedValue({ id: "topic" }),
      },
      question: { create: jest.fn().mockResolvedValue({ id: "question" }) },
      importedQuestion: { update: jest.fn().mockResolvedValue({}) },
      paperImport: { update: jest.fn().mockResolvedValue({}) },
    };
    const prisma = {
      exam: {
        findUnique: jest.fn().mockResolvedValue({ status: "DRAFT" }),
      },
      attempt: { count: jest.fn().mockResolvedValue(0) },
      paperImport: {
        findUnique: jest.fn().mockResolvedValue({
          id: "import",
          status: "REVIEW",
          importedQuestions: [
            {
              id: "imported-question",
              text: "English question",
              textHi: "हिन्दी प्रश्न",
              optionA: "One",
              optionAHi: "एक",
              optionB: "Two",
              optionBHi: "दो",
              optionC: "Three",
              optionCHi: "तीन",
              optionD: "Four",
              optionDHi: "चार",
              correctAnswer: "B",
              explanation: "English explanation",
              explanationHi: "हिन्दी व्याख्या",
              subjectName: "Mathematics",
              subjectNameHi: "गणित",
              topicName: "Arithmetic",
              topicNameHi: "अंकगणित",
              difficulty: "EASY",
              marks: 1,
              negativeMarks: 0,
              duplicateAction: "KEEP",
              duplicateOfId: null,
              status: "PENDING",
              order: 1,
            },
          ],
        }),
        update: jest.fn(),
      },
      question: {
        aggregate: jest.fn().mockResolvedValue({ _max: { order: null } }),
      },
      $transaction: jest.fn((callback) => callback(tx)),
    } as any;
    const service = new ImportService(prisma, {
      get: jest.fn().mockReturnValue("uploads"),
    } as any);

    await service.confirm("import", { examId: "exam" });

    expect(tx.subject.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: { nameHi: "गणित" },
        create: expect.objectContaining({ nameHi: "गणित" }),
      }),
    );
    expect(tx.question.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        textHi: "हिन्दी प्रश्न",
        explanationHi: "हिन्दी व्याख्या",
        options: {
          create: expect.arrayContaining([
            expect.objectContaining({ label: "B", textHi: "दो" }),
          ]),
        },
      }),
    });
  });
});
