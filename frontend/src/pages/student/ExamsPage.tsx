import { Search, SlidersHorizontal } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ExamCard } from "../../components/ExamCard";
import {
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
} from "../../components/ui";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../lib/api";
import type { ExamCard as ExamCardType } from "../../types";

type Taxonomy = { id: string; name: string; nameHi?: string | null };

export function ExamsPage() {
  const { language, localize } = useLanguage();
  const bi = (english: string, hindi: string) =>
    language === "hi" ? hindi : english;
  const [filters, setFilters] = useState({
    search: "",
    categoryId: "",
    subjectId: "",
    difficulty: "",
    maxDuration: "",
    status: "",
    sort: "newest",
  });
  const [page, setPage] = useState(1);
  const categories = useQuery({
    queryKey: ["categories"],
    queryFn: () =>
      api.get<Taxonomy[]>("/student/categories").then((r) => r.data),
    retry: false,
  });
  const subjects = useQuery({
    queryKey: ["student-subjects"],
    queryFn: () =>
      api
        .get<Taxonomy[]>("/student/subjects")
        .then((response) => response.data),
  });
  const query = useQuery({
    queryKey: ["exams", filters, page],
    queryFn: () =>
      api
        .get<{ items: ExamCardType[]; pages: number }>("/student/exams", {
          params: Object.fromEntries(
            [...Object.entries(filters), ["page", page]].filter(([, v]) => v),
          ),
        })
        .then((r) => r.data),
  });
  return (
    <>
      <PageHeader
        eyebrow={bi("Mock test library", "मॉक टेस्ट लाइब्रेरी")}
        title={bi("Find your next challenge", "अपनी अगली चुनौती चुनें")}
        description={bi(
          "Filter by exam, difficulty, or attempt status and start when you’re ready.",
          "परीक्षा, कठिनाई या प्रयास की स्थिति के अनुसार खोजें और तैयार होने पर शुरू करें।",
        )}
      />
      <div className="card mb-6 p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.5fr_repeat(6,1fr)]">
          <label className="relative">
            <span className="sr-only">{bi("Search exams", "परीक्षाएँ खोजें")}</span>
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#819088]" />
            <input
              className="input pl-10"
              value={filters.search}
              onChange={(e) => {
                setFilters({ ...filters, search: e.target.value });
                setPage(1);
              }}
              placeholder={bi("Search tests, subjects…", "टेस्ट या विषय खोजें…")}
            />
          </label>
          <select
            className="input"
            aria-label={bi("Category", "श्रेणी")}
            value={filters.categoryId}
            onChange={(e) => {
              setFilters({ ...filters, categoryId: e.target.value });
              setPage(1);
            }}
          >
            <option value="">{bi("All categories", "सभी श्रेणियाँ")}</option>
            {categories.data?.map((c) => (
              <option value={c.id} key={c.id}>
                {localize(c.name, c.nameHi)}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label={bi("Subject", "विषय")}
            value={filters.subjectId}
            onChange={(event) => {
              setFilters({ ...filters, subjectId: event.target.value });
              setPage(1);
            }}
          >
            <option value="">{bi("All subjects", "सभी विषय")}</option>
            {subjects.data?.map((subject) => (
              <option value={subject.id} key={subject.id}>
                {localize(subject.name, subject.nameHi)}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label={bi("Difficulty", "कठिनाई")}
            value={filters.difficulty}
            onChange={(e) => {
              setFilters({ ...filters, difficulty: e.target.value });
              setPage(1);
            }}
          >
            <option value="">{bi("Any difficulty", "कोई भी कठिनाई")}</option>
            <option value="EASY">{bi("Easy", "आसान")}</option>
            <option value="MEDIUM">{bi("Medium", "मध्यम")}</option>
            <option value="HARD">{bi("Hard", "कठिन")}</option>
          </select>
          <select
            className="input"
            aria-label={bi("Maximum duration", "अधिकतम अवधि")}
            value={filters.maxDuration}
            onChange={(event) => {
              setFilters({ ...filters, maxDuration: event.target.value });
              setPage(1);
            }}
          >
            <option value="">{bi("Any duration", "कोई भी अवधि")}</option>
            <option value="30">{bi("Up to 30 min", "30 मिनट तक")}</option>
            <option value="60">{bi("Up to 60 min", "60 मिनट तक")}</option>
            <option value="120">{bi("Up to 120 min", "120 मिनट तक")}</option>
          </select>
          <select
            className="input"
            aria-label={bi("Attempt status", "प्रयास की स्थिति")}
            value={filters.status}
            onChange={(e) => {
              setFilters({ ...filters, status: e.target.value });
              setPage(1);
            }}
          >
            <option value="">{bi("All tests", "सभी टेस्ट")}</option>
            <option value="attempted">{bi("Attempted", "प्रयास किया")}</option>
            <option value="not-attempted">{bi("Not attempted", "प्रयास नहीं किया")}</option>
          </select>
          <select
            className="input"
            aria-label={bi("Sort tests", "टेस्ट क्रमबद्ध करें")}
            value={filters.sort}
            onChange={(e) => {
              setFilters({ ...filters, sort: e.target.value });
              setPage(1);
            }}
          >
            <option value="newest">{bi("Newest first", "नवीनतम पहले")}</option>
            <option value="popular">{bi("Most popular", "सबसे लोकप्रिय")}</option>
            <option value="highest-score">{bi("Highest personal score", "मेरा सर्वोच्च स्कोर")}</option>
            <option value="difficulty">{bi("Difficulty", "कठिनाई")}</option>
          </select>
        </div>
      </div>
      {query.isLoading ? (
        <Loading label={bi("Finding mock tests…", "मॉक टेस्ट खोजे जा रहे हैं…")} />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : query.data?.items.length ? (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {query.data.items.map((exam) => (
              <ExamCard exam={exam} key={exam.id} />
            ))}
          </div>
          <Pagination page={page} pages={query.data.pages} onChange={setPage} />
        </>
      ) : (
        <Empty
          title={bi("No tests match these filters", "इन फ़िल्टर से कोई टेस्ट नहीं मिला")}
          description={bi(
            "Try clearing a filter or using a broader search term.",
            "फ़िल्टर हटाएँ या कोई व्यापक खोज शब्द इस्तेमाल करें।",
          )}
          action={
            <button
              className="btn-secondary"
              onClick={() =>
                setFilters({
                  search: "",
                  categoryId: "",
                  subjectId: "",
                  difficulty: "",
                  maxDuration: "",
                  status: "",
                  sort: "newest",
                })
              }
            >
              <SlidersHorizontal className="h-4 w-4" />
              {bi("Clear filters", "फ़िल्टर हटाएँ")}
            </button>
          }
        />
      )}
    </>
  );
}
