import {
  ArrowLeft,
  BookOpenCheck,
  Clock3,
  Layers3,
  ListChecks,
  MinusCircle,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Badge, ErrorState, Loading, Modal } from "../../components/ui";
import { useState } from "react";
import { api } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { useLanguage } from "../../contexts/LanguageContext";

type Details = {
  id: string;
  title: string;
  titleHi?: string | null;
  description?: string;
  descriptionHi?: string | null;
  instructions?: string;
  instructionsHi?: string | null;
  category: { name: string; nameHi?: string | null };
  subject?: { name: string; nameHi?: string | null };
  durationMinutes: number;
  totalMarks: number;
  marksPerQuestion: number;
  negativeMarks: number;
  difficulty: string;
  attemptLimit?: number;
  allowResume: boolean;
  sections: { id: string; name: string; nameHi?: string | null }[];
  questionCount: number;
  latestAttempt?: {
    id: string;
    status: string;
    expectedEndTime: string;
    percentage?: number;
  };
};
export function ExamDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();
  const { language, localize, t } = useLanguage();
  const [confirm, setConfirm] = useState(false);
  const query = useQuery({
    queryKey: ["exam-details", id],
    queryFn: () => api.get<Details>(`/student/exams/${id}`).then((r) => r.data),
  });
  const start = useMutation({
    mutationFn: () =>
      api
        .post<{ id: string }>(`/student/exams/${id}/start`)
        .then((r) => r.data),
    onSuccess: (data) => {
      toast.show(
        language === "hi"
          ? "परीक्षा शुरू हो गई है। शुभकामनाएँ!"
          : "Exam started. Good luck!",
      );
      navigate(`/student/test/${data.id}`);
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  if (query.isLoading)
    return (
      <Loading
        label={
          language === "hi"
            ? "परीक्षा का विवरण लोड हो रहा है…"
            : "Loading exam details…"
        }
      />
    );
  if (query.error) return <ErrorState error={query.error} />;
  const exam = query.data!;
  const rules =
    language === "hi"
      ? [
          "प्रत्येक प्रश्न का एक सही उत्तर है, जब तक अलग से न बताया गया हो।",
          `सही उत्तर पर ${Number(exam.marksPerQuestion)} अंक मिलेंगे।`,
          `गलत उत्तर पर ${Number(exam.negativeMarks)} अंक काटे जाएंगे।`,
          "अनुत्तरित प्रश्नों के लिए शून्य अंक मिलेंगे।",
          "समय समाप्त होने पर टेस्ट अपने आप जमा हो जाएगा।",
          "परीक्षा के दौरान ब्राउज़र को रीफ्रेश या बंद न करें।",
        ]
      : [
          "Each question has one correct answer unless configured otherwise.",
          `Correct answers receive ${Number(exam.marksPerQuestion)} marks.`,
          `Wrong answers receive ${Number(exam.negativeMarks)} negative marks.`,
          "Unattempted questions receive zero marks.",
          "The test automatically submits when time expires.",
          "Avoid refreshing or closing the browser during the examination.",
        ];
  const instructions = localize(exam.instructions, exam.instructionsHi);
  const resume =
    exam.latestAttempt?.status === "IN_PROGRESS" &&
    new Date(exam.latestAttempt.expectedEndTime) > new Date();
  return (
    <>
      <Link
        to="/student/exams"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973] hover:text-forest"
      >
        <ArrowLeft className="h-4 w-4" />
        {language === "hi" ? "मॉक टेस्ट पर वापस जाएँ" : "Back to mock tests"}
      </Link>
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <section className="card overflow-hidden">
          <div className="bg-forest p-7 text-white sm:p-9">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="green">
                {localize(exam.category.name, exam.category.nameHi)}
              </Badge>
              <span className="rounded-full bg-white/10 px-3 py-1 text-[11px] font-extrabold uppercase tracking-wide">
                {language === "hi"
                  ? { EASY: "आसान", MEDIUM: "मध्यम", HARD: "कठिन" }[
                      exam.difficulty
                    ] ?? exam.difficulty
                  : exam.difficulty}
              </span>
            </div>
            <h1 className="mt-5 max-w-3xl font-display text-3xl font-extrabold tracking-tight sm:text-4xl">
              {localize(exam.title, exam.titleHi)}
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-white/65">
              {localize(exam.description, exam.descriptionHi)}
            </p>
          </div>
          <div className="p-6 sm:p-9">
            <p className="eyebrow">{t("examInstructions")}</p>
            <h2 className="mt-2 font-display text-2xl font-extrabold">
              {language === "hi"
                ? "शुरू करने से पहले नियम जान लें"
                : "Know the rules before you begin"}
            </h2>
            {instructions && (
              <p className="mt-3 rounded-xl bg-mint/60 p-4 text-sm leading-6 text-[#456158]">
                {instructions}
              </p>
            )}
            <ol className="mt-7 space-y-3">
              {rules.map((rule, index) => (
                <li
                  className="flex gap-3 text-sm leading-6 text-[#56655e]"
                  key={rule}
                >
                  <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[#eff1ed] text-[10px] font-extrabold">
                    {index + 1}
                  </span>
                  {rule}
                </li>
              ))}
            </ol>
            <div className="mt-8 flex flex-col gap-3 border-t border-[#e7e8e2] pt-6 sm:flex-row">
              <Link className="btn-secondary" to="/student/exams">
                <ArrowLeft className="h-4 w-4" />
                {language === "hi" ? "वापस" : "Back"}
              </Link>
              <button
                className="btn-primary sm:ml-auto"
                onClick={() => setConfirm(true)}
              >
                {resume
                  ? language === "hi"
                    ? "टेस्ट जारी रखें"
                    : "Resume test"
                  : t("startTest")}
                <BookOpenCheck className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
        <aside className="space-y-4">
          <div className="card p-5">
            <h2 className="font-display text-lg font-extrabold">
              {language === "hi" ? "टेस्ट का सारांश" : "Test overview"}
            </h2>
            <div className="mt-5 space-y-4">
              {[
                [ListChecks, t("questions"), exam.questionCount],
                [
                  Clock3,
                  t("duration"),
                  `${exam.durationMinutes} ${t("minutes")}`,
                ],
                [
                  Trophy,
                  language === "hi" ? "कुल अंक" : "Total marks",
                  Number(exam.totalMarks),
                ],
                [
                  MinusCircle,
                  language === "hi" ? "ऋणात्मक अंकन" : "Negative marking",
                  Number(exam.negativeMarks),
                ],
                [Layers3, t("sections"), exam.sections.length || 1],
              ].map(([Icon, label, value]) => {
                const I = Icon as typeof Clock3;
                return (
                  <div className="flex items-center gap-3" key={String(label)}>
                    <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest">
                      <I className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-xs text-[#829087]">
                        {label as string}
                      </p>
                      <p className="text-sm font-extrabold">
                        {value as React.ReactNode}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-2xl border border-[#cfe1d8] bg-mint/60 p-5">
            <ShieldCheck className="h-6 w-6 text-forest" />
            <h3 className="mt-3 font-display font-extrabold">
              {language === "hi"
                ? "आपके उत्तर सुरक्षित हैं"
                : "Your answers are safe"}
            </h3>
            <p className="mt-2 text-xs leading-5 text-[#597067]">
              {language === "hi"
                ? "आपके उत्तर काम करते समय सहेजे जाते हैं। आधिकारिक टाइमर सर्वर द्वारा नियंत्रित है।"
                : "Responses are saved as you work. The official timer is maintained by the server."}
            </p>
          </div>
        </aside>
      </div>
      <Modal
        open={confirm}
        title={
          resume
            ? language === "hi"
              ? "अपना प्रयास जारी रखें?"
              : "Resume your attempt?"
            : language === "hi"
              ? "शुरू करने के लिए तैयार हैं?"
              : "Ready to begin?"
        }
        onClose={() => setConfirm(false)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setConfirm(false)}>
              {language === "hi" ? "रद्द करें" : "Cancel"}
            </button>
            <button
              className="btn-primary"
              disabled={start.isPending}
              onClick={() => start.mutate()}
            >
              {start.isPending
                ? language === "hi"
                  ? "परीक्षा खुल रही है…"
                  : "Opening exam…"
                : resume
                  ? language === "hi"
                    ? "अभी जारी रखें"
                    : "Resume now"
                  : language === "hi"
                    ? "अभी शुरू करें"
                    : "Start now"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[#64726b]">
          {resume
            ? language === "hi"
              ? "आपके सहेजे गए उत्तर, चिह्नित प्रश्न, वर्तमान स्थान और शेष समय वापस आ जाएंगे।"
              : "Your saved answers, marked questions, current position, and remaining time will be restored."
            : language === "hi"
              ? `शुरू करते ही ${exam.durationMinutes} मिनट का टाइमर चालू हो जाएगा। स्थिर इंटरनेट और पर्याप्त निर्बाध समय सुनिश्चित करें।`
              : `Once you begin, the ${exam.durationMinutes}-minute timer will start. Make sure you have a stable connection and enough uninterrupted time.`}
        </p>
      </Modal>
    </>
  );
}
