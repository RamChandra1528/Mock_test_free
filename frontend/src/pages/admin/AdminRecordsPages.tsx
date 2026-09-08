import {
  BarChart3,
  CheckCircle2,
  FileClock,
  Search,
  UserCheck,
  UserX,
  Users,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  PageHeader,
  Pagination,
} from "../../components/ui";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";
import { dateLabel, formatTime } from "../../lib/format";

type Student = {
  id: string;
  fullName: string;
  email: string;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  _count: { attempts: number };
};
export function StudentsAdminPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: ["admin-students", search, page],
    queryFn: () =>
      api
        .get<{ items: Student[]; pages: number }>("/admin/students", {
          params: { search: search || undefined, page },
        })
        .then((r) => r.data),
  });
  const status = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      api.patch(`/admin/students/${id}/status/${next}`),
    onSuccess: () => {
      toast.show("Student status updated");
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  return (
    <>
      <PageHeader
        eyebrow="Student management"
        title="Students"
        description="Search student accounts, review activity volume, and control access."
      />
      <div className="card mb-5 p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#819088]" />
          <input
            className="input pl-10"
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
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
                <th>Student</th>
                <th>Status</th>
                <th>Attempts</th>
                <th>Joined</th>
                <th>Access</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((s) => (
                <tr key={s.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint font-extrabold text-forest">
                        {s.fullName.charAt(0)}
                      </span>
                      <div>
                        <Link
                          to={`/admin/students/${s.id}`}
                          className="font-extrabold text-forest hover:underline"
                        >
                          {s.fullName}
                        </Link>
                        <p className="text-xs text-[#7a8780]">{s.email}</p>
                      </div>
                    </div>
                  </td>
                  <td>
                    <Badge tone={s.status === "ACTIVE" ? "green" : "red"}>
                      {s.status}
                    </Badge>
                  </td>
                  <td>{s._count.attempts}</td>
                  <td>{dateLabel(s.createdAt)}</td>
                  <td>
                    <button
                      className={
                        s.status === "ACTIVE"
                          ? "btn-danger !px-3 !py-2"
                          : "btn-secondary !px-3 !py-2"
                      }
                      onClick={() =>
                        status.mutate({
                          id: s.id,
                          next: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                        })
                      }
                    >
                      {s.status === "ACTIVE" ? (
                        <>
                          <UserX className="h-4 w-4" />
                          Deactivate
                        </>
                      ) : (
                        <>
                          <UserCheck className="h-4 w-4" />
                          Activate
                        </>
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={query.data.pages} onChange={setPage} />
        </div>
      ) : (
        <Empty
          title="No students found"
          description="Registered student accounts will appear here."
        />
      )}
    </>
  );
}

type Attempt = {
  id: string;
  attemptNumber: number;
  status: string;
  score?: number;
  totalMarks?: number;
  accuracy?: number;
  timeTakenSeconds?: number;
  createdAt: string;
  submittedAt?: string;
  user: { fullName: string; email: string };
  exam: { title: string };
};
export function AttemptsAdminPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["admin-attempts", search, page],
    queryFn: () =>
      api
        .get<{ items: Attempt[]; pages: number }>("/admin/attempts", {
          params: { search: search || undefined, page },
        })
        .then((r) => r.data),
  });
  return (
    <>
      <PageHeader
        eyebrow="Exam activity"
        title="Student attempts"
        description="Monitor in-progress and submitted attempts across all published exams."
      />
      <div className="card mb-5 p-4">
        <label className="relative block">
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#819088]" />
          <input
            className="input pl-10"
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
            placeholder="Search student, email, or exam…"
          />
        </label>
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
                <th>Student</th>
                <th>Exam</th>
                <th>Attempt</th>
                <th>Status</th>
                <th>Score</th>
                <th>Accuracy</th>
                <th>Time</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((a) => (
                <tr key={a.id}>
                  <td>
                    <p className="font-extrabold">{a.user.fullName}</p>
                    <p className="text-xs text-[#7b8781]">{a.user.email}</p>
                  </td>
                  <td className="max-w-[240px] font-bold">{a.exam.title}</td>
                  <td>#{a.attemptNumber}</td>
                  <td>
                    <Badge
                      tone={
                        a.status === "SUBMITTED"
                          ? "green"
                          : a.status === "IN_PROGRESS"
                            ? "amber"
                            : "red"
                      }
                    >
                      {a.status}
                    </Badge>
                  </td>
                  <td>
                    {a.score != null
                      ? `${Number(a.score)} / ${Number(a.totalMarks)}`
                      : "—"}
                  </td>
                  <td>{a.accuracy != null ? `${Number(a.accuracy)}%` : "—"}</td>
                  <td>
                    {a.timeTakenSeconds != null
                      ? formatTime(a.timeTakenSeconds)
                      : "—"}
                  </td>
                  <td className="whitespace-nowrap">
                    {dateLabel(a.submittedAt ?? a.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} pages={query.data.pages} onChange={setPage} />
        </div>
      ) : (
        <Empty
          title="No attempts yet"
          description="Attempt records will appear when students start taking tests."
        />
      )}
    </>
  );
}

type Analytics = {
  exams: {
    name: string;
    attempts: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    averageAccuracy: number;
    averageTime: number;
  }[];
  questions: {
    id: string;
    question: string;
    exam: string;
    order: number;
    difficulty: string;
    correct: number;
    attempted: number;
    correctRate: number;
  }[];
};
export function AdminAnalyticsPage() {
  const query = useQuery({
    queryKey: ["admin-analytics"],
    queryFn: () => api.get<Analytics>("/admin/analytics").then((r) => r.data),
  });
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} />;
  const data = query.data!.exams;
  return (
    <>
      <PageHeader
        eyebrow="Analytics"
        title="Exam performance"
        description="Compare participation, scores, accuracy, and completion time across your exams."
      />
      {data.length ? (
        <>
          <div className="card p-5 sm:p-7">
            <p className="eyebrow">Comparative view</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              Average score by exam
            </h2>
            <div className="mt-6 h-[360px]">
              <ResponsiveContainer>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e7e9e3" />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} interval={0} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar
                    dataKey="averageScore"
                    fill="#173f35"
                    radius={[8, 8, 0, 0]}
                  />
                  <Bar
                    dataKey="averageAccuracy"
                    fill="#c9ed71"
                    radius={[8, 8, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="table-wrap mt-5">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Exam</th>
                  <th>Attempts</th>
                  <th>Average score</th>
                  <th>Highest</th>
                  <th>Lowest</th>
                  <th>Avg. accuracy</th>
                  <th>Avg. time</th>
                </tr>
              </thead>
              <tbody>
                {data.map((x) => (
                  <tr key={x.name}>
                    <td className="font-extrabold">{x.name}</td>
                    <td>{x.attempts}</td>
                    <td>{x.averageScore}%</td>
                    <td className="text-emerald-700">{x.highestScore}%</td>
                    <td className="text-rose-700">{x.lowestScore}%</td>
                    <td>{x.averageAccuracy}%</td>
                    <td>{formatTime(Math.round(x.averageTime))}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="card mt-5 p-5 sm:p-7">
            <p className="eyebrow">Question analysis</p>
            <h2 className="mt-1 font-display text-xl font-extrabold">
              Lowest correct-rate questions
            </h2>
            <div className="table-wrap mt-5 !shadow-none">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Question</th>
                    <th>Exam</th>
                    <th>Configured difficulty</th>
                    <th>Attempts</th>
                    <th>Correct rate</th>
                  </tr>
                </thead>
                <tbody>
                  {query.data!.questions.map((question) => (
                    <tr key={question.id}>
                      <td className="max-w-lg">
                        <b>Q{question.order}.</b> {question.question}
                      </td>
                      <td>{question.exam}</td>
                      <td>
                        <Badge
                          tone={
                            question.difficulty === "HARD"
                              ? "red"
                              : question.difficulty === "EASY"
                                ? "green"
                                : "amber"
                          }
                        >
                          {question.difficulty}
                        </Badge>
                      </td>
                      <td>{question.attempted}</td>
                      <td>
                        <Badge
                          tone={
                            question.correctRate < 45
                              ? "red"
                              : question.correctRate < 70
                                ? "amber"
                                : "green"
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
          </div>
        </>
      ) : (
        <Empty
          title="No analytics available"
          description="Analytics will populate as students submit exams."
        />
      )}
    </>
  );
}
