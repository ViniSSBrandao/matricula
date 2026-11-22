import { z } from "zod";
import { horariosInternosChocam } from "../../utils/horario.utils";
import { paginationQuerySchema, PaginationQuery } from "../../utils/pagination.utils";
import { idParamSchema } from "../../utils/validation.utils";

export const listarTurmasQuerySchema = paginationQuerySchema;

export const horarioSlotSchema = z
  .object({
    dia: z
      .number({ error: "Dia deve ser um número inteiro." })
      .int("Dia deve ser um número inteiro.")
      .min(1, "Dia mínimo é 1 (segunda).")
      .max(7, "Dia máximo é 7 (domingo)."),
    inicio: z
      .number({ error: "Início deve ser um número inteiro." })
      .int("Início deve ser um número inteiro.")
      .min(0, "Início mínimo é 0.")
      .max(1439, "Início máximo é 1439."),
    fim: z
      .number({ error: "Fim deve ser um número inteiro." })
      .int("Fim deve ser um número inteiro.")
      .min(1, "Fim mínimo é 1.")
      .max(1440, "Fim máximo é 1440."),
  })
  .refine((h) => h.fim > h.inicio, {
    path: ["fim"],
    message: "Horário de fim deve ser maior que o de início.",
  });

export const criarTurmaBodySchema = z
  .object({
    idDisciplina: z
      .number({ error: "idDisciplina é obrigatório." })
      .int("idDisciplina deve ser um número inteiro.")
      .positive("idDisciplina deve ser positivo."),
    idProfessor: z
      .number({ error: "idProfessor é obrigatório." })
      .int("idProfessor deve ser um número inteiro.")
      .positive("idProfessor deve ser positivo."),
    vagas: z
      .number({ error: "vagas deve ser um número inteiro." })
      .int("vagas deve ser um número inteiro.")
      .min(1, "Número mínimo de vagas é 1."),
    horarios: z.array(horarioSlotSchema).default([]),
  })
  .refine((data) => !horariosInternosChocam(data.horarios), {
    path: ["horarios"],
    message: "Os horários informados para a turma possuem sobreposição entre si.",
  });

export const atualizarVagasBodySchema = z.object({
  vagas: z
    .number({ error: "vagas deve ser um número inteiro." })
    .int("vagas deve ser um número inteiro.")
    .min(1, "Número mínimo de vagas é 1."),
});

export const turmaIdParamSchema = idParamSchema;

export type ListarTurmasQuery = PaginationQuery;
export type CriarTurmaBody = z.infer<typeof criarTurmaBodySchema>;
export type AtualizarVagasBody = z.infer<typeof atualizarVagasBodySchema>;
