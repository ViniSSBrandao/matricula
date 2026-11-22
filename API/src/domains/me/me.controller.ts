import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { UnauthorizedError } from "../../utils/errors.utils";
import { obterDashboardPorUsuario } from "./me.service";

/**
 * GET /me (ou /auth/me) — retorna os dados do usuário autenticado e seu dashboard inicial.
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.usuario) {
    throw new UnauthorizedError("Usuário não autenticado.");
  }

  const dados = await obterDashboardPorUsuario(req.usuario.sub);
  res.status(200).json(dados);
}
