export type ErrorSource = "api" | "query" | "mutation" | "runtime" | "render";

export class AppError extends Error {
  readonly status?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly silent: boolean;

  constructor(
    message: string,
    options: {
      status?: number;
      code?: string;
      requestId?: string;
      silent?: boolean;
      cause?: unknown;
    } = {},
  ) {
    super(message, { cause: options.cause });
    this.name = "AppError";
    this.status = options.status;
    this.code = options.code;
    this.requestId = options.requestId;
    this.silent = options.silent ?? false;
  }
}

type ApiFailure = {
  message?: string | string[];
  status?: number;
  code?: string;
  requestId?: string;
};

const listeners = new Set<(error: AppError, source: ErrorSource) => void>();
const recentErrors = new Map<string, number>();

export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof Error)
    return new AppError(error.message || "Something went wrong", {
      cause: error,
    });
  return new AppError("Something went wrong", { cause: error });
}

export function errorMessage(error: unknown) {
  const appError = toAppError(error);
  return appError.requestId && appError.status && appError.status >= 500
    ? `${appError.message} Reference: ${appError.requestId}`
    : appError.message;
}

export function apiErrorFromResponse(
  failure: ApiFailure | undefined,
  fallback: string,
  status?: number,
  silent = false,
) {
  const message = Array.isArray(failure?.message)
    ? failure.message.join(", ")
    : failure?.message;
  return new AppError(message || fallback, {
    status: failure?.status ?? status,
    code: failure?.code,
    requestId: failure?.requestId,
    silent,
  });
}

export function subscribeToErrors(
  listener: (error: AppError, source: ErrorSource) => void,
) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function reportError(error: unknown, source: ErrorSource) {
  const original = toAppError(error);
  const appError =
    (source === "runtime" || source === "render") && !(error instanceof AppError)
      ? new AppError("Something unexpected went wrong. Please try again.", {
          cause: original,
        })
      : original;
  if (appError.silent) return appError;
  const fingerprint = [
    source,
    appError.status ?? "",
    appError.code ?? "",
    appError.message,
  ].join(":");
  const now = Date.now();
  if (now - (recentErrors.get(fingerprint) ?? 0) < 1_500) return appError;
  recentErrors.set(fingerprint, now);
  for (const listener of listeners) listener(appError, source);
  return appError;
}
