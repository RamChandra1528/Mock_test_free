import { FileClock, Search } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { useState } from "react";
import {
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
} from "../../components/ui";
import { api } from "../../lib/api";
import { dateLabel, formatTime, scoreTone } from "../../lib/format";
import type { AttemptRow } from "../../types";
import { useLanguage } from "../../contexts/LanguageContext";

export function AttemptsPage() {
  const { language, localize, t } = useLanguage();
  const copy = attemptsCopy[language];
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["attempt-history", search, sort, page],
    refetchInterval: 30_000,
    queryFn: () =>
      api
        .get<{ items: AttemptRow[]; pages: number }>("/student/attempts", {
          params: { search: search || undefined, sort, page },
        })
        .then((r) => r.data),
  });
  return (
    <>
      <PageHeader
        eyebrow={copy.eyebrow}
        title={copy.title}
        description={copy.description}
      />
      <div className="card mb-5 grid gap-3 p-4 sm:grid-cols-[1fr_220px]">
        <label className="relative">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#819088]" />
          <input
            className="input pl-10"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder={copy.search}
          />
        </label>
        <select
          className="input"
          value={sort}
          onChange={(event) => {
            setSort(event.target.value);
            setPage(1);
          }}
        >
          <option value="newest">{copy.newest}</option>
          <option value="score">{copy.highestScore}</option>
          <option value="accuracy">{copy.highestAccuracy}</option>
        </select>
      </div>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : query.data?.items.length ? (
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{copy.testName}</th>
                <th>{copy.attempt}</th>
                <th>{copy.date}</th>
                <th>{copy.score}</th>
                <th>{copy.percentage}</th>
                <th>{t("accuracy")}</th>
                <th>{copy.time}</th>
                <th>{copy.actions}</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((a) => (
                <tr key={a.id}>
                  <td className="max-w-[250px] font-bold">
                    {localize(a.test, a.testHi)}
                  </td>
                  <td>#{a.attemptNumber}</td>
                  <td className="whitespace-nowrap text-[#6d7973]">
                    {dateLabel(a.date)}
                  </td>
                  <td>
                    {a.resultAvailable ? `${a.score} / ${a.totalMarks}` : "—"}
                  </td>
                  <td>
                    <span
                      className={`rounded-lg px-2 py-1 font-extrabold ${a.resultAvailable ? scoreTone(a.percentage ?? 0) : "text-[#6d7973]"}`}
                    >
                      {a.resultAvailable ? `${a.percentage}%` : "—"}
                    </span>
                  </td>
                  <td>{a.resultAvailable ? `${a.accuracy}%` : "—"}</td>
                  <td>{formatTime(a.timeTakenSeconds)}</td>
                  <td>
                    <div className="flex whitespace-nowrap gap-3">
                      {a.resultAvailable ? (
                        <Link
                          className="font-extrabold text-forest hover:underline"
                          to={`/student/result/${a.id}`}
                        >
                          {copy.result}
                        </Link>
                      ) : (
                        <span className="text-xs font-bold text-amber-700">
                          {copy.awaitingRelease}
                        </span>
                      )}
                      {a.reviewAvailable && (
                        <Link
                          className="font-extrabold text-[#6a756f] hover:underline"
                          to={`/student/result/${a.id}/review`}
                        >
                          {copy.review}
                        </Link>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={query.data.pages} onChange={setPage} />
        </div>
      ) : (
        <Empty
          title={copy.emptyTitle}
          description={copy.emptyDescription}
          action={
            <Link className="btn-primary" to="/student/exams">
              <FileClock className="h-4 w-4" />
              {copy.browse}
            </Link>
          }
        />
      )}
    </>
  );
}

const attemptsCopy = {
  en: {
    eyebrow: "Attempt history",
    title: "Every test, in one place",
    description:
      "Review past scores, revisit answers, and compare your progress over time.",
    search: "Search test history…",
    newest: "Newest first",
    highestScore: "Highest score",
    highestAccuracy: "Highest accuracy",
    testName: "Test name",
    attempt: "Attempt",
    date: "Date",
    score: "Score",
    percentage: "Percentage",
    time: "Time",
    actions: "Actions",
    result: "Result",
    awaitingRelease: "Awaiting release",
    review: "Review",
    emptyTitle: "No attempts found",
    emptyDescription: "Complete a mock test and it will appear here.",
    browse: "Browse tests",
  },
  hi: {
    eyebrow: "प्रयास इतिहास",
    title: "आपके सभी टेस्ट, एक ही जगह",
    description:
      "पिछले स्कोर देखें, उत्तरों की समीक्षा करें और समय के साथ अपनी प्रगति की तुलना करें।",
    search: "टेस्ट इतिहास खोजें…",
    newest: "नवीनतम पहले",
    highestScore: "सबसे अधिक स्कोर",
    highestAccuracy: "सबसे अधिक सटीकता",
    testName: "टेस्ट का नाम",
    attempt: "प्रयास",
    date: "तारीख",
    score: "स्कोर",
    percentage: "प्रतिशत",
    time: "समय",
    actions: "कार्रवाई",
    result: "परिणाम",
    awaitingRelease: "जारी होने की प्रतीक्षा",
    review: "समीक्षा",
    emptyTitle: "कोई प्रयास नहीं मिला",
    emptyDescription: "मॉक टेस्ट पूरा करने के बाद वह यहाँ दिखाई देगा।",
    browse: "टेस्ट देखें",
  },
} as const;
