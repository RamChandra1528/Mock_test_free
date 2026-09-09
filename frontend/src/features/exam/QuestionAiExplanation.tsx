import { useQuery } from "@tanstack/react-query";
import { LoaderCircle, Sparkles } from "lucide-react";
import { api } from "../../lib/api";
import { MarkdownContent } from "../../components/MarkdownContent";
import { useLanguage } from "../../contexts/LanguageContext";

export function QuestionAiExplanation({
  attemptId,
  questionId,
}: {
  attemptId: string;
  questionId: string;
}) {
  const { language } = useLanguage();
  const hindi = language === "hi";
  // A separate cache entry for each question, attempt and response language.
  // Filtering/unmounting a card must not cancel or move its pending response.
  const query = useQuery({
    queryKey: ["question-ai-explanation", attemptId, questionId, language],
    enabled: false,
    retry: false,
    staleTime: Infinity,
    gcTime: 60 * 60 * 1000,
    queryFn: async () => {
      const { data } = await api.post<{
        questionId: string;
        language: string;
        explanation: string;
      }>(
        `/student/attempts/${attemptId}/review/questions/${questionId}/explanation`,
        { language },
        { timeout: 70_000 },
      );
      if (
        data.questionId !== questionId ||
        data.language !== language ||
        !data.explanation?.trim()
      ) {
        throw new Error(
          hindi
            ? "AI की व्याख्या लोड नहीं हो सकी। फिर से प्रयास करें।"
            : "The AI explanation could not be loaded. Please try again.",
        );
      }
      return data;
    },
  });

  return (
    <section
      className="mt-4"
      aria-label={hindi ? "AI से व्याख्या" : "AI explanation"}
    >
      <button
        type="button"
        className="btn-secondary"
        disabled={query.isFetching || !!query.data}
        onClick={() => {
          void query.refetch();
        }}
        aria-controls={`ai-explanation-${questionId}`}
      >
        {query.isFetching ? (
          <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
        ) : (
          <Sparkles className="h-4 w-4" aria-hidden="true" />
        )}
        {query.isFetching
          ? hindi
            ? "AI समझा रहा है…"
            : "AI is explaining…"
          : query.error
            ? hindi
              ? "AI से फिर पूछें"
              : "Retry Ask AI"
            : hindi
              ? "AI से पूछें"
              : "Ask AI"}
      </button>
      <div
        id={`ai-explanation-${questionId}`}
        aria-live="polite"
        aria-busy={query.isFetching}
      >
        {query.error && (
          <p
            role="alert"
            className="mt-3 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
          >
            {query.error.message}
          </p>
        )}
        {query.data && (
          <div className="mt-4 rounded-2xl border border-[#d7e5de] bg-white p-5">
            <p className="eyebrow">
              {hindi ? "AI की व्याख्या" : "AI explanation"}
            </p>
            <MarkdownContent className="mt-3 text-sm leading-6 text-[#50635a]">
              {query.data.explanation}
            </MarkdownContent>
          </div>
        )}
      </div>
    </section>
  );
}
