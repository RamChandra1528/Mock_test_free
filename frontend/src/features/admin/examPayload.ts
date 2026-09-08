export type ExamForm = {
  title: string;
  titleHi: string;
  description: string;
  descriptionHi: string;
  instructions: string;
  instructionsHi: string;
  categoryId: string;
  subjectId: string;
  durationMinutes: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarks: number;
  difficulty: string;
  attemptLimit: string | number;
  randomizeQuestions: boolean;
  randomizeOptions: boolean;
  showResultImmediately: boolean;
  allowAnswerReview: boolean;
  requireExplanations: boolean;
  allowResume: boolean;
};

// API response objects also contain relations and server-owned metadata.
// Explicitly select writable fields even when React Hook Form retains those keys.
export function buildExamPayload(values: ExamForm) {
  return {
    title: values.title,
    titleHi: values.titleHi?.trim() || "",
    description: values.description ?? "",
    descriptionHi: values.descriptionHi?.trim() || "",
    instructions: values.instructions ?? "",
    instructionsHi: values.instructionsHi?.trim() || "",
    categoryId: values.categoryId,
    subjectId: values.subjectId || null,
    durationMinutes: Number(values.durationMinutes),
    totalMarks: Number(values.totalMarks),
    marksPerQuestion: Number(values.marksPerQuestion),
    negativeMarks: Number(values.negativeMarks),
    difficulty: values.difficulty,
    attemptLimit: values.attemptLimit === "" || values.attemptLimit == null
      ? null : Number(values.attemptLimit),
    randomizeQuestions: values.randomizeQuestions,
    randomizeOptions: values.randomizeOptions,
    showResultImmediately: values.showResultImmediately,
    allowAnswerReview: values.allowAnswerReview,
    requireExplanations: values.requireExplanations,
    allowResume: values.allowResume,
  };
}
