import { ArrowLeft, Layers3, Pencil, Plus, Trash2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  Empty,
  ErrorState,
  Loading,
  Modal,
  PageHeader,
} from "../../components/ui";
import { LanguageToggle } from "../../components/LanguageToggle";
import { useLanguage } from "../../contexts/LanguageContext";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";

type Section = {
  id: string;
  name: string;
  nameHi?: string | null;
  order: number;
  subjectId?: string;
  subject?: { name: string; nameHi?: string | null };
  _count: { questions: number };
};
type Subject = { id: string; name: string; nameHi?: string | null };

export function ExamSectionsPage() {
  const { id } = useParams();
  const qc = useQueryClient();
  const toast = useToast();
  const { localize } = useLanguage();
  const [editing, setEditing] = useState<Section | "new" | null>(null);
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [subjectId, setSubjectId] = useState("");
  const [order, setOrder] = useState(1);
  const query = useQuery({
    queryKey: ["exam-sections", id],
    queryFn: async () => {
      const [exam, sections, subjects] = await Promise.all([
        api.get<{ title: string; titleHi?: string | null }>(
          `/admin/exams/${id}`,
        ),
        api.get<Section[]>(`/admin/exams/${id}/sections`),
        api.get<Subject[]>("/admin/subjects"),
      ]);
      return {
        exam: exam.data,
        sections: sections.data,
        subjects: subjects.data,
      };
    },
  });
  const open = (section: Section | "new") => {
    setEditing(section);
    setName(section === "new" ? "" : section.name);
    setNameHi(section === "new" ? "" : (section.nameHi ?? ""));
    setSubjectId(section === "new" ? "" : (section.subjectId ?? ""));
    setOrder(
      section === "new"
        ? (query.data?.sections.length ?? 0) + 1
        : section.order,
    );
  };
  const save = useMutation({
    mutationFn: () => {
      const body = {
        name,
        nameHi: nameHi.trim() || undefined,
        subjectId: subjectId || undefined,
        order,
      };
      return editing === "new"
        ? api.post(`/admin/exams/${id}/sections`, body)
        : api.put(`/admin/exams/${id}/sections/${editing!.id}`, body);
    },
    onSuccess: () => {
      setEditing(null);
      toast.show("Exam section saved");
      qc.invalidateQueries({ queryKey: ["exam-sections", id] });
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const remove = useMutation({
    mutationFn: (section: string) =>
      api.delete(`/admin/exams/${id}/sections/${section}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["exam-sections", id] }),
    onError: (error) => toast.show(error.message, "error"),
  });
  if (query.isLoading) return <Loading />;
  if (query.error) return <ErrorState error={query.error} />;
  return (
    <>
      <Link
        to={`/admin/exams/${id}`}
        className="mb-5 inline-flex items-center gap-2 text-sm font-bold text-[#6c7973]"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to exam
      </Link>
      <PageHeader
        eyebrow="Exam structure"
        title={`${localize(query.data!.exam.title, query.data!.exam.titleHi)} sections`}
        description="Sections drive CBT navigation and section-wise result analysis."
        action={
          <div className="flex flex-wrap items-center gap-3">
            <LanguageToggle />
            <button className="btn-primary" onClick={() => open("new")}>
              <Plus className="h-4 w-4" />
              Add section
            </button>
          </div>
        }
      />
      {query.data!.sections.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data!.sections.map((section) => (
            <article
              className="card flex items-center gap-4 p-5"
              key={section.id}
            >
              <span className="grid h-12 w-12 place-items-center rounded-xl bg-mint font-display font-extrabold text-forest">
                {section.order}
              </span>
              <div className="min-w-0 flex-1">
                <h2 className="truncate font-display font-extrabold">
                  {localize(section.name, section.nameHi)}
                </h2>
                <p className="text-xs text-[#7b8881]">
                  {section.subject
                    ? localize(section.subject.name, section.subject.nameHi)
                    : "No subject"} ·{" "}
                  {section._count.questions} questions
                </p>
              </div>
              <button
                className="rounded-lg p-2 hover:bg-[#eef0ec]"
                onClick={() => open(section)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                onClick={() => remove.mutate(section.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No sections configured"
          description="Add the first section, such as Mathematics or Reasoning."
          action={
            <button className="btn-primary" onClick={() => open("new")}>
              <Layers3 className="h-4 w-4" />
              Add section
            </button>
          }
        />
      )}
      <Modal
        open={!!editing}
        title={editing === "new" ? "Add section" : "Edit section"}
        onClose={() => setEditing(null)}
        footer={
          <>
            <button className="btn-secondary" onClick={() => setEditing(null)}>
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={!name.trim() || save.isPending}
              onClick={() => save.mutate()}
            >
              Save section
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <label>
            <span className="label">Section name (English, required)</span>
            <input
              className="input"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Quantitative Aptitude"
            />
          </label>
          <label>
            <span className="label">Section name (Hindi, optional)</span>
            <input
              className="input"
              value={nameHi}
              onChange={(event) => setNameHi(event.target.value)}
              placeholder="जैसे मात्रात्मक योग्यता"
              lang="hi"
            />
          </label>
          <label>
            <span className="label">Subject</span>
            <select
              className="input"
              value={subjectId}
              onChange={(event) => setSubjectId(event.target.value)}
            >
              <option value="">No linked subject</option>
              {query.data!.subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {localize(subject.name, subject.nameHi)}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Display order</span>
            <input
              className="input"
              type="number"
              min="1"
              value={order}
              onChange={(event) => setOrder(Number(event.target.value))}
            />
          </label>
        </div>
      </Modal>
    </>
  );
}
