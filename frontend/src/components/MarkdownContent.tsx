import ReactMarkdown from "react-markdown";
import rehypeKatex from "rehype-katex";
import remarkMath from "remark-math";
import { resolveMediaUrl } from "../lib/media";

export function MarkdownContent({
  children,
  className = "",
}: {
  children: string;
  className?: string;
}) {
  return (
    <div className={`prose-content ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
          img: ({ src, alt }) => (
            <img
              src={resolveMediaUrl(src ?? "")}
              alt={alt ?? "Question content"}
              className="my-4 max-h-80 rounded-xl object-contain"
            />
          ),
          a: ({ href, children: label }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className="font-bold text-forest underline"
            >
              {label}
            </a>
          ),
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
