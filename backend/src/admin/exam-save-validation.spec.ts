import { ValidationPipe } from "@nestjs/common";
import { UpdateExamDto } from "./admin.dto";

describe("exam Save validation", () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = (body: object) => pipe.transform(body, { type: "body", metatype: UpdateExamDto });

  it("accepts an older exam form while discarding metadata and relations", async () => {
    const dto = await validate({
      id: "wrong-id", examId: "wrong-id", status: "PUBLISHED",
      createdAt: "today", updatedAt: "today", publishedAt: "today",
      category: {}, subject: {}, sections: [], _count: { questions: 110 },
      title: "Edited exam", titleHi: "परीक्षा", durationMinutes: "120",
      totalMarks: "200", marksPerQuestion: "1", negativeMarks: "0.25",
      attemptLimit: "3", randomizeQuestions: false, allowResume: true,
    });
    expect(dto).toMatchObject({ title: "Edited exam", titleHi: "परीक्षा", durationMinutes: 120,
      totalMarks: 200, marksPerQuestion: 1, negativeMarks: 0.25, attemptLimit: 3,
      randomizeQuestions: false, allowResume: true });
    for (const key of ["id", "examId", "status", "createdAt", "updatedAt", "publishedAt", "category", "subject", "sections", "_count"])
      expect(dto).not.toHaveProperty(key);
  });

  it("accepts clearing optional settings", async () => {
    expect(await validate({ subjectId: null, attemptLimit: null, titleHi: "" }))
      .toMatchObject({ subjectId: null, attemptLimit: null, titleHi: "" });
  });

  it.each([{ totalMarks: 0 }, { durationMinutes: 601 }, { categoryId: "invalid" }, { unexpected: true }])(
    "rejects invalid edits %p", async (body) => {
      await expect(validate(body)).rejects.toThrow();
    },
  );
});
