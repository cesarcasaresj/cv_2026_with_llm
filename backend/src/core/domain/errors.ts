/**
 * Error de la aplicación con estatus HTTP y código para `ApiError`.
 * Su mensaje ya viene redactado para el usuario: nunca incluye trazas ni detalles técnicos.
 */
export class AppError extends Error {
  constructor(
    readonly status: number,
    readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = new.target.name;
  }
}

/** El recurso pedido no existe. */
export class NotFoundError extends AppError {
  constructor(message: string) {
    super(404, 'NOT_FOUND', message);
  }
}

/** Falta la sesión o no es válida (spec.md, HU-02 y HU-04). */
export class UnauthorizedError extends AppError {
  constructor(message = 'Necesitas iniciar sesión para continuar.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/** La operación choca con el estado actual (nombre repetido, categoría en uso). */
export class ConflictError extends AppError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

/** Un servicio externo (por ejemplo GitHub) no responde y no hay datos de respaldo. */
export class ServiceUnavailableError extends AppError {
  constructor(message: string) {
    super(503, 'SERVICE_UNAVAILABLE', message);
  }
}

/** Se alcanzó un límite de uso (por ejemplo, las preguntas al asistente de HU-24). */
export class TooManyRequestsError extends AppError {
  constructor(message: string) {
    super(429, 'TOO_MANY_REQUESTS', message);
  }
}

/** Los datos enviados no cumplen el contrato. */
export class ValidationError extends AppError {
  constructor(message: string) {
    super(422, 'VALIDATION_ERROR', message);
  }
}
