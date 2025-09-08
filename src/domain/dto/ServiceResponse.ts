// Igual a tu backend (sin T obligatorio si no lo necesitas en otros lados)
export interface ServiceResponse<T> {
  status: number;
  message: string;
  data?: T;
}
