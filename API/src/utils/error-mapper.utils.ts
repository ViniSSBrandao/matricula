import { Prisma } from "@prisma/client";
import {
  AppError,
  BadRequestError,
  ConflictError,
  NotFoundError,
  UnprocessableEntityError,
} from "./errors.utils";

/**
 * Converte erros de infraestrutura/Prisma em AppError HTTP adequado ou faz passthrough
 * caso o erro já seja um AppError tipado pela camada de domínio/service.
 */
export function normalizarErroParaHttp(erro: unknown): AppError {
  if (erro instanceof AppError) {
    return erro;
  }

  if (erro instanceof Prisma.PrismaClientKnownRequestError) {
    switch (erro.code) {
      case "P2002":
        return new ConflictError("Registro duplicado: violação de unicidade.", erro.meta);
      case "P2003":
        return new BadRequestError("Referência inválida para registro relacionado.", erro.meta);
      case "P2025":
        return new NotFoundError("Registro não encontrado.");
      case "P2004":
        return new UnprocessableEntityError(
          "Dados violam uma regra de integridade do banco de dados.",
          erro.meta,
        );
      default:
        return new BadRequestError("Erro ao executar operação no banco de dados.", {
          prismaCode: erro.code,
        });
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
