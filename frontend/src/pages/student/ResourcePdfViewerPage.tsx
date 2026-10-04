import { ArrowLeft, FileText, Maximize2, Minimize2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { ErrorState, Loading } from "../../components/ui";
import { api } from "../../lib/api";
import { resolveMediaUrl } from "../../lib/media";

type StudyMaterial = {
  title: string;
  fileUrl: string;
};

export function ResourcePdfViewerPage() {
  const { id } = useParams();
  const viewerRef = useRef<HTMLElement>(null);
  const [nativeFullscreen, setNativeFullscreen] = useState(false);
  const [fallbackFullscreen, setFallbackFullscreen] = useState(false);
  const material = useQuery({
    queryKey: ["study-material", id],
    queryFn: () => api.get<StudyMaterial>(`/student/materials/${id}`).then((response) => response.data),
    enabled: Boolean(id),
  });
  const isFullscreen = nativeFullscreen || fallbackFullscreen;

  useEffect(() => {
    const syncFullscreen = () =>
      setNativeFullscreen(document.fullscreenElement === viewerRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    const closeFallbackOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && fallbackFullscreen)
        setFallbackFullscreen(false);
    };
    document.addEventListener("keydown", closeFallbackOnEscape);
    return () => document.removeEventListener("keydown", closeFallbackOnEscape);
  }, [fallbackFullscreen]);

  const toggleFullscreen = async () => {
    if (nativeFullscreen) {
      await document.exitFullscreen();
      return;
    }
    if (fallbackFullscreen) {
      setFallbackFullscreen(false);
      return;
    }
    try {
      if (!viewerRef.current?.requestFullscreen)
        throw new Error("Fullscreen is unavailable");
      await viewerRef.current.requestFullscreen();
    } catch {
      // Some embedded browsers do not expose the native Fullscreen API.
      // Keep the reader just as usable with an in-page full-screen view.
      setFallbackFullscreen(true);
    }
  };

  if (material.isLoading) return <Loading label="Opening PDF viewer" />;
  if (material.error || !material.data)
    return (
      <ErrorState
        error={material.error ?? new Error("Study material not found")}
      />
    );
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
        <div className="flex items-center gap-2">
          <button
            className="btn-secondary"
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label="Open PDF viewer in full screen"
          >
            <Maximize2 className="h-4 w-4" /> Full screen
          </button>
          <Link className="btn-secondary" to="/student/resources">
            <ArrowLeft className="h-4 w-4" /> Back to resources
          </Link>
        </div>
      </div>
      <section
        ref={viewerRef}
        className={`relative flex min-h-[72dvh] flex-1 flex-col bg-cream ${fallbackFullscreen ? "fixed inset-0 z-50 min-h-0 p-4" : ""}`}
      >
        {isFullscreen && (
          <button
            className="btn-secondary absolute right-6 top-6 z-10 shadow-lg"
            type="button"
            onClick={() => void toggleFullscreen()}
            aria-label="Exit full screen PDF viewer"
          >
            <Minimize2 className="h-4 w-4" /> Exit full screen
          </button>
        )}
        <iframe
          className={`min-h-0 w-full flex-1 border border-[#dce4de] bg-white shadow-soft ${isFullscreen ? "rounded-none" : "rounded-2xl"}`}
          src={pdfSource}
          title={`${material.data.title} PDF`}
        >
          <a className="btn-primary m-6" href={pdfSource}>
            Open the preparation pack
          </a>
        </iframe>
      </section>
    </div>
  );
}
