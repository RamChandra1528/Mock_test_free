import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  ListRestart,
  MinusCircle,
  Target,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link, useParams } from "react-router-dom";
import { ErrorState, Loading } from "../../components/ui";
import { api } from "../../lib/api";
import { dateLabel, formatTime } from "../../lib/format";
import { useLanguage } from "../../contexts/LanguageContext";

type Result = {
  id: string;
  exam: {
    id: string;
    title: string;
    titleHi?: string | null;
    allowAnswerReview: boolean;
  };
  attemptNumber: number;
  status: string;
  score: number;
  totalMarks: number;
  correct: number;
  wrong: number;
  unanswered: number;
  accuracy: number;
  percentage: number;
  timeTakenSeconds: number;
  submittedAt: string;
  sections: {
    section: string;
    sectionHi?: string | null;
    correct: number;
    wrong: number;
    unattempted: number;
    score: number;
    accuracy: number;
  }[];
};
export function ResultPage() {
  const { attemptId } = useParams();
  const { language, localize, t } = useLanguage();
  const query = useQuery({
    queryKey: ["result", attemptId],
    refetchInterval: (state) => state.state.error?.message === "Results have not been released for this exam" ? 30_000 : false,
    queryFn: () =>
      api
        .get<Result>(`/student/attempts/${attemptId}/result`)
        .then((r) => r.data),
  });
  if (query.isLoading)
    return (
      <Loading
        label={
          language === "hi"
            ? "आपका परिणाम तैयार हो रहा है…"
            : "Calculating your result…"
        }
      />
    );
  if (query.error?.message === "Results have not been released for this exam")
    return <div className="card mx-auto max-w-xl p-8 text-center">
      <Clock3 className="mx-auto h-10 w-10 text-amber-600" />
      <h1 className="mt-4 font-display text-2xl font-extrabold">
        {language === "hi" ? "परिणाम की घोषणा बाकी है" : "Awaiting result declaration"}
      </h1>
      <p className="mt-3 text-sm text-[#6d7973]">
        {language === "hi" ? "आपका टेस्ट जमा हो गया है। एडमिन परिणाम घोषित करेगा तब आपका स्कोर यहाँ दिखेगा।" : "Your test has been submitted. Your score will appear here once the admin declares the result."}
      </p>
      <Link to="/student/attempts" className="btn-secondary mt-6">{t("viewHistory")}</Link>
    </div>;
  if (query.error) return <ErrorState error={query.error} />;
  const r = query.data!;
  const chart = [
    { name: t("correct"), value: r.correct, color: "#2e9b6f" },
    { name: t("wrong"), value: r.wrong, color: "#ef765f" },
    { name: t("unattempted"), value: r.unanswered, color: "#d8ddd8" },
  ];
  return (
    <div className="mx-auto max-w-6xl">
      <section className="noise relative overflow-hidden rounded-[2rem] bg-forest p-7 text-white sm:p-10">
        <div className="relative grid items-center gap-8 md:grid-cols-[1fr_280px]">
          <div>
            <p className="eyebrow !text-lime">
              {language === "hi" ? "आपका परिणाम" : "Your result"}
            </p>
            <h1 className="mt-2 font-display text-3xl font-extrabold sm:text-4xl">
              {localize(r.exam.title, r.exam.titleHi)}
            </h1>
            <p className="mt-2 text-sm text-white/55">
              {language === "hi" ? "प्रयास" : "Attempt"} #{r.attemptNumber} ·{" "}
              {language === "hi" ? "जमा किया" : "Submitted"}{" "}
              {dateLabel(r.submittedAt)}
            </p>
            <div className="mt-8 flex items-end gap-3">
              <span className="font-display text-6xl font-extrabold tracking-[-.06em] text-lime sm:text-7xl">
                {r.score}
              </span>
              <span className="mb-2 text-xl font-bold text-white/55">
                / {r.totalMarks}
              </span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white/70">
              {resultCopy(r.percentage, language)}
            </p>
          </div>
          <div className="mx-auto h-[230px] w-[230px] rounded-full bg-white/5">
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={chart}
                  dataKey="value"
                  innerRadius={72}
                  outerRadius={98}
                  stroke="none"
                  startAngle={90}
                  endAngle={-270}
                >
                  {chart.map((x) => (
                    <Cell fill={x.color} key={x.name} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none relative -top-[139px] text-center">
              <span className="font-display text-3xl font-extrabold">
                {r.percentage}%
              </span>
              <span className="block text-[10px] font-bold uppercase tracking-widest text-white/50">
                {language === "hi" ? "कुल" : "Overall"}
              </span>
            </div>
          </div>
        </div>
      </section>
      <section className="-mt-1 grid gap-4 py-6 sm:grid-cols-2 lg:grid-cols-5">
        {[
          [
            CheckCircle2,
            t("correct"),
            r.correct,
            "text-emerald-700 bg-emerald-50",
          ],
          [XCircle, t("wrong"), r.wrong, "text-rose-700 bg-rose-50"],
          [
            MinusCircle,
            t("unattempted"),
            r.unanswered,
            "text-[#69766f] bg-[#f0f2ee]",
          ],
          [
            Target,
            t("accuracy"),
            `${r.accuracy}%`,
            "text-violet-700 bg-violet-50",
          ],
          [
            Clock3,
            t("timeTaken"),
            formatTime(r.timeTakenSeconds),
            "text-amber-700 bg-amber-50",
          ],
        ].map(([Icon, label, value, color]) => {
          const I = Icon as typeof CheckCircle2;
          return (
            <div className="card p-4" key={String(label)}>
              <span
                className={`grid h-9 w-9 place-items-center rounded-xl ${color}`}
              >
                <I className="h-5 w-5" />
              </span>
              <p className="mt-3 text-xs font-bold text-[#818c86]">
                {label as string}
              </p>
              <p className="font-display text-xl font-extrabold">
                {value as React.ReactNode}
              </p>
            </div>
          );
        })}
      </section>
      <section className="card p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <p className="eyebrow">{t("sectionAnalysis")}</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              {language === "hi"
                ? "अंक कहाँ से मिले"
                : "Where the marks came from"}
            </h2>
          </div>
          {r.exam.allowAnswerReview && (
            <Link to={`/student/result/${r.id}/review`} className="btn-primary">
              {t("reviewAnswers")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          )}
        </div>
        <div className="table-wrap mt-6 !shadow-none">
          <table className="data-table">
            <thead>
              <tr>
                <th>{language === "hi" ? "खंड" : "Section"}</th>
                <th>{t("correct")}</th>
                <th>{t("wrong")}</th>
                <th>{t("unattempted")}</th>
                <th>{language === "hi" ? "स्कोर" : "Score"}</th>
                <th>{t("accuracy")}</th>
              </tr>
            </thead>
            <tbody>
              {r.sections.map((s) => (
                <tr key={s.section}>
                  <td className="font-extrabold">
                    {localize(s.section, s.sectionHi)}
                  </td>
                  <td className="text-emerald-700">{s.correct}</td>
                  <td className="text-rose-700">{s.wrong}</td>
                  <td>{s.unattempted}</td>
                  <td className="font-bold">{s.score}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-16 overflow-hidden rounded-full bg-[#e8ebe6]">
                        <span
                          className="block h-full rounded-full bg-forest"
                          style={{ width: `${s.accuracy}%` }}
                        />
                      </span>
                      <b>{s.accuracy}%</b>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-7 h-[280px]" aria-label="Section accuracy chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={r.sections.map((section) => ({
                ...section,
                localizedSection: localize(section.section, section.sectionHi),
              }))}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e3" />
              <XAxis dataKey="localizedSection" tick={{ fontSize: 10 }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Bar
                dataKey="accuracy"
                name={language === "hi" ? "सटीकता %" : "Accuracy %"}
                fill="#173f35"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>
      <div className="mt-6 flex flex-col justify-end gap-3 sm:flex-row">
        <Link to="/student/attempts" className="btn-secondary">
          {t("viewHistory")}
        </Link>
        <Link to={`/student/exams/${r.exam.id}`} className="btn-primary">
          <ListRestart className="h-4 w-4" />
          {language === "hi"
            ? "यह टेस्ट फिर से दें"
            : "Try this test again"}
        </Link>
      </div>
    </div>
  );
}
const resultCopy = (percentage: number, language: "en" | "hi") =>
  language === "hi"
    ? percentage >= 80
      ? "शानदार काम—आपकी तैयारी साफ दिखाई दे रही है।"
      : percentage >= 60
        ? "अच्छी प्रगति। गलत उत्तरों की समीक्षा करके आगे बढ़ें।"
        : "हर प्रयास सीखने का अवसर है। समीक्षा करें और फिर प्रयास करें।"
    : percentage >= 80
      ? "Excellent work—your preparation is showing."
      : percentage >= 60
        ? "Solid progress. Review the misses and build from here."
        : "Every attempt is data. Review, refocus, and try again.";
