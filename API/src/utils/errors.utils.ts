import { Response } from "express";

/**
 * Erro de aplicação com código HTTP associado para tratamento padronizado nos controllers.
 */
export class AppError extends Error {
  public readonly statusCode: number;

  constructor(message: string, statusCode = 400) {
    super(message);
    this.name = "AppError";
    this.statusCode = statusCode;
  }
}

/**
 * Converte AppError ou erros inesperados em respostas HTTP JSON padronizadas.
 */
export function tratarErroController(
  res: Response,
  erro: unknown,
  contexto: string,
): Response {
  if (erro instanceof AppError) {
    return res.status(erro.statusCode).json({ message: erro.message });
  }
  console.error(`Erro interno em ${contexto}:`, erro);
  return res.status(500).json({ message: "Erro interno do servidor." });
}
