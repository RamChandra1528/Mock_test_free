import { useEffect } from "react";
import { reportError } from "../lib/errors";

export function RuntimeErrorReporter() {
  useEffect(() => {
    const onError = (event: ErrorEvent) => {
      reportError(event.error ?? new Error(event.message), "runtime");
    };
    const onUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, "runtime");
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, []);
  return null;
}
