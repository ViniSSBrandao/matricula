import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { tratarErroController } from "../../utils/errors.utils";
import { obterDashboardPorUsuario } from "./me.service";

/**
 * GET /me (ou /auth/me) — retorna os dados do usuário autenticado e seu dashboard inicial.
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    if (!req.usuario) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }
    const dados = await obterDashboardPorUsuario(req.usuario.sub);
    return res.status(200).json(dados);
  } catch (erro) {
    return tratarErroController(res, erro, "me.controller");
  }
}
