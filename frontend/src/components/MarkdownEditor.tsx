import {
  Bold,
  ChevronDown,
  Eye,
  ImagePlus,
  Italic,
  Sigma,
  Type,
} from "lucide-react";
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
  const [symbolsOpen, setSymbolsOpen] = useState(false);
  const latestValue = useRef(value);
  latestValue.current = value;
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
  const insert = (text: string, selection?: [number, number]) => {
    const node = textarea.current;
    if (!node) return;
    const start = node.selectionStart;
    const end = node.selectionEnd;
    onChange(`${value.slice(0, start)}${text}${value.slice(end)}`);
    requestAnimationFrame(() => {
      node.focus();
      const [from, to] = selection ?? [text.length, text.length];
      node.setSelectionRange(start + from, start + to);
    });
  };
  const addImage = async (
    next?: File,
    range?: [number, number],
    pasted = false,
  ) => {
    if (!next) return;
    setUploading(true);
    try {
      const url = await uploadImage(next);
      const current = latestValue.current;
      const [start, end] = range ?? [current.length, current.length];
      const before = current.slice(0, start);
      const after = current.slice(end);
      const leadingBreak = before && !before.endsWith("\n") ? "\n\n" : "";
      const trailingBreak = after && !after.startsWith("\n") ? "\n\n" : "";
      const image = `![${pasted ? "Pasted question image" : "Question image"}](${url})`;
      onChange(`${before}${leadingBreak}${image}${trailingBreak}${after}`);
      toast.show(pasted ? "Pasted image added to the question" : "Image added to the question");
    } catch (error) {
      toast.show((error as Error).message, "error");
    } finally {
      setUploading(false);
      if (file.current) file.current.value = "";
    }
  };
  const pasteImage = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const image = Array.from(event.clipboardData.items)
      .find((item) => item.kind === "file" && item.type.startsWith("image/"))
      ?.getAsFile();
    if (!image) return;
    event.preventDefault();
    const node = event.currentTarget;
    void addImage(image, [node.selectionStart, node.selectionEnd], true);
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
        <button
          type="button"
          title="Math symbols"
          aria-label="Math symbols"
          aria-expanded={symbolsOpen}
          className={`flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-extrabold ${symbolsOpen ? "bg-mint text-forest" : "hover:bg-[#e9ede7]"}`}
          onClick={() => setSymbolsOpen((open) => !open)}
        >
          <Sigma className="h-4 w-4" />
          Symbols
          <ChevronDown
            className={`h-3.5 w-3.5 transition ${symbolsOpen ? "rotate-180" : ""}`}
          />
        </button>
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
      {symbolsOpen && (
        <div className="grid gap-3 border-b border-[#e6e9e3] bg-[#f7f9f5] p-3 sm:grid-cols-2">
          {mathSymbolGroups.map((group) => (
            <div key={group.label}>
              <p className="mb-1.5 text-[10px] font-extrabold uppercase tracking-wider text-[#68766f]">
                {group.label}
              </p>
              <div className="flex flex-wrap gap-1.5">
                {group.items.map((item) => (
                  <button
                    type="button"
                    key={item.label}
                    title={item.title}
                    className="rounded-md border border-[#d9ded8] bg-white px-2 py-1 font-mono text-xs font-bold text-[#24362e] hover:border-forest hover:bg-mint"
                    onClick={() => insert(item.value, item.selection)}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <p className="text-xs text-[#68766f] sm:col-span-2">
            Click a symbol to insert it at the cursor. Use the $ or $$ tools to
            render LaTex formulas.
          </p>
        </div>
      )}
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
          onPaste={pasteImage}
          placeholder={placeholder}
        />
      )}
      {!preview && (
        <p className="border-t border-[#eef0eb] bg-[#fafbf8] px-4 py-2 text-xs font-semibold text-[#718078]">
          Tip: paste an image or screenshot here with Ctrl+V to add it to the question.
        </p>
      )}
    </div>
  );
}

type MathSymbol = {
  label: string;
  title: string;
  value: string;
  selection?: [number, number];
};

const mathSymbolGroups: { label: string; items: MathSymbol[] }[] = [
  {
    label: "Arithmetic & comparison",
    items: [
      ["+", "Plus"],
      ["−", "Minus"],
      ["×", "Multiply"],
      ["÷", "Divide"],
      ["=", "Equals"],
      ["≠", "Not equal"],
      ["<", "Less than"],
      [">", "Greater than"],
      ["≤", "Less than or equal"],
      ["≥", "Greater than or equal"],
      ["±", "Plus or minus"],
      ["≈", "Approximately equal"],
      ["≡", "Identical to"],
      ["∝", "Proportional to"],
      ["%", "Percent"],
    ].map(([label, title]) => ({ label, title, value: label })),
  },
  {
    label: "Geometry & sets",
    items: [
      ["π", "Pi"],
      ["√", "Square root"],
      ["∞", "Infinity"],
      ["α", "Alpha"],
      ["β", "Beta"],
      ["θ", "Theta"],
      ["λ", "Lambda"],
      ["Δ", "Delta"],
      ["∠", "Angle"],
      ["°", "Degree"],
      ["∆", "Delta"],
      ["∈", "Belongs to"],
      ["∉", "Does not belong to"],
      ["∪", "Union"],
      ["∩", "Intersection"],
      ["⊂", "Subset"],
      ["⊆", "Subset or equal"],
      ["∥", "Parallel"],
      ["⊥", "Perpendicular"],
      ["→", "Right arrow"],
      ["⇒", "Implies"],
      ["⇔", "If and only if"],
      ["∴", "Therefore"],
    ].map(([label, title]) => ({ label, title, value: label })),
  },
  {
    label: "Formula templates",
    items: [
      { label: "a⁄b", title: "Fraction", value: "\\frac{a}{b}", selection: [6, 7] },
      { label: "√x", title: "Square root formula", value: "\\sqrt{x}", selection: [6, 7] },
      { label: "x²", title: "Power", value: "x^{2}", selection: [3, 4] },
      { label: "xᵢ", title: "Subscript", value: "x_{i}", selection: [3, 4] },
      { label: "Σ", title: "Summation", value: "\\sum_{i=1}^{n}", selection: [6, 9] },
      { label: "∏", title: "Product", value: "\\prod_{i=1}^{n}", selection: [7, 10] },
      { label: "∫", title: "Integral", value: "\\int_{a}^{b}", selection: [6, 7] },
      { label: "sin", title: "Sine", value: "\\sin(", selection: [5, 5] },
      { label: "log", title: "Logarithm", value: "\\log_{b}(", selection: [6, 7] },
    ],
  },
];

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
