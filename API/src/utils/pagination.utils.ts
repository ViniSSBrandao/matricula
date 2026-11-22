import { z } from "zod";

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({ error: "Página deve ser um número inteiro." })
    .int("Página deve ser um número inteiro.")
    .min(1, "Página mínima é 1.")
    .default(1),
  pageSize: z.coerce
    .number({ error: "Tamanho da página deve ser um número inteiro." })
    .int("Tamanho da página deve ser um número inteiro.")
    .min(1, "Tamanho da página mínimo é 1.")
    .max(50, "Tamanho da página máximo é 50.")
    .default(10),
  search: z.preprocess((valor) => {
    if (typeof valor !== "string") {
      return undefined;
    }
    const texto = valor.trim();
    return texto.length > 0 ? texto : undefined;
  }, z.string().optional()),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResponse<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/**
 * Constrói o envelope padronizado de resposta paginada.
 */
export function buildPaginatedResponse<T>(
  items: T[],
  total: number,
  page: number,
  pageSize: number,
): PaginatedResponse<T> {
  return {
    items,
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  };
}
