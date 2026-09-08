export type ScoringItem = {
  selectedOptionId?: string | null;
  correctOptionId: string;
  marks: number;
  negativeMarks: number;
};
export type ScoreSummary = {
  score: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  percentage: number;
};

export function calculateScore(
  items: ScoringItem[],
  totalMarks: number,
): ScoreSummary {
  let score = 0,
    correct = 0,
    wrong = 0,
    unanswered = 0;
  for (const item of items) {
    if (!item.selectedOptionId) unanswered += 1;
    else if (item.selectedOptionId === item.correctOptionId) {
      correct += 1;
      score += item.marks;
    } else {
      wrong += 1;
      score -= item.negativeMarks;
    }
  }
  const attempted = correct + wrong;
  return {
    score: round(score),
    correct,
    wrong,
    unanswered,
    accuracy: attempted ? round((correct / attempted) * 100) : 0,
    percentage: totalMarks ? round((score / totalMarks) * 100) : 0,
  };
}
const round = (value: number) =>
  Math.round((value + Number.EPSILON) * 100) / 100;
