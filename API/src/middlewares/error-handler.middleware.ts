import { NextFunction, Request, Response } from "express";
import { normalizarErroParaHttp } from "../utils/error-mapper.utils";

/**
 * Middleware global genérico de tratamento de erros do Express.
 */
export function errorHandlerMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  const httpError = normalizarErroParaHttp(err);

  if (httpError.statusCode >= 500) {
    console.error(`[ERROR] ${req.method} ${req.originalUrl}:`, err);
  }

  res.status(httpError.statusCode).json({
    message: httpError.message,
    code: httpError.code,
    ...(httpError.details !== undefined ? { details: httpError.details } : {}),
  });
}
