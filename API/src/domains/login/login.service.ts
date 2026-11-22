import { BadRequestError, UnauthorizedError } from "../../utils/errors.utils";
import { gerarTokenJwt } from "../../utils/jwt.utils";
import { montarPerfilUsuario, PerfilUsuarioDTO } from "../../utils/perfil.utils";
import {
  buscarCadastroPorLogin,
  buscarTodosCadastrosComRelacoes,
} from "./login.repository";

export interface LoginDisponivelDTO {
  login: string;
  perfil: "aluno" | "professor" | "servidor";
  nome: string;
  detalhe: string;
  email: string;
}

/**
 * Lista todos os logins cadastrados para seleção rápida na interface.
 */
export async function listarLoginsDisponiveis(): Promise<LoginDisponivelDTO[]> {
  const cadastros = await buscarTodosCadastrosComRelacoes();

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
    throw new BadRequestError("Informe o nome de usuário (login).");
  }

  const cadastro = await buscarCadastroPorLogin(loginNormalizado);
  if (!cadastro) {
    throw new UnauthorizedError(`Login "${loginNormalizado}" não encontrado.`);
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
