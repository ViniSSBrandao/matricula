import { apiEngine } from "@/engines/api.engine";
import {
  MatriculaItem,
  OfertaItem,
  RespostaGradeSemanal,
  RespostaMatriculas,
  RespostaPaginada,
  RespostaProgresso,
} from "@/types/aluno.types";

export interface ListarOfertasParams {
  page?: number;
  pageSize?: number;
  search?: string;
}

export async function listarOfertas(
  params: ListarOfertasParams = {},
): Promise<RespostaPaginada<OfertaItem>> {
  const query: Record<string, unknown> = {
    page: params.page ?? 1,
    pageSize: params.pageSize ?? 10,
  };

  if (params.search && params.search.trim().length > 0) {
    query.search = params.search.trim();
  }

  return apiEngine.semToast.get<RespostaPaginada<OfertaItem>>("/ofertas", {
    params: query,
  });
}

export async function listarTodasOfertas(search?: string): Promise<OfertaItem[]> {
  const primeiraPagina = await listarOfertas({
    page: 1,
    pageSize: 50,
    search,
  });

  if (primeiraPagina.totalPages <= 1) {
    return primeiraPagina.items;
  }

  const paginasRestantes = Array.from(
    { length: primeiraPagina.totalPages - 1 },
    (_, idx) =>
      listarOfertas({
        page: idx + 2,
        pageSize: 50,
        search,
      }),
  );

  const respostas = await Promise.all(paginasRestantes);
  return [
    ...primeiraPagina.items,
    ...respostas.flatMap((resposta) => resposta.items),
  ];
}

export async function realizarMatricula(idTurma: number): Promise<MatriculaItem> {
  return apiEngine.semToast.post<MatriculaItem>("/matriculas", { idTurma });
}

export async function listarMatriculas(): Promise<RespostaMatriculas> {
  return apiEngine.semToast.get<RespostaMatriculas>("/matriculas");
}

export async function cancelarMatricula(idMatricula: number): Promise<void> {
  await apiEngine.semToast.delete<void>(`/matriculas/${idMatricula}`);
}

export async function buscarProgresso(): Promise<RespostaProgresso> {
  return apiEngine.semToast.get<RespostaProgresso>("/progresso");
}

export async function buscarGradeSemanal(): Promise<RespostaGradeSemanal> {
  return apiEngine.semToast.get<RespostaGradeSemanal>("/matriculas/grade");
}

export const alunoService = {
  listarOfertas,
  listarTodasOfertas,
  realizarMatricula,
  listarMatriculas,
  cancelarMatricula,
  buscarProgresso,
  buscarGradeSemanal,
};
