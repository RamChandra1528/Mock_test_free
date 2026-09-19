import { FileText, ImagePlus, Pencil, Plus, Save, Trash2, UploadCloud } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Empty, ErrorState, Loading, PageHeader } from "../../components/ui";
import { useToast } from "../../contexts/ToastContext";
import { api } from "../../lib/api";
import { resolveMediaUrl, uploadImage } from "../../lib/media";

type StudyMaterial = {
  id: string;
  title: string;
  description?: string | null;
  exam?: string | null;
  imageUrl?: string | null;
  fileUrl: string;
  fileName: string;
  published: boolean;
  updatedAt: string;
  createdBy: { fullName: string };
};

type FormValues = {
  title: string;
  description: string;
  exam: string;
  published: boolean;
  file: File | null;
  cover: File | null;
};

const emptyForm: FormValues = {
  title: "",
  description: "",
  exam: "SSC JE",
  published: true,
  file: null,
  cover: null,
};

export function StudyMaterialsPage() {
  const queryClient = useQueryClient();
  const toast = useToast();
  const [editing, setEditing] = useState<StudyMaterial | null>(null);
  const [form, setForm] = useState<FormValues>(emptyForm);
  const materials = useQuery({
    queryKey: ["admin-study-materials"],
    queryFn: () => api.get<StudyMaterial[]>("/admin/materials").then((response) => response.data),
  });
  const reset = () => {
    setEditing(null);
    setForm(emptyForm);
  };
  const save = useMutation({
    mutationFn: async () => {
      let fileUrl = editing?.fileUrl;
      let fileName = editing?.fileName;
      let imageUrl = editing?.imageUrl;
      if (form.file) {
        const body = new FormData();
        body.append("file", form.file);
        const upload = await api.post<{ url: string; fileName: string }>("/admin/materials/upload", body, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        fileUrl = upload.data.url;
        fileName = upload.data.fileName;
      }
      if (form.cover) imageUrl = await uploadImage(form.cover);
      if (!fileUrl || !fileName) throw new Error("Choose a PDF file to upload");
      const payload = {
        title: form.title.trim(),
        description: form.description.trim() || undefined,
        exam: form.exam.trim() || undefined,
        imageUrl,
        published: form.published,
        fileUrl,
        fileName,
      };
      return editing
        ? api.put(`/admin/materials/${editing.id}`, payload)
        : api.post("/admin/materials", payload);
    },
    onSuccess: () => {
      toast.show(editing ? "Study material updated" : "Study material added");
      reset();
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials"] });
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const remove = useMutation({
    mutationFn: (id: string) => api.delete(`/admin/materials/${id}`),
    onSuccess: () => {
      toast.show("Study material removed");
      queryClient.invalidateQueries({ queryKey: ["admin-study-materials"] });
      queryClient.invalidateQueries({ queryKey: ["study-materials"] });
    },
    onError: (error) => toast.show(error.message, "error"),
  });
  const startEdit = (material: StudyMaterial) => {
    setEditing(material);
    setForm({
      title: material.title,
      description: material.description ?? "",
      exam: material.exam ?? "",
      published: material.published,
      file: null,
      cover: null,
    });
  };
  return (
    <>
      <PageHeader
        eyebrow="Student resource library"
        title="Book publisher"
        description="Publish a book cover, name, description and PDF for every student."
      />
      <form
        className="card mb-6 p-5"
        onSubmit={(event) => {
          event.preventDefault();
          if (form.title.trim() && (editing || form.file)) save.mutate();
        }}
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <label>
            <span className="label">Material title</span>
            <input className="input" value={form.title} maxLength={180} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="SSC JE Civil formula notes" />
          </label>
          <label>
            <span className="label">Exam / category</span>
            <input className="input" value={form.exam} maxLength={100} onChange={(event) => setForm({ ...form, exam: event.target.value })} placeholder="SSC JE or Scientific Assistant" />
          </label>
          <label className="lg:col-span-2">
            <span className="label">Description</span>
            <textarea className="input min-h-24 resize-y" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="What students will learn from this PDF" />
          </label>
          <label className="rounded-xl border border-dashed border-[#b8cbbf] bg-[#f7fbf8] p-4">
            <span className="flex items-center gap-2 text-sm font-extrabold text-forest"><ImagePlus className="h-5 w-5" /> Book cover image</span>
            <input className="mt-3 block w-full text-sm text-[#63736a]" type="file" accept="image/png,image/jpeg,image/gif,image/webp" onChange={(event) => setForm({ ...form, cover: event.target.files?.[0] ?? null })} />
            <p className="mt-2 text-xs text-[#718078]">PNG, JPG, GIF or WebP, up to 5 MB. {editing && (form.cover ? "New cover selected." : materialCoverText(editing))}</p>
          </label>
          <label className="rounded-xl border border-dashed border-[#b8cbbf] bg-[#f7fbf8] p-4">
            <span className="flex items-center gap-2 text-sm font-extrabold text-forest"><UploadCloud className="h-5 w-5" /> {editing ? "Replace PDF (optional)" : "PDF file"}</span>
            <input className="mt-3 block w-full text-sm text-[#63736a]" type="file" accept="application/pdf,.pdf" onChange={(event) => setForm({ ...form, file: event.target.files?.[0] ?? null })} />
            <p className="mt-2 text-xs text-[#718078]">PDF only, up to 1 GB. {editing && `Current file: ${editing.fileName}`}</p>
          </label>
          <label className="flex items-center gap-3 rounded-xl border border-[#e1e8e3] px-4 py-3 text-sm font-bold text-[#365246]">
            <input className="h-4 w-4 accent-[#173f35]" type="checkbox" checked={form.published} onChange={(event) => setForm({ ...form, published: event.target.checked })} />
            Publish for students now
          </label>
        </div>
        <div className="mt-5 flex flex-wrap gap-3">
          <button className="btn-primary" disabled={!form.title.trim() || (!editing && (!form.file || !form.cover)) || save.isPending}>
            {editing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {save.isPending ? "Saving..." : editing ? "Save changes" : "Publish book"}
          </button>
          {editing && <button className="btn-secondary" type="button" onClick={reset}>Cancel</button>}
        </div>
      </form>
      {materials.isLoading ? <Loading /> : materials.error ? <ErrorState error={materials.error} /> : materials.data?.length ? (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {materials.data.map((material) => (
            <article className="card flex min-h-[220px] flex-col p-5" key={material.id}>
              {material.imageUrl ? (
                <img className="mb-4 h-40 w-full rounded-xl border border-[#e1e8e3] bg-[#f7f9f7] object-contain" src={resolveMediaUrl(material.imageUrl)} alt={`${material.title} cover`} />
              ) : null}
              <div className="flex items-start justify-between gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest"><FileText className="h-5 w-5" /></span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${material.published ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>{material.published ? "Published" : "Draft"}</span>
              </div>
              <h2 className="mt-4 font-display font-extrabold text-ink">{material.title}</h2>
              <p className="mt-1 text-xs font-bold text-[#557366]">{material.exam || "General"}</p>
              <p className="mt-3 text-sm leading-5 text-[#6c7973]">{material.description || material.fileName}</p>
              <p className="mt-auto pt-4 text-xs text-[#7d8983]">Added by {material.createdBy.fullName}</p>
              <div className="mt-4 flex gap-2">
                <button className="btn-secondary flex-1 !px-3 !py-2" onClick={() => startEdit(material)}><Pencil className="h-4 w-4" /> Edit</button>
                <button className="btn-danger !px-3 !py-2" aria-label={`Delete ${material.title}`} onClick={() => remove.mutate(material.id)}><Trash2 className="h-4 w-4" /></button>
              </div>
            </article>
          ))}
        </div>
      ) : <Empty title="No books published" description="Add a cover image and PDF above, then publish it for students." />}
    </>
  );
}

function materialCoverText(material: StudyMaterial) {
  return material.imageUrl ? "Current cover will be kept unless you choose a replacement." : "Choose a cover image for this book.";
}
