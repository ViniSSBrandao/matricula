import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { UnauthorizedError } from "../../utils/errors.utils";
import { obterProgressoAluno } from "./progresso.service";

/**
 * GET /progresso — retorna o progresso curricular do aluno autenticado.
 */
export async function getProgresso(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.usuario) {
    throw new UnauthorizedError("Usuário não autenticado.");
  }

  const progresso = await obterProgressoAluno(req.usuario.idPerfil);
  res.status(200).json(progresso);
}
