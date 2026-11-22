import { Request, Response } from "express";
import { parseSchema } from "../../utils/validation.utils";
import {
  atualizarVagasBodySchema,
  criarTurmaBodySchema,
  listarTurmasQuerySchema,
  turmaIdParamSchema,
} from "./turmas.schema";
import { atualizarVagasTurma, cadastrarTurma, obterTurmas } from "./turmas.service";

/**
 * GET /turmas — lista turmas com vagas totais, ocupadas, disciplina, professor e horários.
 */
export async function getTurmas(req: Request, res: Response): Promise<void> {
  const query = parseSchema(listarTurmasQuerySchema, req.query);
  const resultado = await obterTurmas(query);
  res.status(200).json(resultado);
}

/**
 * POST /turmas — cria uma nova turma com horários opcionais.
 */
export async function postTurma(req: Request, res: Response): Promise<void> {
  const body = parseSchema(criarTurmaBodySchema, req.body);
  const turma = await cadastrarTurma(body);
  res.status(201).location(`/turmas/${turma.id}`).json(turma);
}

/**
 * PATCH /turmas/:id/vagas — atualiza a quantidade de vagas de uma turma.
 */
export async function patchVagasTurma(req: Request, res: Response): Promise<void> {
  const { id } = parseSchema(turmaIdParamSchema, req.params);
  const { vagas } = parseSchema(atualizarVagasBodySchema, req.body);
  const turma = await atualizarVagasTurma(id, vagas);
  res.status(200).json(turma);
}
