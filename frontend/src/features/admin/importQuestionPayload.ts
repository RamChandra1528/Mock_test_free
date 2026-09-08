const editableFields = [
  "text", "textHi", "optionA", "optionAHi", "optionB", "optionBHi",
  "optionC", "optionCHi", "optionD", "optionDHi", "correctAnswer",
  "explanation", "explanationHi", "subjectName", "subjectNameHi",
  "topicName", "topicNameHi", "difficulty", "marks", "negativeMarks",
  "status", "duplicateAction",
] as const;

export function buildImportQuestionPayload(question: object) {
  return Object.fromEntries(editableFields
    .filter((key) => Object.hasOwn(question, key))
    .map((key) => [key, question[key as keyof typeof question]]));
}
