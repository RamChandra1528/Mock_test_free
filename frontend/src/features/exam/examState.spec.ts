import { mergeAnswer, questionIndex, summarizeQuestions } from "./examState";

const questions = [{ id: "q1" }, { id: "q2" }, { id: "q3" }];
describe("exam interaction state", () => {
  it("selects and clears an answer without losing visit state", () => {
    const selected = mergeAnswer({}, "q1", { selectedOptionId: "a" });
    expect(selected).toEqual({
      selectedOptionId: "a",
      markedForReview: false,
      visited: true,
    });
    expect(
      mergeAnswer({ q1: selected }, "q1", { selectedOptionId: null }).visited,
    ).toBe(true);
  });
  it("marks an answered question for review", () => {
    const answer = mergeAnswer(
      { q1: { selectedOptionId: "a", markedForReview: false, visited: true } },
      "q1",
      { markedForReview: true },
    );
    expect(answer).toMatchObject({
      selectedOptionId: "a",
      markedForReview: true,
    });
  });
  it("keeps question navigation inside the palette bounds", () => {
    expect(questionIndex(-1, 3)).toBe(0);
    expect(questionIndex(8, 3)).toBe(2);
  });
  it("produces the counts used by submit confirmation", () => {
    const summary = summarizeQuestions(
      questions,
      {
        q1: { selectedOptionId: "a", markedForReview: false, visited: true },
        q2: { selectedOptionId: null, markedForReview: true, visited: true },
      },
      1,
    );
    expect(summary).toEqual({
      answered: 1,
      notAnswered: 0,
      notVisited: 1,
      marked: 1,
      answeredMarked: 0,
    });
  });
});
