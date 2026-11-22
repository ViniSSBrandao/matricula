import { Request, Response } from "express";
import { AuthenticatedRequest } from "../middlewares/auth.middleware";
import {
  autenticarPorLogin,
  listarLoginsDisponiveis,
  obterDashboardPorUsuario,
} from "../services/auth.service";
import { AppError } from "../utils/errors.utils";

function tratarErroController(res: Response, erro: unknown): Response {
  if (erro instanceof AppError) {
    return res.status(erro.statusCode).json({ message: erro.message });
  }
  console.error("Erro interno em auth.controller:", erro);
  return res.status(500).json({ message: "Erro interno do servidor." });
}

/**
 * GET /auth/logins — lista usuários disponíveis para facilitar login rápido em dev.
 */
export async function getLoginsDisponiveis(_req: Request, res: Response): Promise<Response> {
  try {
    const logins = await listarLoginsDisponiveis();
    return res.status(200).json({ logins });
  } catch (erro) {
    return tratarErroController(res, erro);
  }
}

/**
 * POST /auth/login — autentica apenas pelo campo login (sem senha).
 */
export async function postLogin(req: Request, res: Response): Promise<Response> {
  try {
    const login = typeof req.body?.login === "string" ? req.body.login : "";
    const resultado = await autenticarPorLogin(login);
    return res.status(200).json(resultado);
  } catch (erro) {
    return tratarErroController(res, erro);
  }
}

/**
 * GET /auth/me — retorna os dados do usuário autenticado e seu dashboard inicial.
 */
export async function getMe(req: AuthenticatedRequest, res: Response): Promise<Response> {
  try {
    if (!req.usuario) {
      return res.status(401).json({ message: "Usuário não autenticado." });
    }
    const dados = await obterDashboardPorUsuario(req.usuario.sub);
    return res.status(200).json(dados);
  } catch (erro) {
    return tratarErroController(res, erro);
  }
}
