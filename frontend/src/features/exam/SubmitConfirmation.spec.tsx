import { render, screen } from "@testing-library/react";
import { SubmitConfirmation } from "./SubmitConfirmation";

const english: Record<string, string> = {
  answeredSummaryStart: "You have answered",
  answeredSummaryMiddle: "out of",
  answeredSummaryEnd: "questions.",
  answered: "Answered",
  notAnswered: "Not answered",
  reviewMarked: "Marked for review",
  notVisited: "Not visited",
  submissionReadonly:
    "After submission, this attempt becomes read-only and can no longer be changed.",
};

vi.mock("../../contexts/LanguageContext", () => ({
  useLanguage: () => ({ t: (key: string) => english[key] ?? key }),
}));

describe("SubmitConfirmation", () => {
  it("shows the final answered and status counts before submission", () => {
    render(
      <SubmitConfirmation
        total={20}
        counts={{
          answered: 10,
          answeredMarked: 2,
          notAnswered: 3,
          marked: 1,
          notVisited: 4,
        }}
      />,
    );
    expect(screen.getByText(/you have answered/i)).toHaveTextContent(
      "12 out of 20",
    );
    expect(screen.getByText("Marked for review").nextSibling).toHaveTextContent(
      "3",
    );
    expect(screen.getByText("Not visited").nextSibling).toHaveTextContent("4");
  });
});
