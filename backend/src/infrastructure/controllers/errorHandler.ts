import type { ErrorRequestHandler } from 'express';
import type { components } from '../../generated/api';
import { AppError } from '../../core/domain/errors';

type ApiError = components['schemas']['ApiError'];

export const errorHandler: ErrorRequestHandler = (error, _request, response, _next) => {
  // Errores de la aplicación: el mensaje ya está redactado para el usuario
  if (error instanceof AppError) {
    const body: ApiError = {
      code: error.code,
      message: error.message,
      timestamp: new Date().toISOString(),
    };
    response.status(error.status).json(body);
    return;
  }

  console.error(error); // El detalle técnico se queda en los logs del servidor

  const body: ApiError = {
    code: 'INTERNAL_ERROR',
    message: 'No pudimos completar la solicitud. Intenta de nuevo en unos minutos.',
    timestamp: new Date().toISOString(),
  };
  response.status(500).json(body);
};
