import type { ApiResponse, ApiErrorResponse } from '../types';

export function successResponse<T>(
  data: T,
  message?: string,
  meta?: Record<string, unknown>,
): ApiResponse<T> {
  const response: ApiResponse<T> = {
    success: true,
    data,
  };

  if (message) {
    response.message = message;
  }

  if (meta) {
    response.meta = meta;
  }

  return response;
}

export function errorResponse(
  code: string,
  message: string,
  statusCode: number,
  details?: unknown,
  requestId?: string,
): ApiErrorResponse {
  return {
    success: false,
    error: {
      code,
      message,
      statusCode,
      ...(details !== undefined ? { details } : {}),
    },
    timestamp: new Date().toISOString(),
    ...(requestId ? { requestId } : {}),
  };
}
