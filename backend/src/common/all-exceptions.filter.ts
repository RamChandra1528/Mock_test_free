import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Request, Response } from "express";
import { randomUUID } from "crypto";
import { RequestWithContext } from "./request-context.middleware";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
    const request = host.switchToHttp().getRequest<RequestWithContext>();
    const requestId = request.requestId ?? randomUUID();
    let status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;
    const body =
      exception instanceof HttpException ? exception.getResponse() : null;
    const rawMessage =
      typeof body === "string"
        ? body
        : (body as { message?: string | string[] } | null)?.message;
    const validationError = Array.isArray(rawMessage);
    let message =
      status === 500
        ? "An unexpected error occurred"
        : (Array.isArray(rawMessage) ? rawMessage.join(", ") : rawMessage ?? "Request failed");
    let code = validationError ? "VALIDATION_FAILED" : httpCode(status);

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        message = "A record with the same unique value already exists";
        code = "DUPLICATE_RECORD";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        message = "The requested record was not found";
        code = "RECORD_NOT_FOUND";
      } else if (exception.code === "P2003") {
        status = HttpStatus.CONFLICT;
        message = "This record is still referenced and cannot be changed";
        code = "REFERENCED_RECORD";
      }
    } else if (
      typeof exception === "object" &&
      exception !== null &&
      "code" in exception &&
      exception.code === "LIMIT_FILE_SIZE"
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = "The uploaded file exceeds the configured size limit";
      code = "FILE_TOO_LARGE";
    }

    if (status >= 500) {
      this.logger.error({
        requestId,
        method: request.method,
        path: request.originalUrl,
        exception: exception instanceof Error ? exception.stack : String(exception),
      });
    }

    response.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      status,
      code,
      requestId,
    });
  }
}

function httpCode(status: number) {
  if (status === HttpStatus.BAD_REQUEST) return "BAD_REQUEST";
  if (status === HttpStatus.UNAUTHORIZED) return "UNAUTHORIZED";
  if (status === HttpStatus.FORBIDDEN) return "FORBIDDEN";
  if (status === HttpStatus.NOT_FOUND) return "NOT_FOUND";
  if (status === HttpStatus.CONFLICT) return "CONFLICT";
  if (status === HttpStatus.TOO_MANY_REQUESTS) return "RATE_LIMITED";
  if (status === HttpStatus.PAYLOAD_TOO_LARGE) return "PAYLOAD_TOO_LARGE";
  return status >= 500 ? "INTERNAL_ERROR" : "REQUEST_FAILED";
}
