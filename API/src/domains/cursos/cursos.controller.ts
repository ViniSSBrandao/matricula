import { Request, Response } from "express";
import { obterCursos } from "./cursos.service";

/**
 * GET /cursos — lista cursos disponíveis para pré-cadastro e auto-cadastro.
 */
export async function getCursos(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await obterCursos());
}
