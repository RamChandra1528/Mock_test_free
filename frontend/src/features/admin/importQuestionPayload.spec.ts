import { buildImportQuestionPayload } from "./importQuestionPayload";

describe("import question save payload", () => {
  it("preserves edits and excludes all server metadata", () => {
    expect(buildImportQuestionPayload({
      id: "q1", importId: "import1", order: 1, warnings: [],
      duplicateOfId: null, createdAt: "today", updatedAt: "today",
      text: "Edited question", textHi: "", optionA: "A", marks: 2,
      negativeMarks: 0.25, difficulty: "EASY", duplicateAction: "KEEP",
    })).toEqual({
      text: "Edited question", textHi: "", optionA: "A", marks: 2,
      negativeMarks: 0.25, difficulty: "EASY", duplicateAction: "KEEP",
    });
  });
  it("supports skipping incomplete questions without submitting their fields", () => {
    expect(buildImportQuestionPayload({ status: "SKIPPED", duplicateAction: "SKIP" }))
      .toEqual({ status: "SKIPPED", duplicateAction: "SKIP" });
  });
});
