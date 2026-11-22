import { Prisma } from "@prisma/client";
import { ZodError } from "zod";
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
  ValidationError,
} from "./errors.utils";

/**
 * Converte erros de validação/infraestrutura/Prisma em AppError HTTP adequado ou faz passthrough
 * caso o erro já seja um AppError tipado pela camada de domínio/service.
 */
export function normalizarErroParaHttp(erro: unknown): AppError {
  if (erro instanceof AppError) {
    return erro;
  }

  if (erro instanceof ZodError) {
    const detalhes = erro.issues.map((issue) => ({
      campo: issue.path.join("."),
      mensagem: issue.message,
    }));
    return new ValidationError("Dados de entrada inválidos.", detalhes);
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    switch (erro.code) {
      case "P2002":
        return new ConflictError("Registro duplicado: violação de unicidade.");
      case "P2003":
        return new BadRequestError("Referência inválida para registro relacionado.");
      case "P2025":
        return new NotFoundError("Registro não encontrado.");
      case "P2004":
        return new UnprocessableEntityError(
          "Dados violam uma regra de integridade do banco de dados.",
        );
      default:
        return new BadRequestError("Erro ao executar operação no banco de dados.");
    }
  }

  if (erro instanceof Prisma.PrismaClientValidationError) {
    return new BadRequestError("Parâmetros inválidos na consulta ao banco de dados.");
  }

  if (erro instanceof Prisma.PrismaClientInitializationError) {
    return new AppError("Serviço de banco de dados indisponível.", 503, "SERVICE_UNAVAILABLE");
  }

  if (erro instanceof Error && /23514|check constraint/i.test(erro.message)) {
    return new UnprocessableEntityError(
      "Dados violam uma regra de integridade do banco de dados.",
    );
  }

  return new AppError("Erro interno do servidor.", 500, "INTERNAL_ERROR");
}
