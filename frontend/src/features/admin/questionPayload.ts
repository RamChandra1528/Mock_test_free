type QuestionPayloadOption = {
  label: string;
  text?: string;
  textHi?: string;
  imageUrl?: string;
  isCorrect: boolean;
};

type QuestionPayloadForm = {
  examId: string;
  sectionId: string;
  subjectId: string;
  topicId: string;
  text: string;
  textHi?: string;
  imageUrl?: string;
  explanation?: string;
  explanationHi?: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  options: QuestionPayloadOption[];
};

export function buildQuestionPayload(form: QuestionPayloadForm) {
  return {
    examId: form.examId,
    sectionId: form.sectionId || undefined,
    subjectId: form.subjectId || undefined,
    topicId: form.topicId || undefined,
    text: form.text,
    textHi: form.textHi?.trim() || undefined,
    imageUrl: form.imageUrl || undefined,
    explanation: form.explanation?.trim() || undefined,
    explanationHi: form.explanationHi?.trim() || undefined,
    difficulty: form.difficulty,
    marks: Number(form.marks),
    negativeMarks: Number(form.negativeMarks),
    options: form.options.map((option) => ({
      label: option.label,
      text: option.text?.trim() || undefined,
      textHi: option.textHi?.trim() || undefined,
      imageUrl: option.imageUrl || undefined,
      isCorrect: option.isCorrect,
    })),
  };
}
