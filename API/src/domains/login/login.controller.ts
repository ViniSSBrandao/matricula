import { Request, Response } from "express";
import { parseSchema } from "../../utils/validation.utils";
import { registrarCadastroBodySchema } from "./login.schema";
import {
  autenticarPorLogin,
  listarLoginsDisponiveis,
  registrarConta,
} from "./login.service";

/**
 * GET /logins (ou /auth/logins) — lista usuários disponíveis.
 */
export async function getLoginsDisponiveis(_req: Request, res: Response): Promise<void> {
  res.status(200).json(await listarLoginsDisponiveis());
}

/**
 * POST /login (ou /auth/login) — autentica apenas pelo campo login (sem senha).
 */
export async function postLogin(req: Request, res: Response): Promise<void> {
  res.status(200).json(await autenticarPorLogin(req.body?.login));
}

/**
 * POST /register (ou /auth/register) — cria conta para aluno ou professor pré-cadastrado.
 */
export async function postRegister(req: Request, res: Response): Promise<void> {
  const body = parseSchema(registrarCadastroBodySchema, req.body);
  res.status(201).json(await registrarConta(body));
}
