import { ServiceResponse } from "../types/ServiceResponse";

export type InsertTokenPayload = {
  /** Teléfono del usuario, solo dígitos */
  numeroTelefono: string;
  /** Token FCM/Expo a guardar */
  token: string;
};

export interface ITokenRepository {
  insertOrUpdateToken(payload: InsertTokenPayload): Promise<ServiceResponse>;
}
