import { AlertCircle, Inbox, LoaderCircle, X } from "lucide-react";
import type { ReactNode } from "react";
import { useEffect, useId, useRef } from "react";

export function Badge({
  children,
  tone = "neutral",
}: {
  children: ReactNode;
  tone?: "neutral" | "green" | "amber" | "red" | "purple";
}) {
  const styles = {
    neutral: "bg-[#eff1ed] text-[#52625b]",
    green: "bg-emerald-50 text-emerald-700",
    amber: "bg-amber-50 text-amber-700",
    red: "bg-rose-50 text-rose-700",
    purple: "bg-violet-50 text-violet-700",
  };
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-extrabold uppercase tracking-wide ${styles[tone]}`}
    >
      {children}
    </span>
  );
}
export function StatCard({
  label,
  value,
  icon,
  note,
}: {
  label: string;
  value: ReactNode;
  icon: ReactNode;
  note?: string;
}) {
  return (
    <div className="card p-5">
      <div className="mb-5 flex items-start justify-between">
        <span className="text-sm font-semibold text-[#738078]">{label}</span>
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-mint text-forest">
          {icon}
        </span>
      </div>
      <div className="font-display text-3xl font-extrabold tracking-tight">
        {value}
      </div>
      {note && <p className="mt-1 text-xs text-[#829087]">{note}</p>}
    </div>
  );
}
export function Loading({ label = "Loading" }: { label?: string }) {
  return (
    <div className="flex min-h-[280px] items-center justify-center gap-3 text-sm font-bold text-[#6b7a72]">
      <LoaderCircle className="h-5 w-5 animate-spin text-forest" />
      {label}
    </div>
  );
}
export function Empty({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="card flex min-h-[280px] flex-col items-center justify-center px-6 text-center">
      <span className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-mint text-forest">
        <Inbox />
      </span>
      <h3 className="font-display text-lg font-bold">{title}</h3>
      <p className="mt-2 max-w-md text-sm text-[#708078]">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}
export function ErrorState({ error }: { error: unknown }) {
  return (
    <div className="card flex min-h-[220px] items-center justify-center gap-3 border-rose-100 bg-rose-50/40 p-6 text-rose-800">
      <AlertCircle />
      <p className="font-semibold">
        {error instanceof Error ? error.message : "Unable to load this page"}
      </p>
    </div>
  );
}
export function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  wide = false,
  scrollable = false,
  fullScreen = false,
}: {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  wide?: boolean;
  scrollable?: boolean;
  fullScreen?: boolean;
}) {
  const constrained = scrollable || fullScreen;
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement as HTMLElement | null;
    const priorOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusable = () => [
      ...(dialog.current?.querySelectorAll<HTMLElement>(
        'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
      ) ?? []),
    ];
    window.setTimeout(() => focusable()[0]?.focus(), 0);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") onCloseRef.current();
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = priorOverflow;
      previous?.focus();
    };
  }, [open]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-[#0d211bd1] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialog}
        className={`w-full rounded-2xl bg-white shadow-2xl ${constrained ? "flex max-h-[calc(100dvh-2rem)] flex-col" : ""} ${fullScreen ? "h-[calc(100dvh-2rem)] max-w-none" : wide ? "max-w-4xl" : "max-w-lg"}`}
      >
        <div className="flex shrink-0 items-center justify-between border-b border-[#ecece6] px-6 py-5">
          <h2 id={titleId} className="font-display text-xl font-bold">
            {title}
          </h2>
          <button
            aria-label="Close"
            className="rounded-lg p-1 hover:bg-[#f1f2ed]"
            onClick={onClose}
          >
            <X />
          </button>
        </div>
        <div
          className={
            constrained
              ? "min-h-0 flex-1 overflow-y-auto overscroll-contain p-6"
              : "p-6"
          }
        >
          {children}
        </div>
        {footer && (
          <div className="shrink-0 flex justify-end gap-3 border-t border-[#ecece6] px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
      <div>
        {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
        <h1 className="page-title">{title}</h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-[#6c7973]">{description}</p>
        )}
      </div>
      {action}
    </div>
  );
}

export function Pagination({
  page,
  pages,
  onChange,
}: {
  page: number;
  pages: number;
  onChange: (page: number) => void;
}) {
  if (pages <= 1) return null;
  const visible = Array.from({ length: pages }, (_, index) => index + 1).filter(
    (value) => value === 1 || value === pages || Math.abs(value - page) <= 1,
  );
  return (
    <nav
      className="mt-5 flex items-center justify-center gap-2"
      aria-label="Pagination"
    >
      <button
        className="btn-secondary !px-3 !py-2"
        disabled={page === 1}
        onClick={() => onChange(page - 1)}
      >
        Previous
      </button>
      {visible.map((value, index) => (
        <span className="contents" key={value}>
          {index > 0 && value - visible[index - 1] > 1 && (
            <span className="px-1 text-[#8a958f]">…</span>
          )}
          <button
            aria-current={value === page ? "page" : undefined}
            className={`grid h-9 w-9 place-items-center rounded-lg text-xs font-extrabold ${value === page ? "bg-forest text-white" : "border border-[#dde1da] bg-white"}`}
            onClick={() => onChange(value)}
          >
            {value}
          </button>
        </span>
      ))}
      <button
        className="btn-secondary !px-3 !py-2"
        disabled={page === pages}
        onClick={() => onChange(page + 1)}
      >
        Next
      </button>
    </nav>
  );
}
