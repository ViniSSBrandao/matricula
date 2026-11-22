import { Request, Response } from "express";
import { autenticarPorLogin, listarLoginsDisponiveis } from "./login.service";

/**
 * GET /logins (ou /auth/logins) — lista usuários disponíveis.
 */
export async function getLoginsDisponiveis(_req: Request, res: Response): Promise<void> {
  const logins = await listarLoginsDisponiveis();
  res.status(200).json({ logins });
}

/**
 * POST /login (ou /auth/login) — autentica apenas pelo campo login (sem senha).
 */
export async function postLogin(req: Request, res: Response): Promise<void> {
  const login = typeof req.body?.login === "string" ? req.body.login : "";
  const resultado = await autenticarPorLogin(login);
  res.status(200).json(resultado);
}
