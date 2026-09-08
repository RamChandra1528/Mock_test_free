import { ArrowLeft, ArrowRight, Eye, ShieldCheck } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ErrorState, Loading } from "../../components/ui";
import { api } from "../../lib/api";
import { MarkdownContent } from "../../components/MarkdownContent";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useLanguage } from "../../contexts/LanguageContext";
import { resolveMediaUrl } from "../../lib/media";

type PreviewQuestion = {
  id: string;
  order: number;
  text: string;
  textHi?: string | null;
  imageUrl?: string | null;
  options: {
    id: string;
    label: string;
    text: string;
    textHi?: string | null;
    imageUrl?: string | null;
  }[];
};
export function ExamPreviewPage() {
  const { id } = useParams();
  const { localize } = useLanguage();
  const [index, setIndex] = useState(0);
  const query = useQuery({
    queryKey: ["exam-preview", id],
    queryFn: async () => {
      const [exam, questions] = await Promise.all([
        api.get<{
          title: string;
          titleHi?: string | null;
          durationMinutes: number;
        }>(
          `/admin/exams/${id}`,
        ),
        api.get<{ items: PreviewQuestion[] }>("/admin/questions", {
          params: { examId: id, limit: 100 },
        }),
      ]);
      return { exam: exam.data, questions: questions.data.items };
    },
  });
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} />;
  const { exam, questions } = query.data!;
  const q = questions[index];
  return (
    <>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/admin/exams"
          className="inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to exams
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageToggle />
          <span className="flex items-center gap-2 rounded-full bg-violet-100 px-3 py-1.5 text-xs font-extrabold text-violet-700">
            <Eye className="h-4 w-4" />
            ADMIN PREVIEW · NO ATTEMPT CREATED
          </span>
        </div>
      </div>
      {q ? (
        <div className="overflow-hidden rounded-2xl border border-[#dbe0da] bg-[#eef1ed]">
          <header className="flex items-center justify-between bg-forest px-5 py-4 text-white">
            <div>
              <p className="font-display font-extrabold">
                {localize(exam.title, exam.titleHi)}
              </p>
              <p className="text-[10px] font-bold uppercase tracking-widest text-white/50">
                Student experience preview
              </p>
            </div>
            <span className="rounded-xl bg-white/10 px-3 py-2 font-mono text-sm">
              {String(Math.floor(exam.durationMinutes / 60)).padStart(2, "0")}:
              {String(exam.durationMinutes % 60).padStart(2, "0")}:00
            </span>
          </header>
          <div className="grid min-h-[620px] lg:grid-cols-[1fr_280px]">
            <section className="m-4 flex flex-col rounded-2xl bg-white">
              <div className="border-b border-[#e7e9e4] p-5 font-display font-extrabold">
                Question {index + 1}{" "}
                <span className="text-xs font-semibold text-[#86928c]">
                  of {questions.length}
                </span>
              </div>
              <div className="flex-1 p-6">
                <h1 className="font-display text-xl font-bold leading-8">
                  <MarkdownContent>
                    {localize(q.text, q.textHi)}
                  </MarkdownContent>
                </h1>
                {q.imageUrl && (
                  <img
                    className="mt-5 max-h-80 rounded-xl object-contain"
                    src={resolveMediaUrl(q.imageUrl)}
                    alt="Question illustration"
                  />
                )}
                <div className="mt-7 grid gap-3">
                  {q.options.map((o) => (
                    <div
                      className="flex items-start gap-3 rounded-xl border border-[#dfe3dc] p-4 text-sm font-semibold"
                      key={o.id}
                    >
                      <b className="shrink-0">{o.label}</b>
                      <div className="min-w-0 flex-1">
                        <MarkdownContent>
                          {localize(o.text, o.textHi)}
                        </MarkdownContent>
                      </div>
                      {o.imageUrl && (
                        <img
                          className="ml-auto max-h-24 max-w-40 object-contain"
                          src={resolveMediaUrl(o.imageUrl)}
                          alt="Option illustration"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div className="flex justify-between border-t border-[#e7e9e4] p-4">
                <button
                  className="btn-secondary"
                  disabled={index === 0}
                  onClick={() => setIndex(index - 1)}
                >
                  <ArrowLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  className="btn-primary"
                  disabled={index === questions.length - 1}
                  onClick={() => setIndex(index + 1)}
                >
                  Save & next
                  <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </section>
            <aside className="m-4 ml-0 rounded-2xl bg-white p-5">
              <p className="eyebrow">Question palette</p>
              <div className="mt-5 grid grid-cols-5 gap-2">
                {questions.map((x, i) => (
                  <button
                    className={`aspect-square rounded-lg text-xs font-extrabold ${i === index ? "bg-forest text-white ring-2 ring-lime ring-offset-2" : "bg-[#e8ebe6]"}`}
                    key={x.id}
                    onClick={() => setIndex(i)}
                  >
                    {i + 1}
                  </button>
                ))}
              </div>
              <div className="mt-8 rounded-xl bg-mint p-4">
                <ShieldCheck className="h-5 w-5 text-forest" />
                <p className="mt-2 text-xs leading-5 text-[#52665d]">
                  Previewing never affects analytics and never creates a student
                  attempt.
                </p>
              </div>
            </aside>
          </div>
        </div>
      ) : (
        <div className="card grid min-h-80 place-items-center text-center">
          <div>
            <p className="font-display text-xl font-extrabold">
              No questions to preview
            </p>
            <Link
              className="btn-primary mt-4"
              to={`/admin/exams/${id}/questions`}
            >
              Add questions
            </Link>
          </div>
        </div>
      )}
    </>
  );
}
