import { z } from "zod";
import { ValidationError } from "./errors.utils";

/**
 * Valida dados de entrada com um schema Zod e lança ValidationError padronizado em português.
 */
export function parseSchema<T>(schema: z.ZodType<T>, data: unknown): T {
  const resultado = schema.safeParse(data);
  if (!resultado.success) {
    const detalhes = resultado.error.issues.map((issue) => ({
      campo: issue.path.join("."),
      mensagem: issue.message,
    }));
    throw new ValidationError("Dados de entrada inválidos.", detalhes);
  }
  return resultado.data;
}

export const idParamSchema = z.object({
  id: z.coerce
    .number({ error: "ID deve ser um número inteiro." })
    .int("ID deve ser um número inteiro.")
    .positive("ID deve ser positivo."),
});
