import { Injectable, NestMiddleware } from "@nestjs/common";
import { randomUUID } from "crypto";
import type { NextFunction, Request, Response } from "express";

export type RequestWithContext = Request & { requestId?: string };

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(request: RequestWithContext, response: Response, next: NextFunction) {
    const suppliedId = request.header("x-request-id");
    const requestId =
      suppliedId && suppliedId.length <= 128 ? suppliedId : randomUUID();
    request.requestId = requestId;
    response.setHeader("X-Request-Id", requestId);
    next();
  }
}
