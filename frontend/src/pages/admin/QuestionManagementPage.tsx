import {
  ArrowLeft,
  Copy,
  Eye,
  FileQuestion,
  ImagePlus,
  Layers3,
  Pencil,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { MarkdownContent } from "../../components/MarkdownContent";
import { MarkdownEditor } from "../../components/MarkdownEditor";
import { LanguageToggle } from "../../components/LanguageToggle";
import {
  Badge,
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
  Pagination,
} from "../../components/ui";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";
import { resolveMediaUrl, uploadImage } from "../../lib/media";

type Topic = { id: string; name: string; nameHi?: string | null };
type Subject = {
  id: string;
  name: string;
  nameHi?: string | null;
  topics: Topic[];
};
type Section = { id: string; name: string; nameHi?: string | null };
type Exam = {
  id: string;
  title: string;
  titleHi?: string | null;
  marksPerQuestion: number;
  negativeMarks: number;
};
type OptionForm = {
  label: string;
  text: string;
  textHi?: string;
  imageUrl?: string;
  isCorrect: boolean;
};
type QuestionForm = {
  examId: string;
  sectionId: string;
  subjectId: string;
  topicId: string;
  text: string;
  textHi: string;
  imageUrl: string;
  explanation: string;
  explanationHi: string;
  difficulty: string;
  marks: number;
  negativeMarks: number;
  options: OptionForm[];
};
type Question = QuestionForm & {
  id: string;
  order: number;
  exam: { title: string; titleHi?: string | null };
  subject?: { name: string; nameHi?: string | null };
  topic?: { name: string; nameHi?: string | null };
  options: (OptionForm & { id: string })[];
};

const blank = (examId = "", marks = 2, negativeMarks = 0.5): QuestionForm => ({
  examId,
  sectionId: "",
  subjectId: "",
  topicId: "",
  text: "",
  textHi: "",
  imageUrl: "",
  explanation: "",
  explanationHi: "",
  difficulty: "MEDIUM",
  marks,
  negativeMarks,
  options: ["A", "B", "C", "D"].map((label, index) => ({
    label,
    text: "",
    textHi: "",
    imageUrl: "",
    isCorrect: index === 0,
  })),
});

export function QuestionManagementPage() {
  const { id: routeExamId } = useParams();
  const toast = useToast();
  const { language, localize } = useLanguage();
  const qc = useQueryClient();
  const [filters, setFilters] = useState({
    search: "",
    examId: routeExamId ?? "",
    subjectId: "",
    topicId: "",
    difficulty: "",
  });
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [editor, setEditor] = useState<Question | "new" | null>(null);
  const [preview, setPreview] = useState<Question | null>(null);
  const [deleting, setDeleting] = useState<Question | null>(null);
  const meta = useQuery({
    queryKey: ["question-meta"],
    queryFn: async () => {
      const [exams, subjects] = await Promise.all([
        api.get<{ items: Exam[] }>("/admin/exams", { params: { limit: 100 } }),
        api.get<Subject[]>("/admin/subjects"),
      ]);
      return { exams: exams.data.items, subjects: subjects.data };
    },
  });
  const query = useQuery({
    queryKey: ["admin-questions", filters, page],
    queryFn: () =>
      api
        .get<{ items: Question[]; pages: number; total: number }>(
          "/admin/questions",
          {
            params: {
              ...Object.fromEntries(
                Object.entries(filters).filter(([, value]) => value),
              ),
              page,
              limit: 20,
            },
          },
        )
        .then((response) => response.data),
  });
  const refresh = () => {
    setSelected(new Set());
    qc.invalidateQueries({ queryKey: ["admin-questions"] });
  };
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/questions/${id}`),
    onSuccess: () => {
      toast.show("Question deleted");
      setDeleting(null);
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const duplicate = useMutation({
    mutationFn: (id: string) => api.post(`/admin/questions/${id}/duplicate`),
    onSuccess: () => {
      toast.show("Question duplicated");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const bulkDelete = useMutation({
    mutationFn: () =>
      api.post("/admin/questions/bulk-delete", { ids: [...selected] }),
    onSuccess: (response) => {
      toast.show(`${response.data.deleted} questions deleted`);
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  if (meta.isLoading || query.isLoading) return <Loading />;
  if (meta.error || query.error)
    return <ErrorState error={meta.error ?? query.error} />;
  const exam = meta.data!.exams.find((item) => item.id === routeExamId);
  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters((current) => ({ ...current, [key]: value }));
    setPage(1);
    setSelected(new Set());
  };
  return (
    <>
      {routeExamId && (
        <div className="mb-5 flex flex-wrap items-center gap-4">
          <Link
            to="/admin/exams"
            className="inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to exams
          </Link>
          <Link
            to={`/admin/exams/${routeExamId}/sections`}
            className="inline-flex items-center gap-2 text-sm font-bold text-forest"
          >
            <Layers3 className="h-4 w-4" />
            Manage sections
          </Link>
        </div>
      )}
      <PageHeader
        eyebrow="Question management"
        title={exam ? localize(exam.title, exam.titleHi) : "Question bank"}
        description={
          exam
            ? "Add, edit, organize, preview, and validate this exam’s questions."
            : "Search and maintain questions across every exam."
        }
        action={
          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggle />
            <button className="btn-primary" onClick={() => setEditor("new")}>
              <Plus className="h-4 w-4" />
              Add question
            </button>
          </div>
        }
      />
      <div className="card mb-5 p-4">
        <div className="grid gap-3 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <label className="relative">
            <span className="sr-only">Search questions</span>
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-[#819088]" />
            <input
              className="input pl-10"
              value={filters.search}
              onChange={(event) => updateFilter("search", event.target.value)}
              placeholder="Search question text…"
            />
          </label>
          {!routeExamId && (
            <select
              className="input"
              aria-label="Filter by exam"
              value={filters.examId}
              onChange={(event) => updateFilter("examId", event.target.value)}
            >
              <option value="">All exams</option>
              {meta.data!.exams.map((item) => (
                <option key={item.id} value={item.id}>
                  {localize(item.title, item.titleHi)}
                </option>
              ))}
            </select>
          )}
          <select
            className="input"
            aria-label="Filter by subject"
            value={filters.subjectId}
            onChange={(event) => {
              updateFilter("subjectId", event.target.value);
              setFilters((current) => ({
                ...current,
                subjectId: event.target.value,
                topicId: "",
              }));
            }}
          >
            <option value="">All subjects</option>
            {meta.data!.subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {localize(subject.name, subject.nameHi)}
              </option>
            ))}
          </select>
          <select
            className="input"
            aria-label="Filter by topic"
            value={filters.topicId}
            onChange={(event) => updateFilter("topicId", event.target.value)}
          >
            <option value="">All topics</option>
            {meta
              .data!.subjects.filter(
                (subject) =>
                  !filters.subjectId || subject.id === filters.subjectId,
              )
              .flatMap((subject) => subject.topics)
              .map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {localize(topic.name, topic.nameHi)}
                </option>
              ))}
          </select>
          <select
            className="input"
            aria-label="Filter by difficulty"
            value={filters.difficulty}
            onChange={(event) => updateFilter("difficulty", event.target.value)}
          >
            <option value="">Any difficulty</option>
            <option>EASY</option>
            <option>MEDIUM</option>
            <option>HARD</option>
          </select>
        </div>
        {selected.size > 0 && (
          <div className="mt-4 flex items-center justify-between rounded-xl bg-rose-50 p-3">
            <span className="text-sm font-extrabold text-rose-800">
              {selected.size} selected
            </span>
            <button
              className="btn-danger !py-2"
              disabled={bulkDelete.isPending}
              onClick={() => bulkDelete.mutate()}
            >
              <Trash2 className="h-4 w-4" />
              Bulk delete
            </button>
          </div>
        )}
      </div>
      {query.data!.items.length ? (
        <>
          <div className="space-y-3">
            {query.data!.items.map((question) => (
              <article
                className="card flex flex-col gap-4 p-5 md:flex-row md:items-center"
                key={question.id}
              >
                <input
                  aria-label={`Select question ${question.order}`}
                  type="checkbox"
                  className="h-5 w-5 accent-[#173f35]"
                  checked={selected.has(question.id)}
                  onChange={() =>
                    setSelected((current) => {
                      const next = new Set(current);
                      next.has(question.id)
                        ? next.delete(question.id)
                        : next.add(question.id);
                      return next;
                    })
                  }
                />
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-mint font-display text-sm font-extrabold text-forest">
                  {question.order}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap gap-2">
                    <Badge>
                      {localize(
                        question.exam.title,
                        question.exam.titleHi,
                      )}
                    </Badge>
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
                    {question.subject && (
                      <Badge tone="purple">
                        {localize(
                          question.subject.name,
                          question.subject.nameHi,
                        )}
                      </Badge>
                    )}
                    {question.topic && (
                      <Badge>
                        {localize(question.topic.name, question.topic.nameHi)}
                      </Badge>
                    )}
                  </div>
                  <div className="mt-2 line-clamp-2 text-sm font-bold leading-6">
                    <MarkdownContent>
                      {localize(question.text, question.textHi)}
                    </MarkdownContent>
                  </div>
                  <p className="mt-1 text-xs text-[#7d8983]">
                    {question.marks} marks · −{question.negativeMarks} negative
                  </p>
                </div>
                <div className="flex gap-1">
                  <button
                    className="rounded-lg p-2 hover:bg-[#eef0ec]"
                    title="Preview"
                    onClick={() => setPreview(question)}
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 hover:bg-[#eef0ec]"
                    title="Edit"
                    onClick={() => setEditor(question)}
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 hover:bg-[#eef0ec]"
                    title="Duplicate"
                    onClick={() => duplicate.mutate(question.id)}
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                  <button
                    className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                    title="Delete"
                    onClick={() => setDeleting(question)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </article>
            ))}
          </div>
          <Pagination
            page={page}
            pages={query.data!.pages}
            onChange={setPage}
          />
        </>
      ) : (
        <Empty
          title="No questions found"
          description="Add a question manually, adjust the filters, or import a previous-year paper."
          action={
            <button className="btn-primary" onClick={() => setEditor("new")}>
              <FileQuestion className="h-4 w-4" />
              Add question
            </button>
          }
        />
      )}
      <QuestionEditor
        open={!!editor}
        existing={editor === "new" ? undefined : (editor ?? undefined)}
        defaultExamId={routeExamId}
        exams={meta.data!.exams}
        subjects={meta.data!.subjects}
        onClose={() => setEditor(null)}
        onSaved={() => {
          setEditor(null);
          refresh();
        }}
      />
      <Modal
        open={!!preview}
        title={`Preview question ${preview?.order ?? ""}`}
        onClose={() => setPreview(null)}
      >
        <div className="mb-4 flex items-center justify-between gap-3 rounded-xl bg-[#f4f6f2] p-3">
          <p className="text-xs font-bold text-[#66736d]">
            {language === "hi" ? "Hindi preview" : "English preview"}
          </p>
          <LanguageToggle compact />
        </div>
        <div className="font-display text-lg font-bold leading-7">
          {preview && (
            <MarkdownContent>
              {localize(preview.text, preview.textHi)}
            </MarkdownContent>
          )}
        </div>
        {preview?.imageUrl && (
          <img
            className="mt-4 max-h-72 rounded-xl object-contain"
            src={resolveMediaUrl(preview.imageUrl)}
            alt="Question"
          />
        )}
        <div className="mt-5 space-y-2">
          {preview?.options.map((option) => (
            <div
              className={`rounded-xl border p-3 text-sm ${option.isCorrect ? "border-emerald-300 bg-emerald-50" : "border-[#dfe2dc]"}`}
              key={option.label}
            >
              <b className="mr-2">{option.label}.</b>
              <MarkdownContent className="inline">
                {localize(option.text, option.textHi)}
              </MarkdownContent>
              {option.imageUrl && (
                <img
                  className="mt-2 max-h-28 rounded-lg"
                  src={resolveMediaUrl(option.imageUrl)}
                  alt={`Option ${option.label}`}
                />
              )}{" "}
              {option.isCorrect && (
                <span className="float-right text-xs font-extrabold text-emerald-700">
                  CORRECT
                </span>
              )}
            </div>
          ))}
        </div>
        {preview &&
          localize(preview.explanation, preview.explanationHi) && (
          <div className="mt-5 rounded-xl bg-mint p-4 text-sm">
            <b>Explanation:</b>
            <MarkdownContent>
              {localize(preview.explanation, preview.explanationHi)}
            </MarkdownContent>
          </div>
          )}
      </Modal>
      <Modal
        open={!!deleting}
        title="Delete this question?"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setDeleting(null)}>
              Cancel
            </button>
            <button
              className="btn-danger"
              disabled={remove.isPending}
              onClick={() => remove.mutate(deleting!.id)}
            >
              <Trash2 className="h-4 w-4" />
              Delete question
            </button>
          </>
        }
      >
        <p className="text-sm leading-6 text-[#64726b]">
          Question {deleting?.order} will be permanently removed. Exams with
          attempt history are protected.
        </p>
      </Modal>
    </>
  );
}

function QuestionEditor({
  open,
  existing,
  defaultExamId,
  exams,
  subjects,
  onClose,
  onSaved,
}: {
  open: boolean;
  existing?: Question;
  defaultExamId?: string;
  exams: Exam[];
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const { language, localize } = useLanguage();
  const initialExam = exams.find((exam) => exam.id === defaultExamId);
  const makeDefaults = () =>
    existing
      ? {
          ...existing,
          sectionId: existing.sectionId ?? "",
          subjectId: existing.subjectId ?? "",
          topicId: existing.topicId ?? "",
          textHi: existing.textHi ?? "",
          imageUrl: existing.imageUrl ?? "",
          explanationHi: existing.explanationHi ?? "",
          options: existing.options.map(
            ({ label, text, textHi, imageUrl, isCorrect }) => ({
              label,
              text,
              textHi: textHi ?? "",
              imageUrl: imageUrl ?? "",
              isCorrect,
            }),
          ),
        }
      : blank(
          defaultExamId,
          Number(initialExam?.marksPerQuestion ?? 2),
          Number(initialExam?.negativeMarks ?? 0.5),
        );
  const { register, handleSubmit, reset, watch, setValue, control } =
    useForm<QuestionForm>({ defaultValues: makeDefaults() });
  useEffect(() => reset(makeDefaults()), [existing, defaultExamId, open]);
  const values = watch();
  const sections = useQuery({
    queryKey: ["question-editor-sections", values.examId],
    enabled: !!values.examId,
    queryFn: () =>
      api
        .get<Section[]>(`/admin/exams/${values.examId}/sections`)
        .then((response) => response.data),
  });
  const topics =
    subjects.find((subject) => subject.id === values.subjectId)?.topics ?? [];
  const save = useMutation({
    mutationFn: (form: QuestionForm) => {
      const payload = {
        ...form,
        sectionId: form.sectionId || undefined,
        subjectId: form.subjectId || undefined,
        topicId: form.topicId || undefined,
        textHi: form.textHi.trim() || undefined,
        imageUrl: form.imageUrl || undefined,
        explanationHi: form.explanationHi.trim() || undefined,
        options: form.options.map((option) => ({
          ...option,
          textHi: option.textHi?.trim() || undefined,
          imageUrl: option.imageUrl || undefined,
        })),
        marks: Number(form.marks),
        negativeMarks: Number(form.negativeMarks),
      };
      return existing?.id
        ? api.put(`/admin/questions/${existing.id}`, payload)
        : api.post("/admin/questions", payload);
    },
    onSuccess: () => {
      toast.show("Question saved");
      onSaved();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  return (
    <Modal
      open={open}
      wide
      title={existing?.id ? "Edit question" : "Add question"}
      onClose={onClose}
      footer={
        <>
          <button className="btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn-primary"
            disabled={save.isPending}
            onClick={handleSubmit((form) => save.mutate(form))}
          >
            {save.isPending ? "Saving…" : "Save question"}
          </button>
        </>
      }
    >
      <div className="max-h-[70vh] space-y-4 overflow-y-auto pr-2">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#dce2dc] bg-[#f6f8f4] p-3">
          <p className="text-xs font-bold leading-5 text-[#64726b]">
            English is required. Hindi is optional and falls back to English.
          </p>
          <LanguageToggle compact />
        </div>
        <label>
          <span className="label">Exam</span>
          <select
            className="input"
            disabled={!!existing}
            {...register("examId", { required: true })}
          >
            <option value="">Choose exam</option>
            {exams.map((exam) => (
              <option key={exam.id} value={exam.id}>
                {localize(exam.title, exam.titleHi)}
              </option>
            ))}
          </select>
        </label>
        <div>
          <span className="label">
            Question text (English, required)
          </span>
          <Controller
            control={control}
            name="text"
            rules={{ required: true }}
            render={({ field }) => (
              <MarkdownEditor value={field.value} onChange={field.onChange} />
            )}
          />
        </div>
        <div lang="hi">
          <span className="label">Question text (Hindi, optional)</span>
          <Controller
            control={control}
            name="textHi"
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="प्रश्न हिन्दी में लिखें…"
              />
            )}
          />
        </div>
        <MediaField
          label="Standalone question image"
          value={values.imageUrl}
          onChange={(url) => setValue("imageUrl", url)}
        />
        <div className="space-y-3">
          {values.options?.map((option, index) => (
            <div
              className={`rounded-xl border p-3 ${option.isCorrect ? "border-emerald-300 bg-emerald-50/50" : "border-[#e1e4de]"}`}
              key={option.label}
            >
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  title="Set as correct"
                  onClick={() =>
                    values.options.forEach((_, optionIndex) =>
                      setValue(
                        `options.${optionIndex}.isCorrect`,
                        optionIndex === index,
                        { shouldDirty: true },
                      ),
                    )
                  }
                  className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl text-xs font-extrabold ${option.isCorrect ? "bg-emerald-600 text-white" : "bg-[#ecefe9]"}`}
                >
                  {option.label}
                </button>
                <input type="hidden" {...register(`options.${index}.label`)} />
                <input
                  type="hidden"
                  {...register(`options.${index}.isCorrect`)}
                />
                <div className="grid min-w-0 flex-1 gap-2 sm:grid-cols-2">
                  <input
                    className="input"
                    placeholder={`Option ${option.label} (English, required)`}
                    {...register(`options.${index}.text`, { required: true })}
                  />
                  <input
                    className="input"
                    placeholder={`विकल्प ${option.label} (हिन्दी, वैकल्पिक)`}
                    lang="hi"
                    {...register(`options.${index}.textHi`)}
                  />
                </div>
              </div>
              <div className="mt-2 pl-12">
                <MediaField
                  compact
                  label={`Option ${option.label} image`}
                  value={option.imageUrl}
                  onChange={(url) => setValue(`options.${index}.imageUrl`, url)}
                />
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#7b8881]">
          Click an option letter to set the single correct answer.
        </p>
        <div>
          <span className="label">Explanation (English)</span>
          <Controller
            control={control}
            name="explanation"
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="Explain why the answer is correct…"
              />
            )}
          />
        </div>
        <div lang="hi">
          <span className="label">Explanation (Hindi, optional)</span>
          <Controller
            control={control}
            name="explanationHi"
            render={({ field }) => (
              <MarkdownEditor
                value={field.value ?? ""}
                onChange={field.onChange}
                placeholder="सही उत्तर की व्याख्या हिन्दी में करें…"
              />
            )}
          />
        </div>
        <div className="rounded-2xl border border-[#d9e3dc] bg-mint/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="eyebrow">
              Live {language === "hi" ? "Hindi" : "English"} preview
            </p>
            {language === "hi" && !values.textHi?.trim() && (
              <span className="text-xs font-bold text-amber-700">
                Falling back to English
              </span>
            )}
          </div>
          <div className="mt-2 font-display font-bold leading-7">
            <MarkdownContent>
              {localize(values.text, values.textHi) ||
                "Question preview will appear here."}
            </MarkdownContent>
          </div>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {values.options?.map((option) => (
              <div
                className="rounded-xl border border-[#dfe3dc] bg-white/80 p-3 text-sm"
                key={`preview-${option.label}`}
              >
                <b className="mr-2">{option.label}.</b>
                {localize(option.text, option.textHi) || "—"}
              </div>
            ))}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <label>
            <span className="label">Section</span>
            <select className="input" {...register("sectionId")}>
              <option value="">No section</option>
              {sections.data?.map((section) => (
                <option key={section.id} value={section.id}>
                  {localize(section.name, section.nameHi)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Subject</span>
            <select
              className="input"
              {...register("subjectId")}
              onChange={(event) => {
                setValue("subjectId", event.target.value);
                setValue("topicId", "");
              }}
            >
              <option value="">General</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {localize(subject.name, subject.nameHi)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Topic</span>
            <select
              className="input"
              {...register("topicId")}
              disabled={!values.subjectId}
            >
              <option value="">No topic</option>
              {topics.map((topic) => (
                <option key={topic.id} value={topic.id}>
                  {localize(topic.name, topic.nameHi)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Difficulty</span>
            <select className="input" {...register("difficulty")}>
              <option>EASY</option>
              <option>MEDIUM</option>
              <option>HARD</option>
            </select>
          </label>
          <label>
            <span className="label">Marks</span>
            <input
              className="input"
              type="number"
              min=".01"
              step=".25"
              {...register("marks", { valueAsNumber: true })}
            />
          </label>
          <label>
            <span className="label">Negative marks</span>
            <input
              className="input"
              type="number"
              min="0"
              step=".25"
              {...register("negativeMarks", { valueAsNumber: true })}
            />
          </label>
        </div>
      </div>
    </Modal>
  );
}

function MediaField({
  label,
  value,
  compact,
  onChange,
}: {
  label: string;
  value?: string;
  compact?: boolean;
  onChange: (url: string) => void;
}) {
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    try {
      onChange(await uploadImage(file));
      toast.show("Image uploaded");
    } catch (error) {
      toast.show((error as Error).message, "error");
    } finally {
      setUploading(false);
    }
  };
  return (
    <div>
      <span className={compact ? "sr-only" : "label"}>{label}</span>
      <div className="flex items-center gap-2">
        {value && (
          <img
            src={resolveMediaUrl(value)}
            alt={label}
            className="h-12 w-16 rounded-lg border object-contain"
          />
        )}
        <label className="btn-secondary !px-3 !py-2">
          <ImagePlus className="h-4 w-4" />
          {uploading ? "Uploading…" : value ? "Replace image" : "Upload image"}
          <input
            className="hidden"
            type="file"
            accept="image/png,image/jpeg,image/gif,image/webp"
            onChange={(event) => void upload(event.target.files?.[0])}
          />
        </label>
        {value && (
          <button
            type="button"
            className="text-xs font-extrabold text-rose-600"
            onClick={() => onChange("")}
          >
            Remove
          </button>
        )}
      </div>
    </div>
  );
}
