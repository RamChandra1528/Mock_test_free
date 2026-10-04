import { Component, type ErrorInfo, type ReactNode } from "react";
import { reportError } from "../lib/errors";

type Props = { children: ReactNode };
type State = { error: Error | null };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    reportError(error, "render");
    if (import.meta.env.DEV)
      console.error("Unhandled render error", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="flex min-h-screen items-center justify-center bg-cream p-6">
        <section className="card w-full max-w-xl p-7 text-center" role="alert">
          <h1 className="font-display text-2xl font-extrabold text-ink">
            We could not display this page
          </h1>
          <p className="mt-3 text-sm leading-6 text-[#65726c]">
            Something unexpected went wrong. Your work is still saved where
            possible. Please try again or return home.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              className="btn-secondary"
              onClick={() => this.setState({ error: null })}
            >
              Try again
            </button>
            <button
              className="btn-primary"
              onClick={() => window.location.assign("/")}
            >
              Go to home
            </button>
          </div>
        </section>
      </main>
    );
  }
}
