/**
 * Erro base HTTP/aplicação para comunicação padronizada entre camadas e o error handler global.
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: unknown;

  constructor(message: string, statusCode = 400, code = "APP_ERROR", details?: unknown) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class BadRequestError extends AppError {
  constructor(message: string, details?: unknown, code = "BAD_REQUEST") {
    super(message, 400, code, details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown, code = "VALIDATION_ERROR") {
    super(message, 400, code, details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = "Não autorizado.") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AppError {
  constructor(message = "Acesso negado.") {
    super(message, 403, "FORBIDDEN");
  }
}

export class NotFoundError extends AppError {
  constructor(message = "Recurso não encontrado.") {
    super(message, 404, "NOT_FOUND");
  }
}

export class ConflictError extends AppError {
  constructor(message: string, details?: unknown, code = "CONFLICT") {
    super(message, 409, code, details);
  }
}

export class UnprocessableEntityError extends AppError {
  constructor(message: string, details?: unknown, code = "UNPROCESSABLE_ENTITY") {
    super(message, 422, code, details);
  }
}

export class BusinessRuleError extends AppError {
  constructor(message: string, code = "BUSINESS_RULE_VIOLATION", details?: unknown) {
    super(message, 422, code, details);
  }
}
