import {
  Award,
  BarChart3,
  CheckCircle2,
  ClipboardCheck,
  Crosshair,
  Target,
  XCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  StatCard,
} from "../../components/ui";
import { useLanguage } from "../../contexts/LanguageContext";
import { api } from "../../lib/api";

type Performance = {
  metrics: {
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averageAccuracy: number;
    totalTests: number;
    totalQuestions: number;
    totalCorrect: number;
    totalWrong: number;
    totalUnanswered: number;
  };
  progression: {
    attempt: number;
    exam: string;
    examHi?: string | null;
    date: string;
    score: number;
    accuracy: number;
  }[];
  subjects: {
    subject: string;
    subjectHi?: string | null;
    accuracy: number;
    correct: number;
    wrong: number;
  }[];
  topics: {
    topic: string;
    topicHi?: string | null;
    accuracy: number;
    correct: number;
    wrong: number;
  }[];
  activity: { date: string; tests: number }[];
  strongAreas: { name: string; nameHi?: string | null; type: string; accuracy: number }[];
  weakAreas: { name: string; nameHi?: string | null; type: string; accuracy: number }[];
};
export function PerformancePage() {
  const { language, localize } = useLanguage();
  const bi = (english: string, hindi: string) =>
    language === "hi" ? hindi : english;
  const query = useQuery({
    queryKey: ["performance"],
    queryFn: () =>
      api.get<Performance>("/student/performance").then((r) => r.data),
  });
  if (query.isLoading)
    return (
      <Loading
        label={bi(
          "Analyzing your performance…",
          "आपके प्रदर्शन का विश्लेषण किया जा रहा है…",
        )}
      />
    );
  if (query.error) return <ErrorState error={query.error} />;
  const d = query.data!;
  if (!d.metrics.totalTests)
    return (
      <>
        <PageHeader
          eyebrow={bi("Performance", "प्रदर्शन")}
          title={bi("Your preparation, made visible", "आपकी तैयारी, स्पष्ट रूप में")}
        />
        <Empty
          title={bi("No performance data available", "प्रदर्शन डेटा उपलब्ध नहीं है")}
          description={bi(
            "Complete your first mock test to unlock score trends, subject insights, and weak-area analysis.",
            "स्कोर रुझान, विषय विश्लेषण और कमजोर क्षेत्रों की जानकारी के लिए अपना पहला मॉक टेस्ट पूरा करें।",
          )}
        />
      </>
    );
  return (
    <>
      <PageHeader
        eyebrow={bi("Performance dashboard", "प्रदर्शन डैशबोर्ड")}
        title={bi("Your preparation, made visible", "आपकी तैयारी, स्पष्ट रूप में")}
        description={bi(
          "Use the trends—not just the latest score—to decide what to study next.",
          "अगला विषय चुनने के लिए केवल नवीनतम स्कोर नहीं, पूरे रुझान को देखें।",
        )}
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label={bi("Average score", "औसत स्कोर")}
          value={`${d.metrics.averageScore}%`}
          icon={<Target />}
        />
        <StatCard
          label={bi("Highest score", "सर्वोच्च स्कोर")}
          value={`${d.metrics.highestScore}%`}
          icon={<Award />}
        />
        <StatCard
          label={bi("Lowest score", "न्यूनतम स्कोर")}
          value={`${d.metrics.lowestScore}%`}
          icon={<BarChart3 />}
        />
        <StatCard
          label={bi("Average accuracy", "औसत सटीकता")}
          value={`${d.metrics.averageAccuracy}%`}
          icon={<Crosshair />}
        />
        <StatCard
          label={bi("Total tests", "कुल टेस्ट")}
          value={d.metrics.totalTests}
          icon={<ClipboardCheck />}
        />
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="card p-5 sm:p-6">
          <div className="mb-6">
            <p className="eyebrow">{bi("Progress over time", "समय के साथ प्रगति")}</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              {bi("Score & accuracy trend", "स्कोर और सटीकता का रुझान")}
            </h2>
          </div>
          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={d.progression.map((item) => ({
                  ...item,
                  exam: localize(item.exam, item.examHi),
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
                <XAxis
                  dataKey="attempt"
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `#${v}`}
                />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ borderRadius: 14, borderColor: "#e1e3dd" }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#173f35"
                  strokeWidth={3}
                  dot={{
                    fill: "#c9ed71",
                    stroke: "#173f35",
                    strokeWidth: 2,
                    r: 5,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="accuracy"
                  stroke="#ef765f"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <p className="eyebrow">{bi("Question totals", "प्रश्नों का कुल विवरण")}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {bi("Your answer mix", "आपके उत्तरों का विवरण")}
          </h2>
          <div className="mt-7 space-y-4">
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: bi("Correct", "सही"), value: d.metrics.totalCorrect },
                      { name: bi("Wrong", "गलत"), value: d.metrics.totalWrong },
                      { name: bi("Unattempted", "अनुत्तरित"), value: d.metrics.totalUnanswered },
                    ]}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={42}
                    outerRadius={68}
                    paddingAngle={3}
                  >
                    {["#10b981", "#f43f5e", "#94a3b8"].map((color) => (
                      <Cell key={color} fill={color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            {[
              [
                BarChart3,
                bi("Total questions", "कुल प्रश्न"),
                d.metrics.totalQuestions,
                "bg-mint text-forest",
              ],
              [
                CheckCircle2,
                bi("Correct answers", "सही उत्तर"),
                d.metrics.totalCorrect,
                "bg-emerald-50 text-emerald-700",
              ],
              [
                XCircle,
                bi("Wrong answers", "गलत उत्तर"),
                d.metrics.totalWrong,
                "bg-rose-50 text-rose-700",
              ],
              [
                BarChart3,
                bi("Unattempted", "अनुत्तरित"),
                d.metrics.totalUnanswered,
                "bg-slate-100 text-slate-700",
              ],
            ].map(([Icon, label, value, color]) => {
              const I = Icon as typeof Target;
              return (
                <div
                  className="flex items-center gap-4 rounded-2xl border border-[#e8e9e3] p-4"
                  key={String(label)}
                >
                  <span
                    className={`grid h-11 w-11 place-items-center rounded-xl ${color}`}
                  >
                    <I />
                  </span>
                  <div>
                    <p className="text-xs font-bold text-[#7e8a84]">
                      {label as string}
                    </p>
                    <p className="font-display text-xl font-extrabold">
                      {value as number}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <div className="card p-5 sm:p-6">
          <p className="eyebrow">{bi("Practice cadence", "अभ्यास की निरंतरता")}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {bi("Tests attempted over time", "समय के साथ दिए गए टेस्ट")}
          </h2>
          <div className="mt-5 h-[260px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={d.activity}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="tests" fill="#c9ed71" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <p className="eyebrow">{bi("Topic insights", "टॉपिक विश्लेषण")}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {bi("Accuracy by topic", "टॉपिक के अनुसार सटीकता")}
          </h2>
          {d.topics.length ? (
            <div className="mt-5 max-h-[260px] space-y-3 overflow-y-auto pr-2">
              {d.topics.map((topic) => (
                <div key={topic.topic} className="rounded-xl bg-[#f7f8f4] p-3">
                  <div className="flex justify-between text-sm font-bold">
                    <span>{localize(topic.topic, topic.topicHi)}</span>
                    <span>{topic.accuracy}%</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-[#e1e5de]">
                    <div
                      className="h-full rounded-full bg-forest"
                      style={{ width: `${topic.accuracy}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-8 text-sm text-[#75827b]">
              {bi(
                "Topic insights appear after questions are assigned to topics.",
                "प्रश्नों को टॉपिक से जोड़ने के बाद टॉपिक विश्लेषण दिखाई देगा।",
              )}
            </p>
          )}
        </div>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-[1.3fr_.7fr]">
        <div className="card p-5 sm:p-6">
          <p className="eyebrow">{bi("Subject insights", "विषय विश्लेषण")}</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            {bi("Accuracy by subject", "विषय के अनुसार सटीकता")}
          </h2>
          <div className="mt-5 h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={d.subjects.map((item) => ({
                  ...item,
                  subject: localize(item.subject, item.subjectHi),
                }))}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
                <XAxis
                  type="number"
                  domain={[0, 100]}
                  tick={{ fontSize: 11 }}
                />
                <YAxis
                  type="category"
                  dataKey="subject"
                  width={110}
                  tick={{ fontSize: 11 }}
                />
                <Tooltip />
                <Bar
                  dataKey="accuracy"
                  fill="#173f35"
                  radius={[0, 8, 8, 0]}
                  barSize={22}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="space-y-5">
          <AreaList
            title={bi("Strong areas", "मजबूत क्षेत्र")}
            items={d.strongAreas.map((item) => ({
              ...item,
              name: localize(item.name, item.nameHi),
              type: bi(item.type === "SUBJECT" ? "Subject" : "Topic", item.type === "SUBJECT" ? "विषय" : "टॉपिक"),
            }))}
            tone="green"
            empty={bi(
              "Keep practicing to establish your strengths.",
              "अपनी मजबूतियाँ पहचानने के लिए अभ्यास जारी रखें।",
            )}
          />
          <AreaList
            title={bi("Weak areas", "कमजोर क्षेत्र")}
            items={d.weakAreas.map((item) => ({
              ...item,
              name: localize(item.name, item.nameHi),
              type: bi(item.type === "SUBJECT" ? "Subject" : "Topic", item.type === "SUBJECT" ? "विषय" : "टॉपिक"),
            }))}
            tone="red"
            empty={bi(
              "No weak areas identified—excellent balance.",
              "कोई कमजोर क्षेत्र नहीं मिला—बहुत अच्छा संतुलन।",
            )}
          />
        </div>
      </section>
    </>
  );
}
function AreaList({
  title,
  items,
  tone,
  empty,
}: {
  title: string;
  items: { name: string; type: string; accuracy: number }[];
  tone: "green" | "red";
  empty: string;
}) {
  return (
    <div className="card p-5">
      <h3 className="font-display text-lg font-extrabold">{title}</h3>
      {items.length ? (
        <div className="mt-4 space-y-3">
          {items.map((i) => (
            <div
              className="flex items-center justify-between rounded-xl bg-[#f7f8f4] p-3"
              key={`${i.type}-${i.name}`}
            >
              <span className="text-sm font-bold">
                {i.name}
                <small className="ml-2 text-[10px] uppercase text-[#89948e]">
                  {i.type}
                </small>
              </span>
              <span
                className={`rounded-lg px-2 py-1 text-xs font-extrabold ${tone === "green" ? "bg-emerald-100 text-emerald-700" : "bg-rose-100 text-rose-700"}`}
              >
                {i.accuracy}%
              </span>
            </div>
          ))}
        </div>
      ) : (
        <p className="mt-3 text-sm text-[#75827b]">{empty}</p>
      )}
    </div>
  );
}
