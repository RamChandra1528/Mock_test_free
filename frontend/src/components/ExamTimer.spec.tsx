import { render, screen } from "@testing-library/react";
import { ExamTimer, formatExamTime } from "./ExamTimer";

vi.mock("../contexts/LanguageContext", () => ({
  useLanguage: () => ({
    t: (key: string) =>
      key === "secondsRemaining" ? "seconds remaining" : key,
  }),
}));

describe("ExamTimer", () => {
  it("formats an exam duration as HH:MM:SS", () =>
    expect(formatExamTime(3661)).toBe("01:01:01"));
  it("uses the server timestamp when showing remaining time", () => {
    render(
      <ExamTimer
        serverTime="2026-01-01T00:00:00.000Z"
        expectedEndTime="2026-01-01T00:10:00.000Z"
        onExpire={() => undefined}
      />,
    );
    expect(screen.getByText("00:10:00")).toBeInTheDocument();
  });
});
