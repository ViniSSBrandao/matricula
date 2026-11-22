import { z } from "zod";
import { idParamSchema } from "../../utils/validation.utils";

export const criarMatriculaBodySchema = z.object({
  idTurma: z
    .number({
      error: (issue) =>
        issue.input === undefined
          ? "idTurma é obrigatório."
          : "idTurma deve ser um número inteiro.",
    })
    .int("idTurma deve ser um número inteiro.")
    .positive("idTurma deve ser positivo."),
});

export const matriculaIdParamSchema = idParamSchema;

export type CriarMatriculaBody = z.infer<typeof criarMatriculaBodySchema>;
