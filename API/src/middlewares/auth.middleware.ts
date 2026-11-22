import { NextFunction, Request, Response } from "express";
import { UsuarioAutenticadoPayload, verificarTokenJwt } from "../utils/jwt.utils";

export interface AuthenticatedRequest extends Request {
  usuario?: UsuarioAutenticadoPayload;
}

/**
 * Valida o cabeçalho Authorization Bearer e anexa os dados do usuário autenticado na requisição.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
): Response | void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({
      message: "Token de autenticação não informado.",
    });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return res.status(401).json({
      message: "Token de autenticação inválido.",
    });
  }

  try {
    req.usuario = verificarTokenJwt(token);
    return next();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Token inválido.";
    return res.status(401).json({ message: mensagem });
  }
}
