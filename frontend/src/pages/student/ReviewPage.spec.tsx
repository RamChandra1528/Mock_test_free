import {
  act,
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../lib/api";
import { LanguageProvider, useLanguage } from "../../contexts/LanguageContext";
import { ReviewPage } from "./ReviewPage";

vi.mock("../../lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn() },
}));
vi.mock("../../contexts/AuthContext", () => ({
  useAuth: () => ({ user: null }),
}));

const questions = [1, 2].map((n) => ({
  id: `q${n}`,
  order: n,
  text: `Question text ${n}`,
  subject: "Math",
  explanation: `Original explanation ${n}`,
  options: [
    { id: `a${n}`, label: "A", text: "Three", isCorrect: false },
    { id: `b${n}`, label: "B", text: "Four", isCorrect: true },
  ],
  selectedOptionId: n === 1 ? `a${n}` : `b${n}`,
  markedForReview: false,
  status: n === 1 ? "WRONG" : "CORRECT",
  marksAwarded: n === 1 ? 0 : 1,
}));

function SwitchLanguage() {
  const { setLanguage } = useLanguage();
  return (
    <>
      <button onClick={() => setLanguage("hi")}>Hindi</button>
      <button onClick={() => setLanguage("en")}>English</button>
    </>
  );
}

function setup() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={["/student/review/attempt"]}>
        <LanguageProvider>
          <SwitchLanguage />
          <Routes>
            <Route path="/student/review/:attemptId" element={<ReviewPage />} />
          </Routes>
        </LanguageProvider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return client;
}

beforeEach(() => {
  vi.clearAllMocks();
  localStorage.clear();
  vi.mocked(api.get).mockResolvedValue({
    data: { exam: { title: "Exam" }, questions },
  });
});
afterEach(cleanup);

it("renders all questions and keeps concurrent responses and loading states isolated", async () => {
  let resolveFirst!: (value: unknown) => void;
  let resolveSecond!: (value: unknown) => void;
  vi.mocked(api.post).mockImplementation(
    (url) =>
      new Promise((resolve) => {
        if (url.includes("q1")) resolveFirst = resolve;
        else resolveSecond = resolve;
      }),
  );
  setup();
  const first = within(
    await screen.findByRole("article", { name: "Question 1" }),
  );
  const second = within(screen.getByRole("article", { name: "Question 2" }));
  expect(first.getByText("Original explanation 1")).toBeInTheDocument();
  expect(second.getByText("Original explanation 2")).toBeInTheDocument();
  expect(api.post).not.toHaveBeenCalled();
  fireEvent.click(first.getByRole("button", { name: "Ask AI" }));
  await waitFor(() => expect(first.getByRole("button")).toBeDisabled());
  expect(second.getByRole("button")).toBeEnabled();
  fireEvent.click(second.getByRole("button", { name: "Ask AI" }));
  await act(async () => {
    resolveSecond({
      data: {
        questionId: "q2",
        language: "en",
        explanation: "Second AI answer",
      },
    });
  });
  expect(await second.findByText("Second AI answer")).toBeInTheDocument();
  expect(first.queryByText("Second AI answer")).not.toBeInTheDocument();
  await act(async () => {
    resolveFirst({
      data: {
        questionId: "q1",
        language: "en",
        explanation: "First AI answer",
      },
    });
  });
  expect(await first.findByText("First AI answer")).toBeInTheDocument();
  expect(second.queryByText("First AI answer")).not.toBeInTheDocument();
  expect(api.post).toHaveBeenCalledWith(
    "/student/attempts/attempt/review/questions/q1/explanation",
    { language: "en" },
    { timeout: 70_000 },
  );
  expect(first.getByText("Original explanation 1")).toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "Correct" }));
  expect(
    screen.queryByRole("article", { name: "Question 1" }),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All" }));
  expect(await screen.findByText("First AI answer")).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledTimes(2);
});

it("keeps errors local and allows retry without touching another question", async () => {
  vi.mocked(api.post)
    .mockRejectedValueOnce(new Error("AI is temporarily unavailable"))
    .mockResolvedValueOnce({
      data: {
        questionId: "q1",
        language: "en",
        explanation: "Recovered explanation",
      },
    });
  setup();
  const first = within(
    await screen.findByRole("article", { name: "Question 1" }),
  );
  const second = within(screen.getByRole("article", { name: "Question 2" }));
  fireEvent.click(first.getByRole("button", { name: "Ask AI" }));
  expect(await first.findByRole("alert")).toHaveTextContent(
    "AI is temporarily unavailable",
  );
  expect(second.queryByRole("alert")).not.toBeInTheDocument();
  expect(second.getByRole("button")).toBeEnabled();
  fireEvent.click(first.getByRole("button", { name: "Retry Ask AI" }));
  expect(await first.findByText("Recovered explanation")).toBeInTheDocument();
  expect(first.queryByRole("alert")).not.toBeInTheDocument();
});

it("keeps a pending response attached to its question when hidden by filters", async () => {
  let complete!: (value: unknown) => void;
  vi.mocked(api.post).mockImplementation(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  setup();
  fireEvent.click(
    within(
      await screen.findByRole("article", { name: "Question 1" }),
    ).getByRole("button"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Correct" }));
  await act(async () => {
    complete({
      data: {
        questionId: "q1",
        language: "en",
        explanation: "Hidden question response",
      },
    });
  });
  expect(
    screen.queryByText("Hidden question response"),
  ).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "All" }));
  expect(
    await screen.findByText("Hidden question response"),
  ).toBeInTheDocument();
  expect(api.post).toHaveBeenCalledTimes(1);
});

it("does not insert an English response into the Hindi view after a language switch", async () => {
  let complete!: (value: unknown) => void;
  vi.mocked(api.post).mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
  );
  setup();
  fireEvent.click(
    within(
      await screen.findByRole("article", { name: "Question 1" }),
    ).getByRole("button"),
  );
  fireEvent.click(screen.getByRole("button", { name: "Hindi" }));
  await act(async () => {
    complete({
      data: {
        questionId: "q1",
        language: "en",
        explanation: "English explanation",
      },
    });
  });
  expect(screen.queryByText("English explanation")).not.toBeInTheDocument();
  expect(screen.getAllByRole("button", { name: "AI से पूछें" })).toHaveLength(
    2,
  );
  fireEvent.click(screen.getByRole("button", { name: "English" }));
  expect(await screen.findByText("English explanation")).toBeInTheDocument();
});

it("rejects a response that belongs to a different question", async () => {
  vi.mocked(api.post).mockResolvedValue({
    data: {
      questionId: "q2",
      language: "en",
      explanation: "Mismatched response",
    },
  });
  setup();
  const first = within(
    await screen.findByRole("article", { name: "Question 1" }),
  );
  fireEvent.click(first.getByRole("button"));
  await waitFor(() => expect(first.getByRole("alert")).toBeInTheDocument());
  expect(screen.queryByText("Mismatched response")).not.toBeInTheDocument();
});
