import { Request, Response } from "express";
import { tratarErroController } from "../../utils/errors.utils";
import { autenticarPorLogin, listarLoginsDisponiveis } from "./login.service";

/**
 * GET /logins (ou /auth/logins) — lista usuários disponíveis para facilitar login rápido.
 */
export async function getLoginsDisponiveis(_req: Request, res: Response): Promise<Response> {
  try {
    const logins = await listarLoginsDisponiveis();
    return res.status(200).json({ logins });
  } catch (erro) {
    return tratarErroController(res, erro, "login.controller");
  }
}

/**
 * POST /login (ou /auth/login) — autentica apenas pelo campo login (sem senha).
 */
export async function postLogin(req: Request, res: Response): Promise<Response> {
  try {
    const login = typeof req.body?.login === "string" ? req.body.login : "";
    const resultado = await autenticarPorLogin(login);
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErroController(res, erro, "login.controller");
  }
}
