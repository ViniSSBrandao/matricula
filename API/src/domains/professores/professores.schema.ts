import { z } from "zod";
import { paginationQuerySchema, PaginationQuery } from "../../utils/pagination.utils";
import { idParamSchema } from "../../utils/validation.utils";

export const listarProfessoresQuerySchema = paginationQuerySchema;
export const professorIdParamSchema = idParamSchema;

export const criarProfessorBodySchema = z.object({
  nome: z
    .string({ error: "Nome é obrigatório." })
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(255, "Nome deve ter no máximo 255 caracteres."),
  email: z
    .string({ error: "E-mail é obrigatório." })
    .trim()
    .email("E-mail inválido.")
    .max(255, "E-mail deve ter no máximo 255 caracteres."),
  titulacao: z
    .string({ error: "Titulação inválida." })
    .trim()
    .min(1, "Titulação não pode ser vazia.")
    .max(30, "Titulação deve ter no máximo 30 caracteres.")
    .optional(),
});

export type ListarProfessoresQuery = PaginationQuery;
export type CriarProfessorBody = z.infer<typeof criarProfessorBodySchema>;
