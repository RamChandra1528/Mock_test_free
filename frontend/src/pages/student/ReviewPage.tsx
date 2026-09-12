import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  MinusCircle,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, ErrorState, Loading } from "../../components/ui";
import { api } from "../../lib/api";
import { MarkdownContent } from "../../components/MarkdownContent";
import { resolveMediaUrl } from "../../lib/media";
import { useLanguage } from "../../contexts/LanguageContext";

type ReviewQuestion = {
  id: string;
  order: number;
  text: string;
  textHi?: string | null;
  imageUrl?: string;
  explanation?: string;
  explanationHi?: string | null;
  subject: string;
  subjectHi?: string | null;
  options: {
    id: string;
    label: string;
    text: string;
    textHi?: string | null;
    imageUrl?: string;
    isCorrect: boolean;
  }[];
  selectedOptionId: string | null;
  markedForReview: boolean;
  status: "CORRECT" | "WRONG" | "UNATTEMPTED";
  marksAwarded: number;
};
export function ReviewPage() {
  const { attemptId } = useParams();
  const { language, localize, t } = useLanguage();
  const [filter, setFilter] = useState("ALL");
  const query = useQuery({
    queryKey: ["review", attemptId],
    queryFn: () =>
      api
        .get<{
          exam: { title: string; titleHi?: string | null };
          questions: ReviewQuestion[];
        }>(`/student/attempts/${attemptId}/review`)
        .then((r) => r.data),
  });
  const filtered = useMemo(
    () =>
      query.data?.questions.filter((q) =>
        filter === "ALL" || filter === "MARKED"
          ? filter === "ALL" || q.markedForReview
          : q.status === filter,
      ) ?? [],
    [query.data, filter],
  );
  if (query.isLoading)
    return (
      <Loading
        label={
          language === "hi"
            ? "उत्तर समीक्षा लोड हो रही है…"
            : "Loading answer review…"
        }
      />
    );
  if (query.error) return <ErrorState error={query.error} />;
  return (
    <div className="mx-auto max-w-6xl">
      <Link
        to={`/student/result/${attemptId}`}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973] hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" />
        {t("backResult")}
      </Link>
      <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="eyebrow">{t("reviewAnswers")}</p>
          <h1 className="page-title mt-1">
            {localize(query.data!.exam.title, query.data!.exam.titleHi)}
          </h1>
          <p className="mt-2 text-sm text-[#6c7973]">
            {language === "hi"
              ? "हर विकल्प को समझें और गलतियों को उपयोगी दोहराव में बदलें।"
              : "Understand every choice and turn mistakes into useful revision."}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {["ALL", "CORRECT", "WRONG", "UNATTEMPTED", "MARKED"].map((f) => (
            <button
              key={f}
              className={`rounded-xl px-3 py-2 text-xs font-extrabold ${filter === f ? "bg-forest text-white" : "border border-[#dce0d9] bg-white text-[#5d6a64]"}`}
              onClick={() => {
                setFilter(f);
              }}
            >
              {filterLabel(f, language)}
            </button>
          ))}
        </div>
      </div>
      {filtered.length > 0 ? (
        <div className="grid gap-5 lg:grid-cols-[1fr_250px]">
          <div className="min-w-0 space-y-5">
            {filtered.map((question) => (
              <article
                key={`${attemptId}-${question.id}`}
                id={`question-${question.id}`}
                aria-label={`${t("question")} ${question.order}`}
                className="card scroll-mt-6 overflow-hidden"
              >
                <div
                  className={`flex items-center justify-between border-b px-6 py-4 ${question.status === "CORRECT" ? "border-emerald-100 bg-emerald-50" : question.status === "WRONG" ? "border-rose-100 bg-rose-50" : "border-[#e5e7e2] bg-[#f5f6f2]"}`}
                >
                  <div className="flex items-center gap-3">
                    {question.status === "CORRECT" ? (
                      <CheckCircle2 className="text-emerald-700" />
                    ) : question.status === "WRONG" ? (
                      <XCircle className="text-rose-700" />
                    ) : (
                      <MinusCircle className="text-[#6e7974]" />
                    )}
                    <span className="font-display font-extrabold">
                      {t("question")} {question.order}
                    </span>
                    <Badge>
                      {localize(question.subject, question.subjectHi)}
                    </Badge>
                  </div>
                  <b
                    className={
                      question.marksAwarded > 0
                        ? "text-emerald-700"
                        : question.marksAwarded < 0
                          ? "text-rose-700"
                          : ""
                    }
                  >
                    {question.marksAwarded > 0 ? "+" : ""}
                    {question.marksAwarded} {t("marks").toLowerCase()}
                  </b>
                </div>
                <div className="p-6 sm:p-8">
                  <h2 className="font-display text-xl font-bold leading-8">
                    <MarkdownContent>
                      {localize(question.text, question.textHi)}
                    </MarkdownContent>
                  </h2>
                  {question.imageUrl && (
                    <figure className="mt-4 w-full">
                      <img
                        src={resolveMediaUrl(question.imageUrl)}
                        alt="Question"
                        className="block h-auto w-full max-w-2xl rounded-xl border border-[#dfe3dc] object-contain"
                      />
                    </figure>
                  )}
                  <div className="mt-7 grid gap-3">
                    {question.options.map((o) => {
                      const selected = o.id === question.selectedOptionId;
                      return (
                        <div
                          key={o.id}
                          className={`flex items-start gap-3 rounded-xl border p-4 ${o.isCorrect ? "border-emerald-300 bg-emerald-50" : selected ? "border-rose-300 bg-rose-50" : "border-[#e2e5de]"}`}
                        >
                          <span
                            className={`grid h-7 w-7 shrink-0 place-items-center rounded-lg text-xs font-extrabold ${o.isCorrect ? "bg-emerald-600 text-white" : selected ? "bg-rose-600 text-white" : "bg-[#eef0eb]"}`}
                          >
                            {o.label}
                          </span>
                          <div className="min-w-0 flex-1 pt-1 text-sm font-semibold">
                            <MarkdownContent>
                              {localize(o.text, o.textHi)}
                            </MarkdownContent>
                            {o.imageUrl && (
                              <img
                                src={resolveMediaUrl(o.imageUrl)}
                                alt={`Option ${o.label}`}
                                className="mt-3 max-h-52 max-w-full rounded-lg border border-[#dfe3dc] object-contain"
                              />
                            )}
                          </div>
                          <span className="ml-auto text-[10px] font-extrabold uppercase">
                            {o.isCorrect
                              ? selected
                                ? `${t("yourAnswer")} · ${t("correctAnswer")}`
                                : t("correctAnswer")
                              : selected
                                ? t("yourAnswer")
                                : ""}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-7 rounded-2xl border border-[#d7e5de] bg-mint/50 p-5">
                    <p className="eyebrow">{t("explanation")}</p>
                    <div className="mt-2 text-sm leading-6 text-[#50635a]">
                      <MarkdownContent>
                        {localize(
                          question.explanation,
                          question.explanationHi,
                        ) ||
                          (language === "hi"
                            ? "इस प्रश्न के लिए कोई व्याख्या उपलब्ध नहीं है।"
                            : "No explanation was provided for this question.")}
                      </MarkdownContent>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
          <aside className="card h-fit p-4 lg:sticky lg:top-6">
            <p className="text-xs font-extrabold uppercase tracking-widest text-[#75827b]">
              {language === "hi" ? "प्रश्न नेविगेटर" : "Question navigator"}
            </p>
            <div className="mt-4 grid grid-cols-5 gap-2">
              {filtered.map((q) => (
                <a
                  aria-label={`${t("question")} ${q.order}`}
                  key={q.id}
                  href={`#question-${q.id}`}
                  className={`grid aspect-square place-items-center rounded-lg text-xs font-extrabold focus:ring-2 focus:ring-forest focus:ring-offset-2 ${q.status === "CORRECT" ? "bg-emerald-100 text-emerald-800" : q.status === "WRONG" ? "bg-rose-100 text-rose-800" : "bg-[#ebede8] text-[#69766f]"}`}
                >
                  {q.order}
                </a>
              ))}
            </div>
          </aside>
        </div>
      ) : (
        <div className="card grid min-h-[300px] place-items-center text-center">
          <div>
            <Bookmark className="mx-auto text-[#819088]" />
            <p className="mt-3 font-display font-extrabold">
              {language === "hi"
                ? "इस फ़िल्टर में कोई प्रश्न नहीं है"
                : "No questions in this filter"}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function filterLabel(filter: string, language: "en" | "hi") {
  const labels: Record<string, [string, string]> = {
    ALL: ["All", "सभी"],
    CORRECT: ["Correct", "सही"],
    WRONG: ["Wrong", "गलत"],
    UNATTEMPTED: ["Unattempted", "अनुत्तरित"],
    MARKED: ["Marked", "चिह्नित"],
  };
  return labels[filter]?.[language === "hi" ? 1 : 0] ?? filter;
}
