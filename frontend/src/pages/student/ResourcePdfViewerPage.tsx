import { ArrowLeft, FileText } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ErrorState, Loading } from "../../components/ui";
import { api } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/media";

type StudyMaterial = {
  title: string;
  fileUrl: string;
};

export function ResourcePdfViewerPage() {
  const { id } = useParams();
  const material = useQuery({
    queryKey: ["study-material", id],
    queryFn: () => api.get<StudyMaterial>(`/student/materials/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  });
  if (material.isLoading) return <Loading label="Opening PDF viewer" />;
  if (material.error || !material.data) return <ErrorState error={material.error ?? new Error("Study material not found")} />;
  const pdfSource = resolveMediaUrl(material.data.fileUrl);
  return (
    <div className="flex min-h-[calc(100dvh-9rem)] flex-col">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow">Exam preparation library</p>
          <h1 className="mt-1 flex items-center gap-2 font-display text-2xl font-extrabold tracking-[-.035em] text-ink md:text-3xl">
            <FileText className="h-6 w-6 text-forest" /> {material.data.title}
          </h1>
        </div>
        <Link className="btn-secondary" to="/student/resources">
          <ArrowLeft className="h-4 w-4" /> Back to resources
        </Link>
      </div>
      <iframe
        className="min-h-[72dvh] w-full flex-1 rounded-2xl border border-[#dce4de] bg-white shadow-soft"
        src={pdfSource}
        title={`${material.data.title} PDF`}
      >
        <a className="btn-primary m-6" href={pdfSource}>
          Open the preparation pack
        </a>
      </iframe>
    </div>
  );
}
