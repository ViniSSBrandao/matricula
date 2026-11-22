import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { UnauthorizedError } from "../../utils/errors.utils";
import { parseSchema } from "../../utils/validation.utils";
import { ofertasQuerySchema } from "./ofertas.schema";
import { listarOfertasParaAluno } from "./ofertas.service";

/**
 * GET /ofertas — lista turmas abertas com contexto curricular e horários para o aluno autenticado.
 */
export async function getOfertas(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.usuario) {
    throw new UnauthorizedError("Usuário não autenticado.");
  }

  const query = parseSchema(ofertasQuerySchema, req.query);
  const resposta = await listarOfertasParaAluno(req.usuario.idPerfil, query);
  res.status(200).json(resposta);
}
