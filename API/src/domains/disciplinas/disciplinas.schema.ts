import { z } from "zod";
import { paginationQuerySchema, PaginationQuery } from "../../utils/pagination.utils";
import { idParamSchema } from "../../utils/validation.utils";

export const listarDisciplinasQuerySchema = paginationQuerySchema;

export const disciplinaBodySchema = z.object({
  codigo: z
    .string({ error: "Código é obrigatório." })
    .trim()
    .min(1, "Código é obrigatório.")
    .max(10, "Código deve ter no máximo 10 caracteres."),
  nome: z
    .string({ error: "Nome é obrigatório." })
    .trim()
    .min(1, "Nome é obrigatório.")
    .max(255, "Nome deve ter no máximo 255 caracteres."),
  cargaHoraria: z
    .number({ error: "Carga horária deve ser um número inteiro." })
    .int("Carga horária deve ser um número inteiro.")
    .min(15, "Carga horária mínima é 15.")
    .max(120, "Carga horária máxima é 120.")
    .refine(
      (valor) => valor % 15 === 0,
      "A carga horária deve ser múltipla de 15 entre 15 e 120.",
    ),
});

export const disciplinaIdParamSchema = idParamSchema;

export type ListarDisciplinasQuery = PaginationQuery;
export type DisciplinaBody = z.infer<typeof disciplinaBodySchema>;
