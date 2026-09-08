import {
  ArrowLeft,
  ArrowRight,
  Bookmark,
  Check,
  CheckCircle2,
  Eraser,
  Flag,
  Grid3X3,
  LoaderCircle,
  LogOut,
  Menu,
  Send,
  X,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ExamTimer } from "../../components/ExamTimer";
import { LanguageToggle } from "../../components/LanguageToggle";
import { MarkdownContent } from "../../components/MarkdownContent";
import { ErrorState, Loading, Modal } from "../../components/ui";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import {
  mergeAnswer,
  questionIndex,
  summarizeQuestions,
  type LocalAnswer,
} from "../../features/exam/examState";
import { SubmitConfirmation } from "../../features/exam/SubmitConfirmation";
import { api } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/media";
import type { SavedAnswer, TestQuestion } from "../../types";

type AttemptData = {
  id: string;
  status: string;
  attemptNumber: number;
  expectedEndTime: string;
  serverTime: string;
  currentQuestion: number;
  exam: {
    id: string;
    title: string;
    titleHi?: string | null;
    durationMinutes: number;
    totalMarks: number;
    sections: { id: string; name: string; nameHi?: string | null }[];
  };
  questions: TestQuestion[];
  answers: SavedAnswer[];
  resultAvailable?: boolean;
};
type PendingSave = {
  answer: LocalAnswer;
  currentQuestion: number;
  version: number;
};
export function TestPage() {
  const { attemptId } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { localize, t } = useLanguage();
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, LocalAnswer>>({});
  const [submitOpen, setSubmitOpen] = useState(false);
  const [palette, setPalette] = useState(false);
  const [saving, setSaving] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const initialized = useRef(false);
  const pending = useRef<Map<string, PendingSave>>(loadPending(attemptId));
  const activeSaves = useRef<Set<Promise<void>>>(new Set());
  const savingQuestions = useRef<Set<string>>(new Set());
  const saveVersion = useRef(Date.now());
  const timerExpired = useRef(false);
  const query = useQuery({
    queryKey: ["active-attempt", attemptId],
    queryFn: () =>
      api
        .get<AttemptData>(`/student/attempts/${attemptId}`)
        .then((r) => r.data),
    staleTime: 0,
  });
  const data = query.data;
  useEffect(() => {
    if (!data || initialized.current) return;
    if (data.status !== "IN_PROGRESS") {
      navigate(
        data.resultAvailable === false
          ? "/student/dashboard"
          : `/student/result/${attemptId}`,
        { replace: true },
      );
      return;
    }
    initialized.current = true;
    const serverAnswers = Object.fromEntries(
      data.answers.map((a) => [
        a.questionId,
        {
          selectedOptionId: a.selectedOptionId,
          markedForReview: a.markedForReview,
          visited: a.visited,
        },
      ]),
    );
    const localAnswers = Object.fromEntries(
      [...pending.current].map(([questionId, save]) => [
        questionId,
        save.answer,
      ]),
    );
    const latestLocal = [...pending.current.values()].sort(
      (left, right) => right.version - left.version,
    )[0];
    setIndex(
      Math.min(
        latestLocal?.currentQuestion ?? data.currentQuestion,
        data.questions.length - 1,
      ),
    );
    setAnswers({ ...serverAnswers, ...localAnswers });
  }, [data, attemptId, navigate]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, []);

  const persist = useCallback(
    async (questionId: string, next: LocalAnswer, currentQuestion: number) => {
      const entry = {
        answer: next,
        currentQuestion,
        version: ++saveVersion.current,
      };
      pending.current.set(questionId, entry);
      storePending(attemptId, pending.current);
      if (savingQuestions.current.has(questionId)) return;
      savingQuestions.current.add(questionId);
      setSaving((n) => n + 1);
      const task = api
        .post(`/student/attempts/${attemptId}/answers`, {
          questionId,
          ...next,
          currentQuestion,
        })
        .then(() => {
          if (pending.current.get(questionId)?.version === entry.version) {
            pending.current.delete(questionId);
            storePending(attemptId, pending.current);
          }
        })
        .catch((error) =>
          toast.show(
            `${(error as Error).message}. Retrying automatically.`,
            "error",
          ),
        )
        .finally(() => {
          savingQuestions.current.delete(questionId);
          activeSaves.current.delete(task);
          setSaving((n) => Math.max(0, n - 1));
        });
      activeSaves.current.add(task);
      await task;
    },
    [attemptId, toast],
  );
  useEffect(() => {
    const timer = window.setInterval(() => {
      for (const [questionId, save] of pending.current) {
        void persist(questionId, save.answer, save.currentQuestion);
      }
    }, 10_000);
    return () => window.clearInterval(timer);
  }, [persist]);
  const update = (
    questionId: string,
    patch: Partial<LocalAnswer>,
    currentQuestion = index,
  ) => {
    const next = mergeAnswer(answers, questionId, patch);
    setAnswers((state) => ({ ...state, [questionId]: next }));
    void persist(questionId, next, currentQuestion);
  };
  const go = (requestedIndex: number) => {
    if (!data || requestedIndex < 0 || requestedIndex >= data.questions.length)
      return;
    const nextIndex = questionIndex(requestedIndex, data.questions.length);
    setIndex(nextIndex);
    setPalette(false);
    const target = data.questions[nextIndex];
    update(target.id, { visited: true }, nextIndex);
  };
  const submit = useCallback(async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await Promise.allSettled([...activeSaves.current]);
      await Promise.all(
        [...pending.current].map(([questionId, save]) =>
          persist(questionId, save.answer, save.currentQuestion),
        ),
      );
      if (pending.current.size && !timerExpired.current)
        throw new Error(t("answersSavingWarning"));
      if (timerExpired.current) clearPending(attemptId);
      const response = await api.post<{ resultAvailable?: boolean }>(
        `/student/attempts/${attemptId}/submit`,
      );
      clearPending(attemptId);
      toast.show(t("examSubmitted"));
      navigate(
        response.data.resultAvailable === false
          ? "/student/dashboard"
          : `/student/result/${attemptId}`,
        { replace: true },
      );
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes("already submitted"))
        navigate(`/student/result/${attemptId}`, { replace: true });
      else {
        toast.show(message, "error");
        setSubmitting(false);
      }
    }
  }, [attemptId, navigate, persist, submitting, t, toast]);

  if (query.isLoading)
    return (
      <div className="min-h-screen bg-[#eef0ec]">
        <Loading label={t("restoringExam")} />
      </div>
    );
  if (query.error)
    return (
      <div className="min-h-screen bg-[#eef0ec] p-6">
        <ErrorState error={query.error} />
      </div>
    );
  if (!data || data.status !== "IN_PROGRESS" || !data.questions?.length)
    return <Loading label={t("openingResult")} />;
  const question = data.questions[index];
  const answer = answers[question.id] ?? {
    selectedOptionId: null,
    markedForReview: false,
    visited: true,
  };
  const counts = summarizeQuestions(data.questions, answers, index);
  return (
    <div className="flex min-h-screen flex-col bg-[#edf0ec]">
      <header className="sticky top-0 z-30 flex min-h-[68px] items-center gap-3 bg-forest px-4 text-white shadow-lg sm:px-6">
        <div className="min-w-0 flex-1">
          <p className="truncate font-display text-sm font-extrabold sm:text-base">
            {localize(data.exam.title, data.exam.titleHi)}
          </p>
          <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
            {t("attempt")} #{data.attemptNumber} · {t("liveExam")}
          </p>
        </div>
        <div className="hidden items-center gap-2 text-xs font-bold text-white/55 sm:flex">
          {saving ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" />
              {t("saving")}
            </>
          ) : (
            <>
              <Check className="h-4 w-4 text-lime" />
              {t("allSaved")}
            </>
          )}
        </div>
        <LanguageToggle dark compact />
        <ExamTimer
          expectedEndTime={data.expectedEndTime}
          serverTime={data.serverTime}
          onExpire={() => {
            timerExpired.current = true;
            void submit();
          }}
        />
        <button
          className="rounded-xl bg-white/10 p-2 lg:hidden"
          aria-label={t("openPalette")}
          onClick={() => setPalette(true)}
        >
          <Grid3X3 className="h-5 w-5" />
        </button>
        <button
          className="hidden rounded-xl bg-white/10 px-3 py-2 text-xs font-bold hover:bg-white/20 sm:flex"
          onClick={() => setSubmitOpen(true)}
        >
          <Send className="mr-2 h-4 w-4" />
          {t("submit")}
        </button>
      </header>
      <main className="flex flex-1">
        <section className="min-w-0 flex-1 p-3 sm:p-5 lg:pr-0">
          <article className="mx-auto flex min-h-[calc(100vh-110px)] max-w-5xl flex-col rounded-2xl border border-[#dfe3dc] bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-[#e9ebe6] px-5 py-4 sm:px-7">
              <div>
                <span className="font-display text-sm font-extrabold">
                  {t("question")} {index + 1}
                </span>
                <span className="ml-2 text-xs text-[#87928d]">
                  {t("of")} {data.questions.length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="hidden rounded-full bg-[#f0f2ee] px-3 py-1 text-[10px] font-extrabold text-[#65726c] sm:block">
                  {localize(
                    question.subject?.name,
                    question.subject?.nameHi,
                  ) || t("general")}
                </span>
                {answer.markedForReview && (
                  <span className="flex items-center gap-1 rounded-full bg-violet-100 px-3 py-1 text-[10px] font-extrabold text-violet-700">
                    <Bookmark className="h-3 w-3" />
                    {t("marked")}
                  </span>
                )}
              </div>
            </div>
            <div className="flex-1 p-5 sm:p-8">
              <h1 className="font-display text-lg font-bold leading-8 sm:text-xl">
                <MarkdownContent>
                  {localize(question.text, question.textHi)}
                </MarkdownContent>
              </h1>
              {question.imageUrl && (
                <img
                  className="mt-5 max-h-80 rounded-xl object-contain"
                  src={resolveMediaUrl(question.imageUrl)}
                  alt={t("questionIllustration")}
                />
              )}
              <fieldset className="mt-7 grid gap-3">
                <legend className="sr-only">{t("answerOptions")}</legend>
                {question.options.map((option) => (
                  <label
                    key={option.id}
                    className={`group flex cursor-pointer items-start gap-4 rounded-xl border p-4 transition sm:p-5 ${answer.selectedOptionId === option.id ? "border-forest bg-mint/70 ring-1 ring-forest" : "border-[#dfe3dc] hover:border-[#9fb7ac] hover:bg-[#fafbf8]"}`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name={`question-${question.id}`}
                      checked={answer.selectedOptionId === option.id}
                      onChange={() =>
                        update(question.id, {
                          selectedOptionId: option.id,
                          visited: true,
                        })
                      }
                    />
                    <span
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-lg border text-xs font-extrabold transition ${answer.selectedOptionId === option.id ? "border-forest bg-forest text-white" : "border-[#cfd5ce] bg-white group-hover:border-forest"}`}
                    >
                      {option.label}
                    </span>
                    <span className="pt-1 text-sm font-semibold leading-6 sm:text-base">
                      <MarkdownContent>
                        {localize(option.text, option.textHi)}
                      </MarkdownContent>
                    </span>
                    {option.imageUrl && (
                      <img
                        src={resolveMediaUrl(option.imageUrl)}
                        alt={t("optionIllustration")}
                        className="ml-auto max-h-24 max-w-40 object-contain"
                      />
                    )}
                  </label>
                ))}
              </fieldset>
            </div>
            <nav className="sticky bottom-0 flex flex-wrap items-center gap-2 border-t border-[#e6e9e3] bg-white p-3 sm:p-4">
              <button
                className="btn-secondary"
                disabled={index === 0}
                onClick={() => go(index - 1)}
              >
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">{t("previous")}</span>
              </button>
              <button
                className="btn-secondary text-[#a24736]"
                disabled={!answer.selectedOptionId}
                onClick={() => update(question.id, { selectedOptionId: null })}
              >
                <Eraser className="h-4 w-4" />
                <span className="hidden sm:inline">{t("clearResponse")}</span>
              </button>
              <button
                className={`btn-secondary ${answer.markedForReview ? "!border-violet-300 !bg-violet-50 !text-violet-700" : ""}`}
                onClick={() =>
                  update(question.id, {
                    markedForReview: !answer.markedForReview,
                  })
                }
              >
                <Flag className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {answer.markedForReview ? t("unmark") : t("markReview")}
                </span>
              </button>
              {index < data.questions.length - 1 ? (
                <button
                  className="btn-primary ml-auto"
                  onClick={() => go(index + 1)}
                >
                  {t("saveNext")}
                  <ArrowRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  className="btn-primary ml-auto"
                  onClick={() => setSubmitOpen(true)}
                >
                  {t("reviewSubmit")}
                  <Send className="h-4 w-4" />
                </button>
              )}
            </nav>
          </article>
        </section>
        <aside
          className={`fixed inset-y-0 right-0 z-40 w-[310px] overflow-y-auto border-l border-[#dce0da] bg-white p-5 shadow-2xl transition-transform lg:static lg:z-auto lg:mt-5 lg:h-[calc(100vh-88px)] lg:w-[300px] lg:translate-x-0 lg:rounded-l-2xl lg:shadow-none ${palette ? "translate-x-0" : "translate-x-full"}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">{t("questionPalette")}</p>
              <p className="mt-1 text-xs text-[#7c8882]">
                {t("jumpQuestion")}
              </p>
            </div>
            <button
              className="rounded-lg p-2 hover:bg-[#eef0ec] lg:hidden"
              aria-label={t("closePalette")}
              onClick={() => setPalette(false)}
            >
              <X />
            </button>
          </div>
          <div className="mt-5 grid grid-cols-5 gap-2">
            {data.questions.map((q, i) => (
              <button
                key={q.id}
                aria-label={`${t("question")} ${i + 1}`}
                onClick={() => go(i)}
                className={`grid aspect-square place-items-center rounded-lg text-xs font-extrabold transition ${i === index ? "ring-2 ring-forest ring-offset-2" : ""} ${paletteClass(answers[q.id], i === index)}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <div className="mt-7 border-t border-[#e7e9e4] pt-5">
            <p className="text-xs font-extrabold uppercase tracking-wider text-[#68766f]">
              {t("statusLegend")}
            </p>
            <div className="mt-4 grid gap-3 text-xs font-semibold text-[#637069]">
              {[
                ["bg-emerald-500", t("answered"), counts.answered],
                ["bg-rose-400", t("notAnswered"), counts.notAnswered],
                ["bg-[#e1e5df]", t("notVisited"), counts.notVisited],
                ["bg-violet-500", t("reviewMarked"), counts.marked],
                [
                  "bg-violet-500 ring-2 ring-emerald-400",
                  t("answeredMarked"),
                  counts.answeredMarked,
                ],
              ].map(([color, label, count]) => (
                <div className="flex items-center gap-3" key={String(label)}>
                  <span className={`h-4 w-4 rounded ${color}`} />
                  <span>{label}</span>
                  <b className="ml-auto">{count}</b>
                </div>
              ))}
            </div>
          </div>
          <button
            className="btn-primary mt-7 w-full sm:hidden"
            onClick={() => setSubmitOpen(true)}
          >
            <Send className="h-4 w-4" />
            {t("submitTest")}
          </button>
        </aside>
        {palette && (
          <button
            className="fixed inset-0 z-30 bg-black/50 lg:hidden"
            aria-label={t("closePalette")}
            onClick={() => setPalette(false)}
          />
        )}
      </main>
      <Modal
        open={submitOpen}
        title={t("submitYourTest")}
        onClose={() => setSubmitOpen(false)}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => setSubmitOpen(false)}
            >
              {t("cancel")}
            </button>
            <button
              className="btn-primary"
              disabled={submitting}
              onClick={submit}
            >
              {submitting ? (
                <>
                  <LoaderCircle className="h-4 w-4 animate-spin" />
                  {t("submitting")}
                </>
              ) : (
                <>
                  {t("submitTest")}
                  <Send className="h-4 w-4" />
                </>
              )}
            </button>
          </>
        }
      >
        <SubmitConfirmation counts={counts} total={data.questions.length} />
      </Modal>
    </div>
  );
}

function pendingKey(attemptId?: string) {
  return `mockmaster_pending_${attemptId ?? "unknown"}`;
}

function loadPending(attemptId?: string): Map<string, PendingSave> {
  try {
    const parsed = JSON.parse(
      localStorage.getItem(pendingKey(attemptId)) ?? "[]",
    ) as Array<[string, PendingSave]>;
    return new Map(parsed);
  } catch {
    return new Map();
  }
}

function storePending(
  attemptId: string | undefined,
  saves: Map<string, PendingSave>,
) {
  if (!saves.size) return clearPending(attemptId);
  localStorage.setItem(pendingKey(attemptId), JSON.stringify([...saves]));
}

function clearPending(attemptId?: string) {
  localStorage.removeItem(pendingKey(attemptId));
}

function paletteClass(answer?: LocalAnswer, current = false) {
  if (answer?.markedForReview && answer.selectedOptionId)
    return "bg-violet-600 text-white after:ml-[-5px] after:mt-[-22px] after:h-2 after:w-2 after:rounded-full after:bg-emerald-300";
  if (answer?.markedForReview) return "bg-violet-600 text-white";
  if (answer?.selectedOptionId) return "bg-emerald-500 text-white";
  if (answer?.visited || current) return "bg-rose-400 text-white";
  return "bg-[#e1e5df] text-[#69766f]";
}
