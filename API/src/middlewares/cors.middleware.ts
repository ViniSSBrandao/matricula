import { NextFunction, Request, Response } from "express";

/**
 * Configura cabeçalhos CORS para permitir chamadas do front-end configurado em CORS_ORIGIN.
 */
export function corsMiddleware(req: Request, res: Response, next: NextFunction): void {
  const origemPermitida = process.env.CORS_ORIGIN?.trim() || "http://localhost:3000";

  res.setHeader("Access-Control-Allow-Origin", origemPermitida);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    res.status(204).end();
    return;
  }

  next();
}
