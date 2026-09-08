import { Bold, Eye, ImagePlus, Italic, Sigma, Type } from "lucide-react";
import { useRef, useState } from "react";
import { useToast } from "../contexts/ToastContext";
import { uploadImage } from "../lib/media";
import { MarkdownContent } from "./MarkdownContent";

export function MarkdownEditor({
  value,
  onChange,
  placeholder = "Write the question…",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}) {
  const textarea = useRef<HTMLTextAreaElement>(null);
  const file = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState(false);
  const [uploading, setUploading] = useState(false);
  const toast = useToast();
  const wrap = (before: string, after = before, sample = "text") => {
    const node = textarea.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    const selected = value.slice(start, end) || sample;
    onChange(
      `${value.slice(0, start)}${before}${selected}${after}${value.slice(end)}`,
    );
    requestAnimationFrame(() => {
      node.focus();
      node.setSelectionRange(
        start + before.length,
        start + before.length + selected.length,
      );
    });
  };
  const addImage = async (next?: File) => {
    if (!next) return;
    setUploading(true);
    try {
      const url = await uploadImage(next);
      onChange(`${value}${value ? "\n\n" : ""}![Question image](${url})`);
      toast.show("Image added to the question");
    } catch (error) {
      toast.show((error as Error).message, "error");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };
  return (
    <div className="overflow-hidden rounded-xl border border-[#d9ded8] bg-white focus-within:border-forest focus-within:ring-4 focus-within:ring-[#173f3512]">
      <div className="flex flex-wrap items-center gap-1 border-b border-[#e6e9e3] bg-[#fafbf8] p-2">
        <Tool title="Bold" onClick={() => wrap("**")}>
          <Bold />
        </Tool>
        <Tool title="Italic" onClick={() => wrap("*")}>
          <Italic />
        </Tool>
        <Tool title="Inline math" onClick={() => wrap("$", "$", "x^2 + y^2")}>
          <Sigma />
        </Tool>
        <Tool
          title="Block math"
          onClick={() => wrap("$$\n", "\n$$", "\\frac{a}{b}")}
        >
          <Type />
        </Tool>
        <input
          ref={file}
          className="hidden"
          type="file"
          accept="image/png,image/jpeg,image/gif,image/webp"
          onChange={(event) => void addImage(event.target.files?.[0])}
        />
        <Tool
          title="Upload image"
          disabled={uploading}
          onClick={() => file.current?.click()}
        >
          <ImagePlus />
        </Tool>
        <button
          type="button"
          className={`ml-auto flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-extrabold ${preview ? "bg-forest text-white" : "hover:bg-[#edf0eb]"}`}
          onClick={() => setPreview(!preview)}
        >
          <Eye className="h-4 w-4" />
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="min-h-32 p-4">
          <MarkdownContent>
            {value || "*Nothing to preview yet.*"}
          </MarkdownContent>
        </div>
      ) : (
        <textarea
          ref={textarea}
          className="min-h-32 w-full resize-y border-0 p-4 text-sm outline-none"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
        />
      )}
    </div>
  );
}

function Tool({
  title,
  onClick,
  disabled,
  children,
}: {
  title: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      disabled={disabled}
      onClick={onClick}
      className="grid h-8 w-8 place-items-center rounded-lg hover:bg-[#e9ede7] [&>svg]:h-4 [&>svg]:w-4"
    >
      {children}
    </button>
  );
}
