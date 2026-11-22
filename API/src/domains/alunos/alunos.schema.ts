import { z } from "zod";
import { paginationQuerySchema, PaginationQuery } from "../../utils/pagination.utils";
import { idParamSchema } from "../../utils/validation.utils";

export const listarAlunosQuerySchema = paginationQuerySchema;
export const alunoIdParamSchema = idParamSchema;

export const criarAlunoBodySchema = z.object({
  nome: z
    .string({ error: "Nome é obrigatório." })
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(255, "Nome deve ter no máximo 255 caracteres."),
  idCurso: z.coerce
    .number({ error: "Curso é obrigatório." })
    .int("Curso inválido.")
    .positive("Curso inválido."),
});

export type ListarAlunosQuery = PaginationQuery;
export type CriarAlunoBody = z.infer<typeof criarAlunoBodySchema>;
