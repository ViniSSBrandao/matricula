import prisma from "../../lib/prisma";
import { AppError } from "../../utils/errors.utils";
import { gerarTokenJwt } from "../../utils/jwt.utils";
import { montarPerfilUsuario, PerfilUsuarioDTO } from "../../utils/perfil.utils";

export interface LoginDisponivelDTO {
  login: string;
  perfil: "aluno" | "professor" | "servidor";
  nome: string;
  detalhe: string;
  email: string;
}

/**
 * Lista todos os logins cadastrados para facilitar a seleção rápida na interface de teste.
 */
export async function listarLoginsDisponiveis(): Promise<LoginDisponivelDTO[]> {
  const cadastros = await prisma.cadastro.findMany({
    include: {
      aluno: { include: { curso: true } },
      professor: true,
      servidor: true,
    },
    orderBy: { id: "asc" },
  });

  return cadastros.map((cad) => {
    const perfil = montarPerfilUsuario(cad);
    const detalhe =
      perfil.curso?.nome ?? perfil.titulacao ?? "Secretaria Acadêmica";

    return {
      login: perfil.login,
      perfil: perfil.perfil,
      nome: perfil.nome,
      detalhe,
      email: perfil.email,
    };
  });
}

/**
 * Autentica um usuário apenas pelo login (sem senha) e emite um token JWT.
 */
export async function autenticarPorLogin(login: string): Promise<{
  token: string;
  usuario: PerfilUsuarioDTO;
}> {
  const loginNormalizado = login.trim();
  if (!loginNormalizado) {
    throw new AppError("Informe o nome de usuário (login).", 400);
  }

  const cadastro = await prisma.cadastro.findUnique({
    where: { login: loginNormalizado },
    include: {
      aluno: { include: { curso: true } },
      professor: true,
      servidor: true,
    },
  });

  if (!cadastro) {
    throw new AppError(`Login "${loginNormalizado}" não encontrado.`, 401);
  }

  const usuario = montarPerfilUsuario(cadastro);
  const token = gerarTokenJwt({
    sub: usuario.idCadastro,
    login: usuario.login,
    perfil: usuario.perfil,
    idPerfil: usuario.idPerfil,
  });

  return { token, usuario };
}
