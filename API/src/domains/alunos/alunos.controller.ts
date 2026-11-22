import { Request, Response } from "express";
import { parseSchema } from "../../utils/validation.utils";
import {
  alunoIdParamSchema,
  criarAlunoBodySchema,
  listarAlunosQuerySchema,
} from "./alunos.schema";
import { cadastrarAluno, desligarAluno, obterAlunos } from "./alunos.service";

/**
 * GET /alunos — lista alunos com paginação e busca.
 */
export async function getAlunos(req: Request, res: Response): Promise<void> {
  const query = parseSchema(listarAlunosQuerySchema, req.query);
  const resultado = await obterAlunos(query);
  res.status(200).json(resultado);
}

/**
 * POST /alunos — adiciona um novo aluno no pré-cadastro da secretaria.
 */
export async function postAluno(req: Request, res: Response): Promise<void> {
  const body = parseSchema(criarAlunoBodySchema, req.body);
  const aluno = await cadastrarAluno(body);
  res.status(201).location(`/alunos/${aluno.id}`).json(aluno);
}

/**
 * DELETE /alunos/:id — desliga um aluno sem matrículas vinculadas.
 */
export async function deleteAluno(req: Request, res: Response): Promise<void> {
  const { id } = parseSchema(alunoIdParamSchema, req.params);
  await desligarAluno(id);
  res.status(204).send();
}
