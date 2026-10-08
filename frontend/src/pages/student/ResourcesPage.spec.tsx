import { fireEvent, render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { MemoryRouter } from "react-router-dom";
import { api } from "../../lib/api";
import { StudentResourcesPage } from "./ResourcesPage";

vi.mock("../../lib/api", () => ({ api: { get: vi.fn() } }));

const materials = [
  {
    id: "civil-formulas",
    title: "Civil Formula Sheet",
    description: "Essential formulas for SSC JE preparation.",
    exam: "SSC JE Civil",
    category: "Engineering",
    tags: ["revision", "mechanics"],
    fileName: "civil-formulas.pdf",
    updatedAt: "2026-10-01",
  },
  {
    id: "weather-guide",
    title: "IMD Weather Guide",
    description: "Scientific Assistant reference material.",
    exam: "Scientific Assistant",
    fileName: "meteorology-handbook.pdf",
    updatedAt: "2026-10-02",
  },
];

function renderPage() {
  render(
    <QueryClientProvider client={new QueryClient({ defaultOptions: { queries: { retry: false } } })}>
      <MemoryRouter><StudentResourcesPage /></MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.mocked(api.get).mockResolvedValue({ data: materials });
});

it("filters resources case-insensitively with partial, multiple-keyword, and metadata matches", async () => {
  renderPage();
  const search = await screen.findByRole("searchbox", { name: "Search resources" });

  fireEvent.change(search, { target: { value: "cIvIl formula" } });
  expect(screen.getByText("Civil Formula Sheet")).toBeInTheDocument();
  expect(screen.queryByText("IMD Weather Guide")).not.toBeInTheDocument();

  fireEvent.change(search, { target: { value: "REVISION" } });
  expect(screen.getByText("Civil Formula Sheet")).toBeInTheDocument();

  fireEvent.change(search, { target: { value: "meteorology" } });
  expect(screen.getByText("IMD Weather Guide")).toBeInTheDocument();
});

it("shows a no-results state and can clear the search", async () => {
  renderPage();
  const search = await screen.findByRole("searchbox", { name: "Search resources" });

  fireEvent.change(search, { target: { value: "quantum biology" } });
  expect(screen.getByText("No matching resources")).toBeInTheDocument();
  expect(screen.getByText(/couldn't find any resources matching/i)).toBeInTheDocument();

  fireEvent.click(screen.getByRole("button", { name: "Clear search" }));
  expect(screen.getByText("Civil Formula Sheet")).toBeInTheDocument();
  expect(screen.getByText("IMD Weather Guide")).toBeInTheDocument();
});
