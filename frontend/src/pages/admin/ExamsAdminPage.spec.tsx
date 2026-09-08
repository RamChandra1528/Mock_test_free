import { fireEvent, render, screen, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "../../lib/api";
import { ExamsAdminPage } from "./ExamsAdminPage";

vi.mock("../../lib/api", () => ({ api: { get: vi.fn(), post: vi.fn() } }));
vi.mock("../../contexts/ToastContext", () => ({ useToast: () => ({ show: vi.fn() }) }));

it("declares an exam result after confirmation and refreshes its availability", async () => {
  let released = false;
  vi.mocked(api.get).mockImplementation(async () => ({ data: { pages: 1, items: [{
    id: "exam", title: "Manual result test", category: { name: "Test category" },
    status: "PUBLISHED", difficulty: "MEDIUM", durationMinutes: 60, createdAt: "2026-09-08",
    showResultImmediately: released, _count: { questions: 10, attempts: 2 },
  }] } }));
  vi.mocked(api.post).mockImplementation(async () => { released = true; return { data: { success: true } }; });
  render(<QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
    <MemoryRouter><ExamsAdminPage /></MemoryRouter>
  </QueryClientProvider>);
  fireEvent.click(await screen.findByRole("button", { name: "Declare Result" }));
  expect(api.post).not.toHaveBeenCalled();
  const dialog = screen.getByRole("dialog");
  expect(within(dialog).getByText(/Future submissions/)).toBeInTheDocument();
  fireEvent.click(within(dialog).getByRole("button", { name: "Declare Result" }));
  await screen.findByText("Results available");
  expect(api.post).toHaveBeenCalledWith("/admin/exams/exam/declare-result");
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});
