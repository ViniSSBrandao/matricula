import { Request, Response } from "express";
import { parseSchema } from "../../utils/validation.utils";
import { criarProfessorBodySchema, listarProfessoresQuerySchema } from "./professores.schema";
import { cadastrarProfessor, obterProfessores } from "./professores.service";

/**
 * GET /professores — lista professores com paginação.
 */
export async function getProfessores(req: Request, res: Response): Promise<void> {
  const query = parseSchema(listarProfessoresQuerySchema, req.query);
  const resultado = await obterProfessores(query);
  res.status(200).json(resultado);
}

/**
 * POST /professores — cadastra um novo professor.
 */
export async function postProfessor(req: Request, res: Response): Promise<void> {
  const body = parseSchema(criarProfessorBodySchema, req.body);
  const professor = await cadastrarProfessor(body);
  res.status(201).location(`/professores/${professor.id}`).json(professor);
}
