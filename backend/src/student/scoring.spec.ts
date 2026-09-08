import { calculateScore } from "./scoring";

describe("calculateScore", () => {
  it("calculates correct, wrong, unanswered and negative marks", () => {
    const result = calculateScore(
      [
        {
          selectedOptionId: "a",
          correctOptionId: "a",
          marks: 2,
          negativeMarks: 0.5,
        },
        {
          selectedOptionId: "x",
          correctOptionId: "b",
          marks: 2,
          negativeMarks: 0.5,
        },
        {
          selectedOptionId: null,
          correctOptionId: "c",
          marks: 2,
          negativeMarks: 0.5,
        },
      ],
      6,
    );
    expect(result).toEqual({
      score: 1.5,
      correct: 1,
      wrong: 1,
      unanswered: 1,
      accuracy: 50,
      percentage: 25,
    });
  });
  it("never divides by zero when all questions are unanswered", () => {
    expect(
      calculateScore(
        [{ correctOptionId: "a", marks: 1, negativeMarks: 0.25 }],
        1,
      ).accuracy,
    ).toBe(0);
  });
});
