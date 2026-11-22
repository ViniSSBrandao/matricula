import { NextFunction, Request, Response } from "express";
import { ForbiddenError, UnauthorizedError } from "../utils/errors.utils";
import { PerfilJwt, UsuarioAutenticadoPayload, verificarTokenJwt } from "../utils/jwt.utils";

export interface AuthenticatedRequest extends Request {
  usuario?: UsuarioAutenticadoPayload;
}

/**
 * Valida o cabeçalho Authorization Bearer e anexa os dados do usuário autenticado na requisição.
 */
export function authMiddleware(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(new UnauthorizedError("Token de autenticação não informado."));
  }

  const token = authHeader.slice("Bearer ".length).trim();
  if (!token) {
    return next(new UnauthorizedError("Token de autenticação inválido."));
  }

  try {
    req.usuario = verificarTokenJwt(token);
    return next();
  } catch (erro) {
    const mensagem = erro instanceof Error ? erro.message : "Token inválido.";
    return next(new UnauthorizedError(mensagem));
  }
}

export const authenticate = authMiddleware;

/**
 * Restringe o acesso da rota aos perfis autorizados com base no payload do token JWT.
 */
export function authorize(...perfisPermitidos: PerfilJwt[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.usuario) {
      return next(new UnauthorizedError("Usuário não autenticado."));
    }

    if (!perfisPermitidos.includes(req.usuario.perfil)) {
      return next(new ForbiddenError("Você não tem permissão para acessar este recurso."));
    }

    return next();
  };
}
