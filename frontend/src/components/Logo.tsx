import { Link } from "react-router-dom";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      aria-label="MockMaster home"
      className={`group flex items-center gap-2.5 font-display ${light ? "text-white" : "text-ink"}`}
    >
      <span
        aria-hidden="true"
        className={`grid h-10 w-10 shrink-0 place-items-center rounded-[14px] shadow-sm ring-1 transition group-hover:-translate-y-0.5 group-hover:shadow-md ${light ? "bg-white/10 text-white ring-white/20" : "bg-forest text-white ring-forest/10"}`}
      >
        <svg
          viewBox="0 0 48 48"
          className="h-7 w-7"
          fill="none"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="3"
        >
          <path d="M13 8h18a4 4 0 0 1 4 4v20a4 4 0 0 1-4 4H13a4 4 0 0 1-4-4V12a4 4 0 0 1 4-4Z" />
          <path d="M16 16h12M16 22h9" className="opacity-80" />
          <path d="m25 30 4 4 10-11" stroke="#c9ed71" strokeWidth="4" />
        </svg>
      </span>
      <span className="flex flex-col leading-none">
        <span className="text-[18px] font-extrabold tracking-[-0.04em]">
          Mock<span className={light ? "text-lime" : "text-forest"}>Master</span>
        </span>
        <span
          className={`mt-1 text-[8px] font-extrabold uppercase tracking-[0.18em] ${light ? "text-white/60" : "text-[#718078]"}`}
        >
          Practice platform
        </span>
      </span>
    </Link>
  );
}
