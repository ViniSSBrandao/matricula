import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { obterDashboardPorUsuario } from "./me.service";

/**
 * GET /me (ou /auth/me) — retorna os dados do usuário autenticado e seu dashboard inicial.
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<void> {
  res.status(200).json(await obterDashboardPorUsuario(req.usuario?.sub));
}
