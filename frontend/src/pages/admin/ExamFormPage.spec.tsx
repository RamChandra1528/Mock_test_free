import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { api } from "../../lib/api";
import { ExamFormPage } from "./ExamFormPage";

vi.mock("../../lib/api", () => ({ api: { get: vi.fn(), put: vi.fn(), post: vi.fn() } }));
vi.mock("../../contexts/LanguageContext", () => ({ useLanguage: () => ({ language: "en", localize: (en: string) => en }) }));
vi.mock("../../contexts/ToastContext", () => ({ useToast: () => ({ show: vi.fn() }) }));
vi.mock("../../components/LanguageToggle", () => ({ LanguageToggle: () => null }));

it("loads a full exam response, edits fields and saves only writable values", async () => {
  const exam = {
    id: "exam", examId: "exam", status: "DRAFT", createdAt: "today", updatedAt: "today",
    publishedAt: null, category: {}, subject: {}, sections: [], _count: { questions: 110 },
    title: "Original title", titleHi: "परीक्षा", description: null, descriptionHi: null,
    instructions: null, instructionsHi: null, categoryId: "category", subjectId: "subject",
    durationMinutes: 120, totalMarks: "200", marksPerQuestion: "1", negativeMarks: "0.25",
    difficulty: "MEDIUM", attemptLimit: 3, randomizeQuestions: false, randomizeOptions: false,
    showResultImmediately: true, allowAnswerReview: true, requireExplanations: false, allowResume: true,
  };
  vi.mocked(api.get).mockImplementation(async (url) => ({ data: url === "/admin/exams/exam"
    ? exam : [{ id: url === "/admin/categories" ? "category" : "subject", name: "Taxonomy" }] }));
  vi.mocked(api.put).mockResolvedValue({ data: { id: "exam" } });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter initialEntries={["/admin/exams/exam"]}><Routes>
      <Route path="/admin/exams/:id" element={<ExamFormPage />} />
      <Route path="/admin/exams/:id/questions" element={<div>Manage questions</div>} />
    </Routes></MemoryRouter>
  </QueryClientProvider>);
  const title = await screen.findByLabelText("Exam title (English, required)");
  await waitFor(() => expect(title).toHaveValue("Original title"));
  fireEvent.change(title, { target: { value: "Updated title" } });
  fireEvent.change(screen.getByLabelText("Exam title (Hindi, optional)"), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Attempt limit"), { target: { value: "" } });
  fireEvent.change(screen.getByLabelText("Primary subject"), { target: { value: "" } });
  fireEvent.click(screen.getByRole("button", { name: "Save and manage questions" }));
  await screen.findByText("Manage questions");
  expect(api.put).toHaveBeenCalledTimes(1);
  const [url, payload] = vi.mocked(api.put).mock.calls[0];
  expect(url).toBe("/admin/exams/exam");
  expect(payload).toMatchObject({ title: "Updated title", titleHi: "", subjectId: null,
    attemptLimit: null, totalMarks: 200, marksPerQuestion: 1, negativeMarks: 0.25, allowResume: true });
  for (const key of ["id", "examId", "status", "createdAt", "updatedAt", "publishedAt", "category", "subject", "sections", "_count"])
    expect(payload).not.toHaveProperty(key);
});
