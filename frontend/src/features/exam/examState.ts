import type { TestQuestion } from "../../types";

export type LocalAnswer = {
  selectedOptionId: string | null;
  markedForReview: boolean;
  visited: boolean;
};

export function mergeAnswer(
  answers: Record<string, LocalAnswer>,
  questionId: string,
  patch: Partial<LocalAnswer>,
) {
  const current = answers[questionId] ?? {
    selectedOptionId: null,
    markedForReview: false,
    visited: true,
  };
  return { ...current, ...patch };
}

export function questionIndex(target: number, total: number) {
  return Math.max(0, Math.min(target, Math.max(0, total - 1)));
}

export function summarizeQuestions(
  questions: Pick<TestQuestion, "id">[],
  answers: Record<string, LocalAnswer>,
  current: number,
) {
  let answered = 0,
    notAnswered = 0,
    notVisited = 0,
    marked = 0,
    answeredMarked = 0;
  questions.forEach((q, i) => {
    const answer = answers[q.id];
    if (!answer && i !== current) notVisited++;
    else if (answer?.markedForReview && answer.selectedOptionId)
      answeredMarked++;
    else if (answer?.markedForReview) marked++;
    else if (answer?.selectedOptionId) answered++;
    else notAnswered++;
  });
  return { answered, notAnswered, notVisited, marked, answeredMarked };
}
