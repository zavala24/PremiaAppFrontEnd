import { ServiceResponse } from "../types/ServiceResponse";

export type InsertTokenPayload = {
  /** Teléfono del usuario, solo dígitos */
  numeroTelefono: string;
  /** Token FCM/Expo a guardar */
  token: string;
  /** Tipo de token que guardas, por defecto 'fcm' */
  tipo: "fcm" | "expo";
};

export interface ITokenRepository {
  insertOrUpdateToken(payload: InsertTokenPayload): Promise<ServiceResponse>;
}
