import {
  BarChart3,
  CheckCircle2,
  Eye,
  FileClock,
  Pencil,
  Search,
  Trash2,
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
  Modal,
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
  preferredLanguage: "EN" | "HI";
  createdAt: string;
  updatedAt: string;
  _count: { attempts: number };
};
export function StudentsAdminPage() {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<Student | null>(null);
  const [deleting, setDeleting] = useState<Student | null>(null);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    status: "ACTIVE" as Student["status"],
    preferredLanguage: "EN" as Student["preferredLanguage"],
  });
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
  const save = useMutation({
    mutationFn: () => api.put(`/admin/students/${editing!.id}`, form),
    onSuccess: () => {
      toast.show("Student information updated");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
      qc.invalidateQueries({ queryKey: ["admin-student", editing?.id] });
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/students/${deleting!.id}`),
    onSuccess: () => {
      toast.show("Student account deleted");
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ["admin-students"] });
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  const startEditing = (student: Student) => {
    setEditing(student);
    setForm({
      fullName: student.fullName,
      email: student.email,
      status: student.status,
      preferredLanguage: student.preferredLanguage,
    });
  };
  return (
    <>
      <PageHeader
        eyebrow="Student management"
        title="Students"
        description="View account information, update access, and manage student records from one place."
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
                <th>Language</th>
                <th>Joined</th>
                <th className="text-right">Actions</th>
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
                  <td>{s.preferredLanguage === "HI" ? "Hindi" : "English"}</td>
                  <td>{dateLabel(s.createdAt)}</td>
                  <td>
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/admin/students/${s.id}`}
                        className="btn-secondary !px-3 !py-2"
                        aria-label={`View ${s.fullName}`}
                        title="View activity"
                      >
                        <Eye className="h-4 w-4" />
                        <span className="hidden xl:inline">View</span>
                      </Link>
                      <button
                        className="btn-secondary !px-3 !py-2"
                        onClick={() => startEditing(s)}
                        aria-label={`Edit ${s.fullName}`}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="hidden xl:inline">Edit</span>
                      </button>
                      <button
                        className={
                          s.status === "ACTIVE"
                            ? "btn-danger !px-3 !py-2"
                            : "btn-secondary !px-3 !py-2"
                        }
                        disabled={status.isPending}
                        onClick={() =>
                          status.mutate({
                            id: s.id,
                            next: s.status === "ACTIVE" ? "INACTIVE" : "ACTIVE",
                          })
                        }
                        aria-label={`${s.status === "ACTIVE" ? "Deactivate" : "Activate"} ${s.fullName}`}
                      >
                        {s.status === "ACTIVE" ? (
                          <UserX className="h-4 w-4" />
                        ) : (
                          <UserCheck className="h-4 w-4" />
                        )}
                        <span className="hidden xl:inline">
                          {s.status === "ACTIVE" ? "Deactivate" : "Activate"}
                        </span>
                      </button>
                      <button
                        className="btn-danger !px-3 !py-2"
                        disabled={s._count.attempts > 0}
                        title={
                          s._count.attempts > 0
                            ? "Students with exam activity can be deactivated but not deleted"
                            : "Delete student"
                        }
                        onClick={() => setDeleting(s)}
                        aria-label={`Delete ${s.fullName}`}
                      >
                        <Trash2 className="h-4 w-4" />
                        <span className="hidden xl:inline">Delete</span>
                      </button>
                    </div>
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
      <Modal
        open={Boolean(editing)}
        title="Edit student information"
        onClose={() => !save.isPending && setEditing(null)}
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setEditing(null)}
              disabled={save.isPending}
            >
              Cancel
            </button>
            <button
              form="student-edit-form"
              className="btn-primary"
              disabled={
                save.isPending || !form.fullName.trim() || !form.email.trim()
              }
            >
              {save.isPending ? "Saving…" : "Save changes"}
            </button>
          </>
        }
      >
        <form
          id="student-edit-form"
          className="grid gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            save.mutate();
          }}
        >
          <label>
            <span className="label">Full name</span>
            <input
              className="input"
              value={form.fullName}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  fullName: event.target.value,
                }))
              }
              autoComplete="name"
              required
            />
          </label>
          <label>
            <span className="label">Email address</span>
            <input
              className="input"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({ ...current, email: event.target.value }))
              }
              autoComplete="email"
              required
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label>
              <span className="label">Account status</span>
              <select
                className="input"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value as Student["status"],
                  }))
                }
              >
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </label>
            <label>
              <span className="label">Preferred language</span>
              <select
                className="input"
                value={form.preferredLanguage}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    preferredLanguage: event.target
                      .value as Student["preferredLanguage"],
                  }))
                }
              >
                <option value="EN">English</option>
                <option value="HI">Hindi</option>
              </select>
            </label>
          </div>
          <p className="text-xs text-[#708078]">
            Joined {editing ? dateLabel(editing.createdAt) : ""}. Use inactive
            status to immediately remove account access.
          </p>
        </form>
      </Modal>
      <Modal
        open={Boolean(deleting)}
        title="Delete student account?"
        onClose={() => !remove.isPending && setDeleting(null)}
        footer={
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={() => setDeleting(null)}
              disabled={remove.isPending}
            >
              Keep account
            </button>
            <button
              type="button"
              className="btn-danger"
              onClick={() => remove.mutate()}
              disabled={remove.isPending}
            >
              <Trash2 className="h-4 w-4" />
              {remove.isPending ? "Deleting…" : "Delete account"}
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[#52625b]">
          This permanently deletes <b>{deleting?.fullName}</b> and their login.
          This action is only available for accounts with no exam activity.
        </p>
      </Modal>
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
