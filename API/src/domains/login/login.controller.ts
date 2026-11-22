import { Request, Response } from "express";
import { autenticarPorLogin, listarLoginsDisponiveis } from "./login.service";

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
