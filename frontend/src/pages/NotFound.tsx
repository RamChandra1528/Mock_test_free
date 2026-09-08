import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";
export function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-cream p-6 text-center">
      <div>
        <span className="font-display text-8xl font-extrabold text-mint">
          404
        </span>
        <h1 className="mt-2 font-display text-3xl font-extrabold">
          This page took a wrong turn.
        </h1>
        <p className="mt-3 text-[#6b7972]">
          The page you’re looking for doesn’t exist or has moved.
        </p>
        <Link to="/" className="btn-primary mt-7">
          <ArrowLeft className="h-4 w-4" />
          Back to home
        </Link>
      </div>
    </main>
  );
}
