import {
  BadRequestError,
  BusinessRuleError,
  ConflictError,
  UnauthorizedError,
} from "../../utils/errors.utils";
import { gerarTokenJwt } from "../../utils/jwt.utils";
import { montarPerfilUsuario, PerfilUsuarioDTO } from "../../utils/perfil.utils";
import {
  buscarAlunosPorNomeECurso,
  buscarCadastroPorLogin,
  buscarCadastroPorLoginOuEmail,
  buscarProfessorPorEmail,
  buscarTodosCadastrosComRelacoes,
  criarCadastroVinculado,
} from "./login.repository";
import { RegistrarCadastroBody } from "./login.schema";

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
export async function listarLoginsDisponiveis(): Promise<{ logins: LoginDisponivelDTO[] }> {
  const cadastros = await buscarTodosCadastrosComRelacoes();

  const logins = cadastros.map((cad) => {
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

  return { logins };
}

/**
 * Autentica um usuário apenas pelo login (sem senha) e emite um token JWT.
 */
export async function autenticarPorLogin(login: unknown): Promise<{
  token: string;
  usuario: PerfilUsuarioDTO;
}> {
  const loginNormalizado = typeof login === "string" ? login.trim() : "";
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

/**
 * Realiza o auto-cadastro de aluno ou professor, exigindo inserção prévia pela secretaria.
 */
export async function registrarConta(dados: RegistrarCadastroBody): Promise<{
  token: string;
  usuario: PerfilUsuarioDTO;
}> {
  let idAluno: number | undefined;
  let idProfessor: number | undefined;
  let emailCadastro: string;

  if (dados.perfil === "professor") {
    const professor = await buscarProfessorPorEmail(dados.email);
    if (!professor) {
      throw new BusinessRuleError(
        "Nenhum professor pré-cadastrado com este e-mail pela secretaria.",
        "CADASTRO_NAO_AUTORIZADO",
      );
    }
    if (professor.cadastro) {
      throw new ConflictError(
        "Este professor já possui uma conta cadastrada.",
        undefined,
        "CADASTRO_JA_EXISTE",
      );
    }
    idProfessor = professor.id;
    emailCadastro = professor.email;
  } else {
    const alunos = await buscarAlunosPorNomeECurso(dados.nome, dados.idCurso);
    if (alunos.length === 0) {
      throw new BusinessRuleError(
        "Aluno não encontrado no pré-cadastro da secretaria para este curso.",
        "CADASTRO_NAO_AUTORIZADO",
      );
    }
    const alunoDisponivel = alunos.find((item) => !item.cadastro);
    if (!alunoDisponivel) {
      throw new ConflictError(
        "Este aluno já possui uma conta cadastrada.",
        undefined,
        "CADASTRO_JA_EXISTE",
      );
    }
    idAluno = alunoDisponivel.id;
    emailCadastro = dados.email;
  }

  const conflito = await buscarCadastroPorLoginOuEmail(dados.login, emailCadastro);
  if (conflito) {
    if (conflito.login.toLowerCase() === dados.login.toLowerCase()) {
      throw new ConflictError(
        "Este nome de usuário (login) já está em uso.",
        undefined,
        "LOGIN_DUPLICADO",
      );
    }
    throw new ConflictError(
      "Este e-mail já está vinculado a outra conta.",
      undefined,
      "EMAIL_DUPLICADO",
    );
  }

  const cadastroCriado = await criarCadastroVinculado({
    login: dados.login,
    email: emailCadastro,
    idAluno,
    idProfessor,
  });

  const usuario = montarPerfilUsuario(cadastroCriado);
  const token = gerarTokenJwt({
    sub: usuario.idCadastro,
    login: usuario.login,
    perfil: usuario.perfil,
    idPerfil: usuario.idPerfil,
  });

  return { token, usuario };
}
