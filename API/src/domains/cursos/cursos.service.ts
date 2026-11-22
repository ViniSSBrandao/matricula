import { listarTodosCursos } from "./cursos.repository";

export interface CursoDTO {
  id: number;
  nome: string;
  chPerfil: number;
  chLivres: number;
}

/**
 * Lista os cursos disponíveis no catálogo.
 */
export async function obterCursos(): Promise<{ items: CursoDTO[] }> {
  const cursos = await listarTodosCursos();
  return {
    items: cursos.map((curso) => ({
      id: curso.id,
      nome: curso.nome,
      chPerfil: curso.chPerfil,
      chLivres: curso.chLivres,
    })),
  };
}
