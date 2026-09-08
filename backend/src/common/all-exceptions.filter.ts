import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse<Response>();
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
    let message =
      status === 500
        ? "An unexpected error occurred"
        : (rawMessage ?? "Request failed");

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      if (exception.code === "P2002") {
        status = HttpStatus.CONFLICT;
        message = "A record with the same unique value already exists";
      } else if (exception.code === "P2025") {
        status = HttpStatus.NOT_FOUND;
        message = "The requested record was not found";
      } else if (exception.code === "P2003") {
        status = HttpStatus.CONFLICT;
        message = "This record is still referenced and cannot be changed";
      }
    } else if (
      typeof exception === "object" &&
      exception !== null &&
      "code" in exception &&
      exception.code === "LIMIT_FILE_SIZE"
    ) {
      status = HttpStatus.PAYLOAD_TOO_LARGE;
      message = "The uploaded file exceeds the configured size limit";
    }

    if (status >= 500) {
      this.logger.error(
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    response.status(status).json({
      success: false,
      message,
      timestamp: new Date().toISOString(),
      status,
    });
  }
}
