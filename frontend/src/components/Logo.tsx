import { Layers3 } from "lucide-react";
import { Link } from "react-router-dom";
export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link
      to="/"
      className={`flex items-center gap-2.5 font-display text-lg font-extrabold tracking-tight ${light ? "text-white" : "text-ink"}`}
    >
      <span
        className={`grid h-9 w-9 place-items-center rounded-xl ${light ? "bg-lime text-forest" : "bg-forest text-white"}`}
      >
        <Layers3 className="h-5 w-5" />
      </span>
      MockMaster
    </Link>
  );
}
