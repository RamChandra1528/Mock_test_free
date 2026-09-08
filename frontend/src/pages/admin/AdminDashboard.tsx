import {
  BookOpenCheck,
  ClipboardCheck,
  FileQuestion,
  FileText,
  Plus,
  Send,
  Upload,
  Users,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Link } from "react-router-dom";
import { ErrorState, Loading, PageHeader, StatCard } from "../../components/ui";
import { api } from "../../lib/api";
import { dateLabel } from "../../lib/format";

type Dashboard = {
  stats: {
    students: number;
    exams: number;
    questions: number;
    attempts: number;
    published: number;
    drafts: number;
  };
  recentAttempts: {
    id: string;
    student: string;
    exam: string;
    score: number;
    submittedAt: string;
  }[];
  popularExams: { name: string; attempts: number }[];
  attemptsOverTime: { date: string; count: number }[];
  averageScoreByExam: { name: string; score: number }[];
  studentPerformance: { name: string; score: number }[];
  questionAccuracy: { name: string; question: string; accuracy: number }[];
};
export function AdminDashboard() {
  const query = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: () => api.get<Dashboard>("/admin/dashboard").then((r) => r.data),
  });
  if (query.isLoading) return <Loading label="Loading admin overview…" />;
  if (query.error) return <ErrorState error={query.error} />;
  const d = query.data!;
  return (
    <>
      <PageHeader
        eyebrow="Administration"
        title="Platform overview"
        description="A live view of your exams, students, and recent testing activity."
        action={
          <div className="flex gap-2">
            <Link className="btn-secondary" to="/admin/import">
              <Upload className="h-4 w-4" />
              Import paper
            </Link>
            <Link className="btn-primary" to="/admin/exams/create">
              <Plus className="h-4 w-4" />
              Create exam
            </Link>
          </div>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard label="Students" value={d.stats.students} icon={<Users />} />
        <StatCard
          label="Exams"
          value={d.stats.exams}
          icon={<BookOpenCheck />}
        />
        <StatCard
          label="Questions"
          value={d.stats.questions}
          icon={<FileQuestion />}
        />
        <StatCard
          label="Attempts"
          value={d.stats.attempts}
          icon={<ClipboardCheck />}
        />
        <StatCard label="Published" value={d.stats.published} icon={<Send />} />
        <StatCard label="Drafts" value={d.stats.drafts} icon={<FileText />} />
      </section>
      <section className="mt-6 grid gap-5 xl:grid-cols-[.9fr_1.1fr]">
        <div className="card p-5 sm:p-6">
          <p className="eyebrow">Engagement</p>
          <h2 className="mt-1 font-display text-xl font-extrabold">
            Most attempted exams
          </h2>
          <div className="mt-5 h-[300px]">
            {d.popularExams.length ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={d.popularExams}
                  layout="vertical"
                  margin={{ left: 15 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={130}
                    tick={{ fontSize: 10 }}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="attempts"
                    fill="#173f35"
                    radius={[0, 8, 8, 0]}
                    barSize={22}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="grid h-full place-items-center text-sm text-[#7b8881]">
                Attempts will appear here.
              </div>
            )}
          </div>
        </div>
        <div className="card p-5 sm:p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="eyebrow">Latest activity</p>
              <h2 className="mt-1 font-display text-xl font-extrabold">
                Recent submissions
              </h2>
            </div>
            <Link
              className="text-xs font-extrabold text-forest"
              to="/admin/attempts"
            >
              View all →
            </Link>
          </div>
          <div className="mt-5 divide-y divide-[#ecece6]">
            {d.recentAttempts.length ? (
              d.recentAttempts.map((a) => (
                <div className="flex items-center gap-3 py-3" key={a.id}>
                  <div className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-sm font-extrabold text-forest">
                    {a.student.charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-extrabold">
                      {a.student}
                    </p>
                    <p className="truncate text-xs text-[#7a8780]">
                      {a.exam} · {dateLabel(a.submittedAt)}
                    </p>
                  </div>
                  <b className="rounded-lg bg-[#f0f2ee] px-2.5 py-1 text-sm">
                    {Number(a.score)}
                  </b>
                </div>
              ))
            ) : (
              <p className="py-20 text-center text-sm text-[#7b8881]">
                No submissions yet.
              </p>
            )}
          </div>
        </div>
      </section>
      <section className="mt-5 grid gap-5 xl:grid-cols-2">
        <AnalyticsCard
          eyebrow="Activity"
          title="Attempts over the last 30 days"
        >
          <LineChart data={d.attemptsOverTime}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
            <XAxis dataKey="date" tick={{ fontSize: 10 }} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#173f35"
              strokeWidth={3}
              dot={{ fill: "#c9ed71", stroke: "#173f35" }}
            />
          </LineChart>
        </AnalyticsCard>
        <AnalyticsCard eyebrow="Outcomes" title="Average score by exam">
          <BarChart
            data={d.averageScoreByExam}
            layout="vertical"
            margin={{ left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Bar dataKey="score" fill="#173f35" radius={[0, 8, 8, 0]} />
          </BarChart>
        </AnalyticsCard>
        <AnalyticsCard eyebrow="Learners" title="Student performance">
          <BarChart
            data={d.studentPerformance}
            layout="vertical"
            margin={{ left: 20 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis
              type="category"
              dataKey="name"
              width={130}
              tick={{ fontSize: 10 }}
            />
            <Tooltip />
            <Bar dataKey="score" fill="#c9ed71" radius={[0, 8, 8, 0]} />
          </BarChart>
        </AnalyticsCard>
        <AnalyticsCard
          eyebrow="Content quality"
          title="Lowest question accuracy"
        >
          <BarChart data={d.questionAccuracy}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8e9e3" />
            <XAxis dataKey="name" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
            <Bar dataKey="accuracy" fill="#ef765f" radius={[8, 8, 0, 0]} />
          </BarChart>
        </AnalyticsCard>
      </section>
    </>
  );
}

function AnalyticsCard({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: React.ReactElement;
}) {
  return (
    <div className="card p-5 sm:p-6">
      <p className="eyebrow">{eyebrow}</p>
      <h2 className="mt-1 font-display text-xl font-extrabold">{title}</h2>
      <div className="mt-5 h-[290px]">
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
