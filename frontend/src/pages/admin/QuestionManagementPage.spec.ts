import { buildQuestionPayload } from "../../features/admin/questionPayload";

describe("buildQuestionPayload", () => {
  it("sends only editable DTO fields when an existing question is updated", () => {
    const unsafeForm = {
      id: "question-id",
      order: 1,
      createdAt: "2026-09-08T00:00:00.000Z",
      updatedAt: "2026-09-08T00:00:00.000Z",
      exam: { title: "Exam" },
      subject: { name: "Mathematics" },
      topic: { name: "Arithmetic" },
      examId: "exam-id",
      sectionId: "",
      subjectId: "subject-id",
      topicId: "",
      text: "What is 25 × 16?",
      textHi: "25 × 16 कितना है?",
      imageUrl: "",
      explanation: "25 multiplied by 16 is 400.",
      explanationHi: "25 को 16 से गुणा करने पर 400 होता है।",
      difficulty: "EASY",
      marks: 2,
      negativeMarks: 0.5,
      options: [
        {
          id: "option-id",
          createdAt: "2026-09-08T00:00:00.000Z",
          label: "A",
          text: "400",
          textHi: "400",
          imageUrl: "",
          isCorrect: true,
        },
        {
          id: "option-id-2",
          label: "B",
          text: "425",
          textHi: "425",
          imageUrl: "",
          isCorrect: false,
        },
      ],
    };

    const payload = buildQuestionPayload(unsafeForm);

    for (const readOnlyField of [
      "id",
      "order",
      "createdAt",
      "updatedAt",
      "exam",
      "subject",
      "topic",
    ]) {
      expect(payload).not.toHaveProperty(readOnlyField);
    }
    expect(payload.options[0]).not.toHaveProperty("id");
    expect(payload.options[0]).not.toHaveProperty("createdAt");
    expect(payload).toMatchObject({
      examId: "exam-id",
      subjectId: "subject-id",
      text: "What is 25 × 16?",
      textHi: "25 × 16 कितना है?",
      difficulty: "EASY",
      marks: 2,
      negativeMarks: 0.5,
      options: [
        { label: "A", text: "400", textHi: "400", isCorrect: true },
        { label: "B", text: "425", textHi: "425", isCorrect: false },
      ],
    });
  });
});
