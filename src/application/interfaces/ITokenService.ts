import { ServiceResponse } from "../../domain/types/ServiceResponse";

export type InsertTokenInput = {
  /** Teléfono del usuario, solo dígitos */
  numeroTelefono: string;
  /** Token opcional; si se omite, el servicio lo pide a FCM */
  token?: string;
  /** Tipo de token; por defecto 'fcm' */
  tipo?: "fcm" | "expo";
};

export interface ITokenService {
  insertOrUpdateToken(payload: InsertTokenInput): Promise<ServiceResponse>;
}
