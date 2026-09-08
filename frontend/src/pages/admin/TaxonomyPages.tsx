import {
  CheckCircle2,
  Pencil,
  Plus,
  Save,
  Settings,
  Shapes,
  Tags,
  Trash2,
} from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
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

type Category = {
  id: string;
  name: string;
  nameHi?: string | null;
  description?: string;
  _count: { exams: number };
};
type Topic = {
  id: string;
  name: string;
  nameHi?: string | null;
  subjectId: string;
};
type Subject = {
  id: string;
  name: string;
  nameHi?: string | null;
  topics: Topic[];
  _count: { questions: number };
};

export function CategoriesPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { localize } = useLanguage();
  const [name, setName] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [description, setDescription] = useState("");
  const [editing, setEditing] = useState<Category | null>(null);
  const query = useQuery({
    queryKey: ["taxonomy", "categories"],
    queryFn: () =>
      api
        .get<Category[]>("/admin/categories")
        .then((response) => response.data),
  });
  const save = useMutation({
    mutationFn: (category?: Category) =>
      category
        ? api.put(`/admin/categories/${category.id}`, {
            name,
            nameHi: nameHi.trim() || undefined,
            description,
          })
        : api.post("/admin/categories", {
            name,
            nameHi: nameHi.trim() || undefined,
            description,
          }),
    onSuccess: () => {
      setName("");
      setNameHi("");
      setDescription("");
      setEditing(null);
      toast.show("Category saved");
      qc.invalidateQueries({ queryKey: ["taxonomy", "categories"] });
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/categories/${id}`),
    onSuccess: () =>
      qc.invalidateQueries({ queryKey: ["taxonomy", "categories"] }),
    onError: (error) => toast.show(error.message, "error"),
  });
  const beginEdit = (category: Category) => {
    setEditing(category);
    setName(category.name);
    setNameHi(category.nameHi ?? "");
    setDescription(category.description ?? "");
  };
  return (
    <>
      <PageHeader
        eyebrow="Content organization"
        title="Exam categories"
        description="Create and maintain categories such as SSC, Banking, Railway, and university exams."
        action={<LanguageToggle />}
      />
      <form
        className="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_1fr_1.5fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (name.trim()) save.mutate(editing ?? undefined);
        }}
      >
        <input
          className="input"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Category name (English, required)"
        />
        <input
          className="input"
          value={nameHi}
          onChange={(event) => setNameHi(event.target.value)}
          placeholder="श्रेणी का नाम (हिन्दी, वैकल्पिक)"
          lang="hi"
        />
        <input
          className="input"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="Short description"
        />
        <div className="flex gap-2">
          <button
            className="btn-primary whitespace-nowrap"
            disabled={!name.trim() || save.isPending}
          >
            {editing ? (
              <Save className="h-4 w-4" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            {editing ? "Save" : "Add"}
          </button>
          {editing && (
            <button
              type="button"
              className="btn-secondary"
              onClick={() => {
                setEditing(null);
                setName("");
                setNameHi("");
                setDescription("");
              }}
            >
              Cancel
            </button>
          )}
        </div>
      </form>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : query.data?.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((category) => (
            <article
              className="card flex items-center gap-4 p-5"
              key={category.id}
            >
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-forest">
                <Tags />
              </span>
              <div className="min-w-0 flex-1">
                <h3 className="font-display font-extrabold">
                  {localize(category.name, category.nameHi)}
                </h3>
                <p className="truncate text-xs text-[#7d8983]">
                  {category.description || "No description"} ·{" "}
                  {category._count.exams} exams
                </p>
              </div>
              <button
                className="rounded-lg p-2 hover:bg-[#eef0ec]"
                onClick={() => beginEdit(category)}
              >
                <Pencil className="h-4 w-4" />
              </button>
              <button
                className="rounded-lg p-2 text-rose-600 hover:bg-rose-50"
                onClick={() => remove.mutate(category.id)}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No categories yet"
          description="Add the first exam category above."
        />
      )}
    </>
  );
}

export function SubjectsPage() {
  const qc = useQueryClient();
  const toast = useToast();
  const { localize } = useLanguage();
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameHi, setSubjectNameHi] = useState("");
  const [editing, setEditing] = useState<Subject | null>(null);
  const [topicFor, setTopicFor] = useState<Subject | null>(null);
  const [editingTopic, setEditingTopic] = useState<Topic | null>(null);
  const [topicName, setTopicName] = useState("");
  const [topicNameHi, setTopicNameHi] = useState("");
  const query = useQuery({
    queryKey: ["taxonomy", "subjects"],
    queryFn: () =>
      api.get<Subject[]>("/admin/subjects").then((response) => response.data),
  });
  const refresh = () =>
    qc.invalidateQueries({ queryKey: ["taxonomy", "subjects"] });
  const saveSubject = useMutation({
    mutationFn: () =>
      editing
        ? api.put(`/admin/subjects/${editing.id}`, {
            name: subjectName,
            nameHi: subjectNameHi.trim() || undefined,
          })
        : api.post("/admin/subjects", {
            name: subjectName,
            nameHi: subjectNameHi.trim() || undefined,
          }),
    onSuccess: () => {
      setSubjectName("");
      setSubjectNameHi("");
      setEditing(null);
      toast.show("Subject saved");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const deleteSubject = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/subjects/${id}`),
    onSuccess: refresh,
    onError: (error) => toast.show(error.message, "error"),
  });
  const saveTopic = useMutation({
    mutationFn: () =>
      editingTopic
        ? api.put(`/admin/topics/${editingTopic.id}`, {
            name: topicName,
            nameHi: topicNameHi.trim() || undefined,
            subjectId: topicFor!.id,
          })
        : api.post("/admin/topics", {
            name: topicName,
            nameHi: topicNameHi.trim() || undefined,
            subjectId: topicFor!.id,
          }),
    onSuccess: () => {
      setTopicName("");
      setTopicNameHi("");
      setTopicFor(null);
      setEditingTopic(null);
      toast.show("Topic saved");
      refresh();
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const deleteTopic = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/topics/${id}`),
    onSuccess: refresh,
    onError: (error) => toast.show(error.message, "error"),
  });
  return (
    <>
      <PageHeader
        eyebrow="Content organization"
        title="Subjects & topics"
        description="Topics feed question filtering and automatically power weak-area analysis."
        action={<LanguageToggle />}
      />
      <form
        className="card mb-5 grid gap-3 p-4 md:grid-cols-[1fr_1fr_auto_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          if (subjectName.trim()) saveSubject.mutate();
        }}
      >
        <input
          className="input"
          value={subjectName}
          onChange={(event) => setSubjectName(event.target.value)}
          placeholder="Subject name (English, required)"
        />
        <input
          className="input"
          value={subjectNameHi}
          onChange={(event) => setSubjectNameHi(event.target.value)}
          placeholder="विषय का नाम (हिन्दी, वैकल्पिक)"
          lang="hi"
        />
        <button
          className="btn-primary whitespace-nowrap"
          disabled={!subjectName.trim()}
        >
          {editing ? (
            <Save className="h-4 w-4" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
          {editing ? "Save subject" : "Add subject"}
        </button>
        {editing && (
          <button
            type="button"
            className="btn-secondary"
            onClick={() => {
              setEditing(null);
              setSubjectName("");
              setSubjectNameHi("");
            }}
          >
            Cancel
          </button>
        )}
      </form>
      {query.isLoading ? (
        <Loading />
      ) : query.error ? (
        <ErrorState error={query.error} />
      ) : query.data?.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {query.data.map((subject) => (
            <article className="card p-5" key={subject.id}>
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-mint text-forest">
                  <Shapes />
                </span>
                <div className="flex-1">
                  <h2 className="font-display font-extrabold">
                    {localize(subject.name, subject.nameHi)}
                  </h2>
                  <p className="text-xs text-[#7d8983]">
                    {subject._count.questions} questions ·{" "}
                    {subject.topics.length} topics
                  </p>
                </div>
                <button
                  className="rounded-lg p-2"
                  onClick={() => {
                    setEditing(subject);
                    setSubjectName(subject.name);
                    setSubjectNameHi(subject.nameHi ?? "");
                  }}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  className="rounded-lg p-2 text-rose-600"
                  onClick={() => deleteSubject.mutate(subject.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {subject.topics.map((topic) => (
                  <span
                    className="group inline-flex items-center gap-1 rounded-full bg-[#eef1ed] px-3 py-1.5 text-xs font-bold"
                    key={topic.id}
                  >
                    {localize(topic.name, topic.nameHi)}
                    <button
                      className="hidden text-forest group-hover:block"
                      aria-label={`Edit ${topic.name}`}
                      onClick={() => {
                        setTopicFor(subject);
                        setEditingTopic(topic);
                        setTopicName(topic.name);
                        setTopicNameHi(topic.nameHi ?? "");
                      }}
                    >
                      <Pencil className="h-3 w-3" />
                    </button>
                    <button
                      className="hidden text-rose-600 group-hover:block"
                      aria-label={`Delete ${topic.name}`}
                      onClick={() => deleteTopic.mutate(topic.id)}
                    >
                      ×
                    </button>
                  </span>
                ))}
                <button
                  className="inline-flex items-center gap-1 rounded-full border border-dashed border-[#aebbb4] px-3 py-1.5 text-xs font-extrabold text-forest"
                  onClick={() => {
                    setTopicFor(subject);
                    setEditingTopic(null);
                    setTopicName("");
                    setTopicNameHi("");
                  }}
                >
                  <Plus className="h-3 w-3" />
                  Topic
                </button>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <Empty
          title="No subjects yet"
          description="Add the first subject above."
        />
      )}
      <Modal
        open={!!topicFor}
        title={`${editingTopic ? "Edit" : "Add"} topic ${editingTopic ? "in" : "to"} ${topicFor ? localize(topicFor.name, topicFor.nameHi) : ""}`}
        onClose={() => {
          setTopicFor(null);
          setEditingTopic(null);
        }}
        footer={
          <>
            <button
              className="btn-secondary"
              onClick={() => {
                setTopicFor(null);
                setEditingTopic(null);
              }}
            >
              Cancel
            </button>
            <button
              className="btn-primary"
              disabled={!topicName.trim()}
              onClick={() => saveTopic.mutate()}
            >
              {editingTopic ? "Save topic" : "Add topic"}
            </button>
          </>
        }
      >
        <label>
          <span className="label">Topic name (English, required)</span>
          <input
            autoFocus
            className="input"
            value={topicName}
            onChange={(event) => setTopicName(event.target.value)}
            placeholder="e.g. Percentages"
          />
        </label>
        <label className="mt-4 block">
          <span className="label">Topic name (Hindi, optional)</span>
          <input
            className="input"
            value={topicNameHi}
            onChange={(event) => setTopicNameHi(event.target.value)}
            placeholder="जैसे प्रतिशत"
            lang="hi"
          />
        </label>
      </Modal>
    </>
  );
}

export function AdminSettingsPage() {
  const toast = useToast();
  return (
    <>
      <PageHeader
        eyebrow="Platform settings"
        title="Settings"
        description="Deployment-specific secrets and storage paths are managed through environment variables."
      />
      <div className="grid max-w-4xl gap-5 md:grid-cols-2">
        <section className="card p-6">
          <Settings className="h-7 w-7 text-forest" />
          <h2 className="mt-4 font-display text-lg font-extrabold">
            Security defaults
          </h2>
          <div className="mt-5 space-y-3">
            {[
              "JWT authentication enabled",
              "Role-based API protection",
              "Server-side scoring",
              "Answer keys hidden in active tests",
              "Private paper-import storage",
            ].map((item) => (
              <p
                className="flex items-center gap-2 text-sm font-semibold"
                key={item}
              >
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                {item}
              </p>
            ))}
          </div>
        </section>
        <section className="card p-6">
          <Save className="h-7 w-7 text-forest" />
          <h2 className="mt-4 font-display text-lg font-extrabold">
            Environment configuration
          </h2>
          <p className="mt-2 text-sm leading-6 text-[#6d7973]">
            Database credentials, JWT secrets, CORS origin, upload directory,
            and API URLs are intentionally not editable in the browser.
          </p>
          <button
            className="btn-secondary mt-5"
            onClick={() =>
              toast.show(
                "Settings are controlled through the deployment environment",
              )
            }
          >
            Verify configuration
          </button>
        </section>
      </div>
    </>
  );
}
