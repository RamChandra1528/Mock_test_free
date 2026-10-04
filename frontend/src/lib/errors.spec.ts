import { describe, expect, it, vi } from "vitest";
import {
  AppError,
  apiErrorFromResponse,
  reportError,
  subscribeToErrors,
} from "./errors";

describe("application error handling", () => {
  it("preserves safe API metadata for visible and support-friendly errors", () => {
    const error = apiErrorFromResponse(
      {
        message: ["Email must be valid", "Password is required"],
        status: 400,
        code: "VALIDATION_FAILED",
        requestId: "request-123",
      },
      "Fallback",
      400,
    );

    expect(error).toBeInstanceOf(AppError);
    expect(error.message).toBe("Email must be valid, Password is required");
    expect(error.status).toBe(400);
    expect(error.code).toBe("VALIDATION_FAILED");
    expect(error.requestId).toBe("request-123");
  });

  it("reports an unhandled error once to registered visibility listeners", () => {
    const listener = vi.fn();
    const unsubscribe = subscribeToErrors(listener);
    const message = `Unhandled mutation ${Date.now()}`;

    reportError(new AppError(message), "mutation");
    reportError(new AppError(message), "mutation");

    expect(listener).toHaveBeenCalledTimes(1);
    expect(listener).toHaveBeenCalledWith(
      expect.objectContaining({ message }),
      "mutation",
    );
    unsubscribe();
  });
});
