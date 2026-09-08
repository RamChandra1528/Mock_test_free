import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import {
  LanguageProvider,
  localizeText,
  useLanguage,
} from "./LanguageContext";

const mocks = vi.hoisted(() => ({
  patch: vi.fn(),
  user: {
    id: "student-1",
    role: "STUDENT" as const,
    preferredLanguage: "EN" as const,
  },
}));

vi.mock("./AuthContext", () => ({
  useAuth: () => ({ user: mocks.user }),
}));

vi.mock("../lib/api", () => ({
  api: { patch: mocks.patch },
}));

function AttemptProbe() {
  const { language, setLanguage, localize } = useLanguage();
  const [answer, setAnswer] = useState("none");
  const [seconds] = useState(600);
  return (
    <div>
      <p data-testid="language">{language}</p>
      <p data-testid="question">
        {localize("What is two plus two?", "दो और दो कितने होते हैं?")}
      </p>
      <p data-testid="answer">{answer}</p>
      <p data-testid="timer">{seconds}</p>
      <button onClick={() => setAnswer("option-b")}>Choose B</button>
      <button onClick={() => setLanguage("hi")}>Hindi</button>
      <button onClick={() => setLanguage("en")}>English</button>
    </div>
  );
}

describe("LanguageProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.lang = "en";
    mocks.patch.mockReset().mockResolvedValue({ data: {} });
  });

  it("switches content instantly while preserving live attempt state", async () => {
    render(
      <LanguageProvider>
        <AttemptProbe />
      </LanguageProvider>,
    );

    fireEvent.click(screen.getByText("Choose B"));
    fireEvent.click(screen.getByText("Hindi"));

    expect(screen.getByTestId("question")).toHaveTextContent(
      "दो और दो कितने होते हैं?",
    );
    expect(screen.getByTestId("answer")).toHaveTextContent("option-b");
    expect(screen.getByTestId("timer")).toHaveTextContent("600");
    expect(localStorage.getItem("mockmaster_language")).toBe("hi");
    expect(document.documentElement.lang).toBe("hi");
    await waitFor(() =>
      expect(mocks.patch).toHaveBeenCalledWith("/student/profile/language", {
        preferredLanguage: "HI",
      }),
    );
  });

  it("serializes rapid preference writes so the latest choice wins", async () => {
    let releaseFirst!: () => void;
    const first = new Promise<{ data: object }>((resolve) => {
      releaseFirst = () => resolve({ data: {} });
    });
    mocks.patch
      .mockImplementationOnce(() => first)
      .mockResolvedValueOnce({ data: {} });

    render(
      <LanguageProvider>
        <AttemptProbe />
      </LanguageProvider>,
    );
    fireEvent.click(screen.getByText("Hindi"));
    fireEvent.click(screen.getByText("English"));

    await waitFor(() => expect(mocks.patch).toHaveBeenCalledTimes(1));
    expect(mocks.patch.mock.calls[0]?.[1]).toEqual({ preferredLanguage: "HI" });
    await act(async () => releaseFirst());
    await waitFor(() => expect(mocks.patch).toHaveBeenCalledTimes(2));
    expect(mocks.patch.mock.calls[1]?.[1]).toEqual({ preferredLanguage: "EN" });
    expect(screen.getByTestId("language")).toHaveTextContent("en");
  });
});

describe("localizeText", () => {
  it("falls back to English for a missing or whitespace Hindi translation", () => {
    expect(localizeText("English", "   ", "hi")).toBe("English");
    expect(localizeText("English", null, "hi")).toBe("English");
    expect(localizeText("English", "हिन्दी", "en")).toBe("English");
  });
});
