import { ValidationPipe } from "@nestjs/common";
import { UpdateImportedQuestionDto } from "./admin.dto";

describe("import Save request validation", () => {
  const pipe = new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true });
  const validate = (body: object) => pipe.transform(body, {
    type: "body", metatype: UpdateImportedQuestionDto,
  });

  it("accepts the old full preview payload and repairs legacy zero marks", async () => {
    const result = await validate({
      id: "question-id", importId: "import-id", warnings: [], duplicateOfId: null,
      order: 1, createdAt: "2026-09-08", updatedAt: "2026-09-08",
      text: "Edited question", textHi: null, marks: "0", negativeMarks: "0",
      difficulty: "MEDIUM", status: "PENDING", duplicateAction: "KEEP",
    });
    expect(result).toMatchObject({ text: "Edited question", marks: 1, negativeMarks: 0 });
    for (const key of ["id", "importId", "warnings", "duplicateOfId", "order", "createdAt", "updatedAt"])
      expect(result).not.toHaveProperty(key);
  });

  it("accepts a current Save request without changing valid scoring", async () => {
    expect(await validate({ text: "Updated", marks: 2, negativeMarks: 0.25 }))
      .toMatchObject({ text: "Updated", marks: 2, negativeMarks: 0.25 });
  });

  it.each([{ marks: 0 }, { marks: -1 }, { negativeMarks: -1 }, { unexpectedField: true }])(
    "still rejects invalid edits %p", async (body) => {
      await expect(validate(body)).rejects.toThrow();
    },
  );
});
