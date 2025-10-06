import messaging from "@react-native-firebase/messaging";
import { ITokenRepository } from "../../domain/repositories/ITokenRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";
import { ITokenService, InsertTokenInput } from "../interfaces/ITokenService";

export class TokenService implements ITokenService {
  private repo: ITokenRepository;

  constructor(repo: ITokenRepository) {
    this.repo = repo;
  }

  async insertOrUpdateToken(payload: InsertTokenInput): Promise<ServiceResponse> {
    try {
      if (!payload?.numeroTelefono) {
        return { status: 400, success: false, message: "numeroTelefono es requerido" };
      }

      // Si no te pasaron token, lo pedimos a FCM
      const token = payload.token ?? (await messaging().getToken());
      const tipo = payload.tipo ?? "fcm";

      // Enviamos al repositorio con la forma exacta que espera la API
      const resp = await this.repo.insertOrUpdateToken({
        numeroTelefono: payload.numeroTelefono,
        token,
        tipo,
      });

      return resp;
    } catch (e: any) {
      return {
        status: 500,
        success: false,
        message: e?.message ?? "No se pudo registrar el token",
      };
    }
  }
}
