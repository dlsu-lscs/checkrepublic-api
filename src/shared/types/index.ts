export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
  meta?: Record<string, unknown>;
}

export interface ApiErrorDetail {
  code: string;
  message: string;
  statusCode: number;
  details?: unknown;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiErrorDetail;
  timestamp: string;
  requestId?: string;
}
