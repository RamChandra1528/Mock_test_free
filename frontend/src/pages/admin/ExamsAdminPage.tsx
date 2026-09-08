import {
  Copy,
  BarChart3,
  Eye,
  FileQuestion,
  Layers3,
  Pencil,
  Plus,
  Search,
  Send,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
  Pagination,
} from "../../components/ui";
import { api } from "../../lib/api";
import { useToast } from "../../contexts/ToastContext";
import { dateLabel } from "../../lib/format";

type Exam = {
  id: string;
  title: string;
  description?: string;
  status: "DRAFT" | "PUBLISHED";
  showResultImmediately?: boolean;
  difficulty: string;
  durationMinutes: number;
  totalMarks: number;
  createdAt: string;
  category: { name: string };
  _count: { questions: number; attempts: number };
};
export function ExamsAdminPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [remove, setRemove] = useState<Exam | null>(null);
  const [declare, setDeclare] = useState<Exam | null>(null);
  const [page, setPage] = useState(1);
  const qc = useQueryClient();
  const toast = useToast();
  const query = useQuery({
    queryKey: ["admin-exams", search, status, page],
    queryFn: () =>
      api
        .get<{ items: Exam[]; pages: number }>("/admin/exams", {
          params: {
            search: search || undefined,
            status: status || undefined,
            page,
          },
        })
        .then((r) => r.data),
  });
  const action = useMutation({
    mutationFn: ({
      path,
      method = "post",
    }: {
      path: string;
      method?: "post" | "delete";
    }) => api[method](path),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
      setRemove(null);
      toast.show("Exam updated successfully");
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  const release = useMutation({
    mutationFn: (examId: string) => api.post(`/admin/exams/${examId}/declare-result`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-exams"] });
      qc.invalidateQueries({ queryKey: ["admin-exam"] });
      setDeclare(null);
      toast.show("Result declared. Students can now view their scores.");
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  return (
    <>
      <PageHeader
        eyebrow="Exam management"
        title="Build and publish mock tests"
        description="Create exams, manage their questions, preview the student experience, and control publishing."
        action={
          <Link className="btn-primary" to="/admin/exams/create">
            <Plus className="h-4 w-4" />
            Create exam
          </Link>
        }
      />
      <div className="card mb-5 flex flex-col gap-3 p-4 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search exams</span>
          <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#819088]" />
          <input
            className="input pl-10"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            placeholder="Search exams…"
          />
        </label>
        <select
          className="input sm:w-48"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          aria-label="Filter status"
        >
          <option value="">All statuses</option>
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Published</option>
        </select>
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
                <th>Exam</th>
                <th>Status</th>
                <th>Result</th>
                <th>Questions</th>
                <th>Attempts</th>
                <th>Duration</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {query.data.items.map((exam) => (
                <tr key={exam.id}>
                  <td>
                    <p className="font-extrabold">{exam.title}</p>
                    <p className="mt-1 text-xs text-[#7a8780]">
                      {exam.category.name} · {exam.difficulty}
                    </p>
                  </td>
                  <td>
                    <Badge
                      tone={exam.status === "PUBLISHED" ? "green" : "amber"}
                    >
                      {exam.status}
                    </Badge>
                  </td>
                  <td>
                    {(exam.showResultImmediately ?? true) ? (
                      <Badge tone="green">Results available</Badge>
                    ) : (
                      <div className="space-y-2">
                        <Badge tone="amber">Awaiting declaration</Badge>
                        {exam.status !== "DRAFT" && (
                          <button className="btn-primary whitespace-nowrap !px-3 !py-2"
                            disabled={release.isPending || !exam._count.attempts}
                            onClick={() => setDeclare(exam)}>
                            Declare Result
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                  <td>{exam._count.questions}</td>
                  <td>{exam._count.attempts}</td>
                  <td>{exam.durationMinutes} min</td>
                  <td className="whitespace-nowrap text-[#6d7973]">
                    {dateLabel(exam.createdAt)}
                  </td>
                  <td>
                    <div className="flex items-center gap-1">
                      <Link
                        title="Edit"
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        to={`/admin/exams/${exam.id}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <Link
                        title="Questions"
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        to={`/admin/exams/${exam.id}/questions`}
                      >
                        <FileQuestion className="h-4 w-4" />
                      </Link>
                      <Link
                        title="Sections"
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        to={`/admin/exams/${exam.id}/sections`}
                      >
                        <Layers3 className="h-4 w-4" />
                      </Link>
                      <Link
                        title="Preview"
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        to={`/admin/exams/${exam.id}/preview`}
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        title="Analytics"
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        to={`/admin/exams/${exam.id}/analytics`}
                      >
                        <BarChart3 className="h-4 w-4" />
                      </Link>
                      <button
                        title="Duplicate"
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        onClick={() =>
                          action.mutate({
                            path: `/admin/exams/${exam.id}/duplicate`,
                          })
                        }
                      >
                        <Copy className="h-4 w-4" />
                      </button>
                      <button
                        title={
                          exam.status === "PUBLISHED" ? "Unpublish" : "Publish"
                        }
                        className="rounded-lg p-2 hover:bg-[#eef1ec]"
                        onClick={() =>
                          action.mutate({
                            path: `/admin/exams/${exam.id}/${exam.status === "PUBLISHED" ? "unpublish" : "publish"}`,
                          })
                        }
                      >
                        <Send
                          className={`h-4 w-4 ${exam.status === "PUBLISHED" ? "text-emerald-600" : ""}`}
                        />
                      </button>
                      <button
                        title="Delete"
                        className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                        onClick={() => setRemove(exam)}
                      >
                        <Trash2 className="h-4 w-4" />
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
          title="No exams found"
          description="Create your first exam or adjust the active filters."
          action={
            <Link className="btn-primary" to="/admin/exams/create">
              <Plus className="h-4 w-4" />
              Create exam
            </Link>
          }
        />
      )}
      <Modal
        open={!!remove}
        title="Delete this exam?"
        onClose={() => setRemove(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setRemove(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              disabled={action.isPending}
              onClick={() =>
                action.mutate({
                  path: `/admin/exams/${remove!.id}`,
                  method: "delete",
                })
              }
            >
              <Trash2 className="h-4 w-4" />
              Delete exam
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[#64726b]">
          This permanently removes <b>{remove?.title}</b> and its questions.
          Exams with student attempts are protected and cannot be deleted.
        </p>
      </Modal>
      <Modal open={!!declare} title="Declare result?" onClose={() => !release.isPending && setDeclare(null)}
        footer={<>
          <button className="btn-secondary" disabled={release.isPending} onClick={() => setDeclare(null)}>Cancel</button>
          <button className="btn-primary" disabled={release.isPending}
            onClick={() => declare && release.mutate(declare.id)}>
            {release.isPending ? "Declaring…" : "Declare Result"}
          </button>
        </>}>
        <p className="text-sm leading-6 text-[#64726b]">
          Release scores for <b>{declare?.title}</b> to all students who submitted this exam.
          Future submissions will also show results immediately. Answer review follows the exam's review setting.
        </p>
      </Modal>
    </>
  );
}
