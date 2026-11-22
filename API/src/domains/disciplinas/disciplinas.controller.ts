import { Request, Response } from "express";
import { parseSchema } from "../../utils/validation.utils";
import {
  disciplinaBodySchema,
  disciplinaIdParamSchema,
  listarDisciplinasQuerySchema,
} from "./disciplinas.schema";
import {
  cadastrarDisciplina,
  editarDisciplina,
  obterDisciplinas,
} from "./disciplinas.service";

/**
 * GET /disciplinas — lista disciplinas com paginação e busca opcional.
 */
export async function getDisciplinas(req: Request, res: Response): Promise<void> {
  const query = parseSchema(listarDisciplinasQuerySchema, req.query);
  const resultado = await obterDisciplinas(query);
  res.status(200).json(resultado);
}

/**
 * POST /disciplinas — cria uma nova disciplina.
 */
export async function postDisciplina(req: Request, res: Response): Promise<void> {
  const body = parseSchema(disciplinaBodySchema, req.body);
  const disciplina = await cadastrarDisciplina(body);
  res.status(201).location(`/disciplinas/${disciplina.id}`).json(disciplina);
}

/**
 * PUT /disciplinas/:id — atualiza os dados de uma disciplina existente.
 */
export async function putDisciplina(req: Request, res: Response): Promise<void> {
  const { id } = parseSchema(disciplinaIdParamSchema, req.params);
  const body = parseSchema(disciplinaBodySchema, req.body);
  const disciplina = await editarDisciplina(id, body);
  res.status(200).json(disciplina);
}
