import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Download,
  FileSearch,
  FileSpreadsheet,
  FileText,
  FileUp,
  LoaderCircle,
  Save,
  Sparkles,
  Trash2,
  UploadCloud,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from "react-router-dom";
import { LanguageToggle } from "../../components/LanguageToggle";
import { Badge, ErrorState, Loading, PageHeader } from "../../components/ui";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";

type ImportedQuestion = {
  id: string;
  order: number;
  text: string;
  textHi?: string;
  optionA?: string;
  optionAHi?: string;
  optionB?: string;
  optionBHi?: string;
  optionC?: string;
  optionCHi?: string;
  optionD?: string;
  optionDHi?: string;
  correctAnswer?: string;
  explanation?: string;
  explanationHi?: string;
  subjectName?: string;
  subjectNameHi?: string;
  topicName?: string;
  topicNameHi?: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  warnings?: string[];
  status: string;
  duplicateOfId?: string;
  duplicateAction: "KEEP" | "REPLACE" | "SKIP";
};
type Import = {
  id: string;
  fileName: string;
  status: string;
  detectedCount: number;
  warningCount: number;
  importedQuestions: ImportedQuestion[];
};
export function ImportPage() {
  const [file, setFile] = useState<File | null>(null);
  const [drag, setDrag] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const toast = useToast();
  const upload = useMutation({
    mutationFn: async () => {
      const body = new FormData();
      body.append("file", file!);
      return api
        .post<Import>("/admin/import", body, {
          headers: { "Content-Type": "multipart/form-data" },
          timeout: 120_000,
        })
        .then((r) => r.data);
    },
    onSuccess: (data) => {
      toast.show(`${data.detectedCount} questions detected`);
      navigate(`/admin/import/${data.id}/review`);
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  const accept = (next?: File) => {
    if (!next) return;
    if (next.size > 150 * 1024 * 1024)
      return toast.show("File must be smaller than 150 MB", "error");
    setFile(next);
  };
  return (
    <>
      <PageHeader
        eyebrow="Paper import"
        title="Turn a paper into a mock test"
        description="Upload a supported file, review every detected question, then add the approved questions to a draft exam."
        action={
          <a
            className="btn-secondary"
            href={`${api.defaults.baseURL}/admin/import/template`}
            onClick={(e) => {
              e.preventDefault();
              api
                .get("/admin/import/template", { responseType: "blob" })
                .then((r) => {
                  const url = URL.createObjectURL(r.data);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "mockmaster-import-template.csv";
                  a.click();
                  URL.revokeObjectURL(url);
                });
            }}
          >
            <Download className="h-4 w-4" />
            Sample CSV
          </a>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="card p-5 sm:p-8">
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDrag(true);
            }}
            onDragLeave={() => setDrag(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDrag(false);
              accept(e.dataTransfer.files[0]);
            }}
            onClick={() => !upload.isPending && input.current?.click()}
            className={`grid min-h-[360px] cursor-pointer place-items-center rounded-2xl border-2 border-dashed p-8 text-center transition ${drag ? "border-forest bg-mint/60" : file ? "border-emerald-400 bg-emerald-50/60" : "border-[#ccd3cc] bg-[#fafbf8] hover:border-forest hover:bg-mint/30"}`}
          >
            <input
              ref={input}
              type="file"
              className="hidden"
              accept=".pdf,.docx,.xlsx,.csv,.json"
              onChange={(e) => accept(e.target.files?.[0])}
            />
            <div>
              {file ? (
                <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
              ) : (
                <UploadCloud className="mx-auto h-14 w-14 text-forest" />
              )}
              <h2 className="mt-5 font-display text-xl font-extrabold">
                {file ? file.name : "Drop your question paper here"}
              </h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#6f7c75]">
                {file
                  ? `${(file.size / 1024 / 1024).toFixed(2)} MB · Ready to analyze`
                  : "or click to browse. The file remains in review until you explicitly confirm it."}
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {["PDF", "DOCX", "XLSX", "CSV", "JSON"].map((x) => (
                  <Badge key={x}>{x}</Badge>
                ))}
              </div>
            </div>
          </div>
          {file && (
            <div className="mt-5 flex flex-col justify-end gap-3 sm:flex-row">
              <button className="btn-secondary" onClick={() => setFile(null)}>
                Choose another file
              </button>
              <button
                className="btn-primary"
                disabled={upload.isPending}
                onClick={() => upload.mutate()}
              >
                {upload.isPending ? (
                  <>
                    <LoaderCircle className="h-4 w-4 animate-spin" />
                    Analyzing paper…
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4" />
                    Extract questions
                  </>
                )}
              </button>
            </div>
          )}
        </section>
        <aside className="space-y-4">
          <div className="card p-5">
            <p className="eyebrow">What happens next</p>
            <ol className="mt-5 space-y-4">
              {[
                "Upload file",
                "Extract questions & options",
                "Flag uncertain fields",
                "Review and correct",
                "Add to a draft exam",
              ].map((s, i) => (
                <li
                  className="flex items-center gap-3 text-sm font-bold"
                  key={s}
                >
                  <span className="grid h-8 w-8 place-items-center rounded-lg bg-mint text-xs font-extrabold text-forest">
                    {i + 1}
                  </span>
                  {s}
                </li>
              ))}
            </ol>
          </div>
          <div className="rounded-2xl bg-forest p-5 text-white">
            <FileSearch className="h-7 w-7 text-lime" />
            <h3 className="mt-4 font-display font-extrabold">
              Review is mandatory
            </h3>
            <p className="mt-2 text-xs leading-5 text-white/60">
              MockMaster never publishes imported questions automatically.
              Warnings and possible duplicates remain visible to the reviewer.
            </p>
          </div>
        </aside>
      </div>
    </>
  );
}

export function ImportReviewPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const toast = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const { localize } = useLanguage();
  const [examId, setExamId] = useState(params.get("examId") ?? "");
  const query = useQuery({
    queryKey: ["import-review", id],
    queryFn: () =>
      api.get<Import>(`/admin/import/${id}/preview`).then((r) => r.data),
  });
  const exams = useQuery({
    queryKey: ["draft-exams"],
    queryFn: () =>
      api
        .get<{ items: { id: string; title: string; titleHi?: string | null }[] }>("/admin/exams", {
          params: { status: "DRAFT", limit: 100 },
        })
        .then((r) => r.data.items),
  });
  const subjects = useQuery({
    queryKey: ["admin-subjects"],
    queryFn: () =>
      api
        .get<{ id: string; name: string; nameHi?: string | null }[]>("/admin/subjects")
        .then((response) => response.data),
  });
  const update = useMutation({
    mutationFn: ({
      qid,
      data,
    }: {
      qid: string;
      data: Partial<ImportedQuestion>;
    }) => api.put(`/admin/import/${id}/questions/${qid}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["import-review", id] });
      toast.show("Imported question saved");
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  const remove = useMutation({
    mutationFn: (qid: string) =>
      api.delete(`/admin/import/${id}/questions/${qid}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["import-review", id] }),
  });
  const confirm = useMutation({
    mutationFn: () =>
      api.post(`/admin/import/${id}/confirm`, { examId }).then((r) => r.data),
    onSuccess: () => {
      toast.show("Questions added to the exam");
      navigate(`/admin/exams/${examId}/questions`);
    },
    onError: (e) => toast.show(e.message, "error"),
  });
  if (query.isLoading || exams.isLoading || subjects.isLoading)
    return <Loading label="Loading extracted questions…" />;
  if (query.error || exams.error || subjects.error)
    return <ErrorState error={query.error ?? exams.error ?? subjects.error} />;
  const data = query.data!;
  return (
    <>
      <Link
        to="/admin/import"
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to import
      </Link>
      <div className="mb-4 flex justify-end">
        <LanguageToggle />
      </div>
      <PageHeader
        eyebrow="Import review"
        title="Review imported questions"
        description={`${data.detectedCount} questions detected · ${data.warningCount} need attention · Source: ${data.fileName}`}
        action={
          <div className="flex items-center gap-2">
            <select
              className="input min-w-56"
              value={examId}
              onChange={(e) => setExamId(e.target.value)}
            >
              <option value="">Select target draft exam</option>
              {exams.data!.map((e) => (
                <option value={e.id} key={e.id}>
                  {localize(e.title, e.titleHi)}
                </option>
              ))}
            </select>
            <Link
              className="btn-secondary whitespace-nowrap"
              to={`/admin/exams/create?returnTo=${encodeURIComponent(`/admin/import/${id}/review`)}`}
            >
              Create exam
            </Link>
            <button
              className="btn-primary whitespace-nowrap"
              disabled={!examId || confirm.isPending}
              onClick={() => confirm.mutate()}
            >
              {confirm.isPending ? (
                "Adding…"
              ) : (
                <>
                  Add approved questions
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </div>
        }
      />
      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <ImportMetric
          label="Questions detected"
          value={data.importedQuestions.length}
        />
        <ImportMetric
          label="Parsed successfully"
          value={
            data.importedQuestions.filter(
              (question) =>
                !question.warnings?.length && question.status !== "SKIPPED",
            ).length
          }
        />
        <ImportMetric
          label="Need review"
          value={
            data.importedQuestions.filter(
              (question) =>
                question.warnings?.length && question.status !== "SKIPPED",
            ).length
          }
        />
      </div>
      <div className="space-y-4">
        {data.importedQuestions.map((q) => (
          <ImportedQuestionCard
            key={q.id}
            question={q}
            subjects={subjects.data!}
            saving={update.isPending}
            onSave={(values) => update.mutate({ qid: q.id, data: values })}
            onDelete={() => remove.mutate(q.id)}
          />
        ))}
      </div>
      {!data.importedQuestions.length && (
        <div className="card grid min-h-64 place-items-center text-center">
          <div>
            <FileText className="mx-auto text-[#89948e]" />
            <p className="mt-3 font-display font-extrabold">
              No questions imported
            </p>
          </div>
        </div>
      )}
    </>
  );
}

function ImportedQuestionCard({
  question: initial,
  saving,
  onSave,
  onDelete,
  subjects,
}: {
  question: ImportedQuestion;
  saving: boolean;
  onSave: (q: ImportedQuestion) => void;
  onDelete: () => void;
  subjects: { id: string; name: string; nameHi?: string | null }[];
}) {
  const [q, setQ] = useState(initial);
  useEffect(() => setQ(initial), [initial]);
  return (
    <article className="card overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e7e9e3] bg-[#fafbf8] px-5 py-3">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-forest text-xs font-extrabold text-white">
            {q.order}
          </span>
          <b className="text-sm">Question {q.order}</b>
          {q.status === "SKIPPED" ? (
            <Badge>Skipped</Badge>
          ) : (q.warnings?.length ?? 0) > 0 ? (
            <Badge tone="amber">Needs review</Badge>
          ) : (
            <Badge tone="green">Ready</Badge>
          )}
        </div>
        <div className="flex gap-2">
          <button
            className="btn-secondary !px-3 !py-2"
            disabled={saving}
            onClick={() => onSave({ ...q, status: "SKIPPED" })}
          >
            Skip
          </button>
          <button className="btn-danger !px-3 !py-2" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
            Delete
          </button>
          <button
            className="btn-primary !px-3 !py-2"
            disabled={saving}
            onClick={() => onSave(q)}
          >
            <Save className="h-4 w-4" />
            Save
          </button>
        </div>
      </div>
      {q.warnings?.length ? (
        <div className="flex flex-wrap gap-2 border-b border-amber-100 bg-amber-50 px-5 py-3">
          {q.warnings.map((w) => (
            <span
              className="flex items-center gap-1 text-xs font-bold text-amber-800"
              key={w}
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {w}
            </span>
          ))}
        </div>
      ) : null}
      {q.duplicateOfId && (
        <div className="border-b border-violet-100 bg-violet-50 px-5 py-3">
          <label className="flex flex-wrap items-center gap-3 text-sm font-bold text-violet-900">
            <span>Duplicate decision</span>
            <select
              className="rounded-lg border border-violet-200 bg-white px-3 py-2 text-xs"
              value={q.duplicateAction ?? "KEEP"}
              onChange={(event) =>
                setQ({
                  ...q,
                  duplicateAction: event.target
                    .value as ImportedQuestion["duplicateAction"],
                })
              }
            >
              <option value="KEEP">Keep as a new question</option>
              <option value="REPLACE">Replace existing question</option>
              <option value="SKIP">Skip this question</option>
            </select>
          </label>
        </div>
      )}
      <div className="grid gap-5 p-5 lg:grid-cols-[1fr_290px]">
        <div>
          <label>
            <span className="label">Question (English)</span>
            <textarea
              className="input min-h-24"
              value={q.text}
              onChange={(e) => setQ({ ...q, text: e.target.value })}
            />
          </label>
          <label className="mt-3 block">
            <span className="label">प्रश्न (हिन्दी)</span>
            <textarea
              className="input min-h-24"
              lang="hi"
              value={q.textHi ?? ""}
              onChange={(e) => setQ({ ...q, textHi: e.target.value })}
              placeholder="Optional Hindi translation"
            />
          </label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {(["A", "B", "C", "D"] as const).map((label) => {
              const key = `option${label}` as
                | "optionA"
                | "optionB"
                | "optionC"
                | "optionD";
              const keyHi = `option${label}Hi` as
                | "optionAHi"
                | "optionBHi"
                | "optionCHi"
                | "optionDHi";
              return (
                <div className="space-y-2" key={label}>
                  <label>
                    <span className="label">Option {label} (English)</span>
                    <input
                      className={`input ${q.correctAnswer === label ? "!border-emerald-500 !bg-emerald-50" : ""}`}
                      value={q[key] ?? ""}
                      onChange={(e) => setQ({ ...q, [key]: e.target.value })}
                    />
                  </label>
                  <label>
                    <span className="label">विकल्प {label} (हिन्दी)</span>
                    <input
                      className="input"
                      lang="hi"
                      value={q[keyHi] ?? ""}
                      onChange={(e) => setQ({ ...q, [keyHi]: e.target.value })}
                      placeholder="Optional Hindi translation"
                    />
                  </label>
                </div>
              );
            })}
          </div>
          <label className="mt-3 block">
            <span className="label">Explanation (English)</span>
            <textarea
              className="input min-h-20"
              value={q.explanation ?? ""}
              onChange={(e) => setQ({ ...q, explanation: e.target.value })}
            />
          </label>
          <label className="mt-3 block">
            <span className="label">व्याख्या (हिन्दी)</span>
            <textarea
              className="input min-h-20"
              lang="hi"
              value={q.explanationHi ?? ""}
              onChange={(e) => setQ({ ...q, explanationHi: e.target.value })}
              placeholder="Optional Hindi translation"
            />
          </label>
        </div>
        <div className="space-y-3">
          <label>
            <span className="label">Correct answer</span>
            <select
              className="input"
              value={q.correctAnswer ?? ""}
              onChange={(e) => setQ({ ...q, correctAnswer: e.target.value })}
            >
              <option value="">Choose answer</option>
              {["A", "B", "C", "D"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Subject (English)</span>
            <input
              className="input"
              list={`subjects-${q.id}`}
              value={q.subjectName ?? ""}
              onChange={(e) => setQ({ ...q, subjectName: e.target.value })}
            />
            <datalist id={`subjects-${q.id}`}>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name} />
              ))}
            </datalist>
          </label>
          <label>
            <span className="label">विषय (हिन्दी)</span>
            <input
              className="input"
              lang="hi"
              list={`subjects-hi-${q.id}`}
              value={q.subjectNameHi ?? ""}
              onChange={(e) => setQ({ ...q, subjectNameHi: e.target.value })}
            />
            <datalist id={`subjects-hi-${q.id}`}>
              {subjects
                .filter((subject) => subject.nameHi)
                .map((subject) => (
                  <option key={subject.id} value={subject.nameHi ?? ""} />
                ))}
            </datalist>
          </label>
          <label>
            <span className="label">Topic (English)</span>
            <input
              className="input"
              value={q.topicName ?? ""}
              onChange={(e) => setQ({ ...q, topicName: e.target.value })}
            />
          </label>
          <label>
            <span className="label">टॉपिक (हिन्दी)</span>
            <input
              className="input"
              lang="hi"
              value={q.topicNameHi ?? ""}
              onChange={(e) => setQ({ ...q, topicNameHi: e.target.value })}
            />
          </label>
          <label>
            <span className="label">Difficulty</span>
            <select
              className="input"
              value={q.difficulty}
              onChange={(e) => setQ({ ...q, difficulty: e.target.value })}
            >
              <option>EASY</option>
              <option>MEDIUM</option>
              <option>HARD</option>
            </select>
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label>
              <span className="label">Marks</span>
              <input
                className="input"
                type="number"
                step=".25"
                value={q.marks}
                onChange={(e) => setQ({ ...q, marks: Number(e.target.value) })}
              />
            </label>
            <label>
              <span className="label">Negative</span>
              <input
                className="input"
                type="number"
                step=".25"
                value={q.negativeMarks}
                onChange={(e) =>
                  setQ({ ...q, negativeMarks: Number(e.target.value) })
                }
              />
            </label>
          </div>
        </div>
      </div>
    </article>
  );
}

function ImportMetric({ label, value }: { label: string; value: number }) {
  return (
    <div className="card px-5 py-4">
      <p className="text-xs font-bold text-[#78857e]">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
    </div>
  );
}
