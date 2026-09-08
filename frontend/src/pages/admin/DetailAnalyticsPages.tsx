import {
  ArrowLeft,
  CheckCircle2,
  Clock3,
  Crosshair,
  Target,
  Trophy,
  XCircle,
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
import { Link, useParams } from "react-router-dom";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  StatCard,
} from "../../components/ui";
import { api } from "../../lib/api";
import { dateLabel, formatTime } from "../../lib/format";

type ExamAnalytics = {
  exam: { id: string; title: string };
  summary: {
    attempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averageAccuracy: number;
    averageTime: number;
  };
  overTime: {
    attempt: number;
    date: string;
    score: number;
    accuracy: number;
  }[];
  questions: {
    id: string;
    order: number;
    text: string;
    correct: number;
    wrong: number;
    unanswered: number;
    correctRate: number;
  }[];
};
export function ExamAnalyticsPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["exam-analytics", id],
    queryFn: () =>
      api
        .get<ExamAnalytics>(`/admin/exams/${id}/analytics`)
        .then((response) => response.data),
  });
  if (query.isLoading) return <Loading label="Building exam analysis…" />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!;
  return (
    <>
      <Link
        to="/admin/exams"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exams
      </Link>
      <PageHeader
        eyebrow="Exam analytics"
        title={data.exam.title}
        description="Attempt trends and question-level correct rates for this exam."
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Attempts"
          value={data.summary.attempts}
          icon={<Target />}
        />
        <StatCard
          label="Average score"
          value={`${data.summary.averageScore}%`}
          icon={<Crosshair />}
        />
        <StatCard
          label="Highest score"
          value={`${data.summary.highestScore}%`}
          icon={<Trophy />}
        />
        <StatCard
          label="Average accuracy"
          value={`${data.summary.averageAccuracy}%`}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Average time"
          value={formatTime(Math.round(data.summary.averageTime))}
          icon={<Clock3 />}
        />
      </section>
      {data.summary.attempts ? (
        <>
          <section className="card mt-6 p-6">
            <p className="eyebrow">Performance trend</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              Score and accuracy over time
            </h2>
            <div className="mt-6 h-72">
              <ResponsiveContainer>
                <LineChart data={data.overTime}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e3" />
                  <XAxis dataKey="attempt" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line dataKey="score" stroke="#173f35" strokeWidth={3} />
                  <Line dataKey="accuracy" stroke="#ef765f" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
          <section className="card mt-6 p-6">
            <p className="eyebrow">Question difficulty</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              Correct rate by question
            </h2>
            <div className="mt-6 h-[420px]">
              <ResponsiveContainer>
                <BarChart data={data.questions} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e3" />
                  <XAxis type="number" domain={[0, 100]} />
                  <YAxis
                    type="category"
                    dataKey="order"
                    width={45}
                    tickFormatter={(value) => `Q${value}`}
                  />
                  <Tooltip />
                  <Bar
                    dataKey="correctRate"
                    fill="#173f35"
                    radius={[0, 8, 8, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="table-wrap mt-5 !shadow-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Correct</th>
                    <th>Wrong</th>
                    <th>Unattempted</th>
                    <th>Correct rate</th>
                  </tr>
                </thead>
                <tbody>
                  {data.questions.map((question) => (
                    <tr key={question.id}>
                      <td className="max-w-md">
                        <b>Q{question.order}.</b>{" "}
                        <span className="line-clamp-2">{question.text}</span>
                      </td>
                      <td className="text-emerald-700">{question.correct}</td>
                      <td className="text-rose-700">{question.wrong}</td>
                      <td>{question.unanswered}</td>
                      <td>
                        <Badge
                          tone={
                            question.correctRate >= 70
                              ? "green"
                              : question.correctRate < 45
                                ? "red"
                                : "amber"
                          }
                        >
                          {question.correctRate}%
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <Empty
          title="No attempts for this exam"
          description="Question analytics will appear after the first student submission."
        />
      )}
    </>
  );
}

type StudentDetail = {
  user: {
    id: string;
    fullName: string;
    email: string;
    status: string;
    createdAt: string;
  };
  metrics: {
    attempts: number;
    averageScore: number;
    bestScore: number;
    averageAccuracy: number;
    totalCorrect: number;
    totalWrong: number;
  };
  attempts: {
    id: string;
    exam: string;
    attemptNumber: number;
    status: string;
    score: number;
    totalMarks: number;
    percentage: number;
    accuracy: number;
    timeTakenSeconds?: number;
    date: string;
  }[];
};
export function StudentDetailPage() {
  const { id } = useParams();
  const query = useQuery({
    queryKey: ["admin-student", id],
    queryFn: () =>
      api
        .get<StudentDetail>(`/admin/students/${id}`)
        .then((response) => response.data),
  });
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!;
  return (
    <>
      <Link
        to="/admin/students"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to students
      </Link>
      <PageHeader
        eyebrow="Student performance"
        title={data.user.fullName}
        description={`${data.user.email} · Joined ${dateLabel(data.user.createdAt)}`}
        action={
          <Badge tone={data.user.status === "ACTIVE" ? "green" : "red"}>
            {data.user.status}
          </Badge>
        }
      />
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        <StatCard
          label="Tests"
          value={data.metrics.attempts}
          icon={<Target />}
        />
        <StatCard
          label="Average score"
          value={`${data.metrics.averageScore}%`}
          icon={<Crosshair />}
        />
        <StatCard
          label="Best score"
          value={`${data.metrics.bestScore}%`}
          icon={<Trophy />}
        />
        <StatCard
          label="Accuracy"
          value={`${data.metrics.averageAccuracy}%`}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Correct"
          value={data.metrics.totalCorrect}
          icon={<CheckCircle2 />}
        />
        <StatCard
          label="Wrong"
          value={data.metrics.totalWrong}
          icon={<XCircle />}
        />
      </section>
      <section className="mt-6">
        <h2 className="mb-4 font-display text-xl font-extrabold">
          Test history
        </h2>
        {data.attempts.length ? (
          <div className="table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Attempt</th>
                  <th>Status</th>
                  <th>Score</th>
                  <th>Percentage</th>
                  <th>Accuracy</th>
                  <th>Time</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {data.attempts.map((attempt) => (
                  <tr key={attempt.id}>
                    <td className="font-bold">{attempt.exam}</td>
                    <td>#{attempt.attemptNumber}</td>
                    <td>
                      <Badge
                        tone={
                          attempt.status === "IN_PROGRESS" ? "amber" : "green"
                        }
                      >
                        {attempt.status}
                      </Badge>
                    </td>
                    <td>
                      {attempt.score ?? "—"} / {attempt.totalMarks ?? "—"}
                    </td>
                    <td>{attempt.percentage ?? 0}%</td>
                    <td>{attempt.accuracy ?? 0}%</td>
                    <td>
                      {attempt.timeTakenSeconds
                        ? formatTime(attempt.timeTakenSeconds)
                        : "—"}
                    </td>
                    <td>{dateLabel(attempt.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty
            title="No test history"
            description="This student has not started an exam."
          />
        )}
      </section>
    </>
  );
}
