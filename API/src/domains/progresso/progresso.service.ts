import { StatusMatricula, TipoDisciplina } from "@prisma/client";
import { NotFoundError } from "../../utils/errors.utils";
import { calcularProgresso, ProgressoDTO } from "./progresso.domain";
import { buscarDadosProgressoAluno } from "./progresso.repository";

/**
 * Calcula e retorna o progresso curricular consolidado do aluno autenticado.
 */
export async function obterProgressoAluno(idAluno: number): Promise<ProgressoDTO> {
  const aluno = await buscarDadosProgressoAluno(idAluno);
  if (!aluno) {
    throw new NotFoundError("Aluno não encontrado.");
  }

  const mapaTipos = new Map<number, TipoDisciplina>();
  let chObrigatoriaTotal = 0;

  for (const vinculo of aluno.curso.disciplinas) {
    mapaTipos.set(vinculo.idDisciplina, vinculo.tipo);
    if (vinculo.tipo === TipoDisciplina.obrigatoria) {
      chObrigatoriaTotal += vinculo.disciplina.cargaHoraria;
    }
  }

  const aprovadas = aluno.matriculas
    .filter((m) => m.status === StatusMatricula.aprovado)
    .map((m) => ({
      idDisciplina: m.turma.disciplina.id,
      cargaHoraria: m.turma.disciplina.cargaHoraria,
      tipo: mapaTipos.get(m.turma.disciplina.id) ?? null,
    }));

  const cursando = aluno.matriculas
    .filter((m) => m.status === StatusMatricula.cursando)
    .map((m) => ({
      idDisciplina: m.turma.disciplina.id,
      cargaHoraria: m.turma.disciplina.cargaHoraria,
      tipo: mapaTipos.get(m.turma.disciplina.id) ?? null,
    }));

  return calcularProgresso({
    chObrigatoriaTotal,
    chPerfil: aluno.curso.chPerfil,
    chLivres: aluno.curso.chLivres,
    aprovadas,
    cursando,
  });
}
