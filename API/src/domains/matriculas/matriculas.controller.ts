import { Response } from "express";
import { AuthenticatedRequest } from "../../middlewares/auth.middleware";
import { UnauthorizedError } from "../../utils/errors.utils";
import { parseSchema } from "../../utils/validation.utils";
import { criarMatriculaBodySchema, matriculaIdParamSchema } from "./matriculas.schema";
import {
  cancelarMatriculaAluno,
  matricularAluno,
  obterMatriculasAtivas,
} from "./matriculas.service";

/**
 * POST /matriculas — matricula o aluno autenticado na turma informada.
 */
export async function postMatricula(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.usuario) {
    throw new UnauthorizedError("Usuário não autenticado.");
  }

  const { idTurma } = parseSchema(criarMatriculaBodySchema, req.body);
  const matricula = await matricularAluno(req.usuario.idPerfil, idTurma);

  res.status(201).location(`/matriculas/${matricula.id}`).json(matricula);
}

/**
 * GET /matriculas — lista as matrículas em curso do aluno autenticado.
 */
export async function getMatriculas(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.usuario) {
    throw new UnauthorizedError("Usuário não autenticado.");
  }

  const resposta = await obterMatriculasAtivas(req.usuario.idPerfil);
  res.status(200).json(resposta);
}

/**
 * DELETE /matriculas/:id — cancela logicamente uma matrícula ativa do aluno autenticado.
 */
export async function deleteMatricula(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.usuario) {
    throw new UnauthorizedError("Usuário não autenticado.");
  }

  const { id } = parseSchema(matriculaIdParamSchema, req.params);
  await cancelarMatriculaAluno(req.usuario.idPerfil, id);
  res.status(204).send();
}
