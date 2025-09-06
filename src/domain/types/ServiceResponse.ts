// src/domain/types/ServiceResponse.ts
export interface ServiceResponse {
  status?: number;      // 201, 409, 400, etc.
  success?: boolean;    // si tu API no lo manda, lo inferimos del status
  message: string;      // mensaje del backend
}
