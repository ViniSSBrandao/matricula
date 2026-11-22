import { z } from "zod";

const loginCampoSchema = z
  .string({ error: "Login é obrigatório." })
  .trim()
  .min(3, "Login deve ter no mínimo 3 caracteres.")
  .max(60, "Login deve ter no máximo 60 caracteres.")
  .regex(/^\S+$/, "Login não pode conter espaços.");

const emailCampoSchema = z
  .string({ error: "E-mail é obrigatório." })
  .trim()
  .email("E-mail inválido.")
  .max(255, "E-mail deve ter no máximo 255 caracteres.");

export const registrarCadastroBodySchema = z.discriminatedUnion("perfil", [
  z.object({
    perfil: z.literal("professor"),
    email: emailCampoSchema,
    login: loginCampoSchema,
  }),
  z.object({
    perfil: z.literal("aluno"),
    nome: z
      .string({ error: "Nome completo é obrigatório." })
      .trim()
      .min(1, "Nome completo é obrigatório.")
      .max(255, "Nome deve ter no máximo 255 caracteres."),
    idCurso: z.coerce
      .number({ error: "Curso é obrigatório." })
      .int("Curso inválido.")
      .positive("Curso inválido."),
    email: emailCampoSchema,
    login: loginCampoSchema,
  }),
]);

export type RegistrarCadastroBody = z.infer<typeof registrarCadastroBodySchema>;
