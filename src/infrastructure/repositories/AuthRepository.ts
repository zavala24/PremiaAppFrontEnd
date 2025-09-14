// src/infrastructure/repositories/AuthRepository.ts
import { IAuthRepository, LoginResponse } from "../../domain/repositories/IAuthRepository";
import { apiPublic } from "../http/api";

export class AuthRepository implements IAuthRepository {
  async login(phoneNumber: string, password?: string): Promise<LoginResponse> {
    try {

      const payload = {
        numeroTelefono: phoneNumber,
        ...(password ? { password: password } : {}),
      };
      
      const { data } = await apiPublic.post("/Auth/login", payload);

      return {
        status: data.status ?? 0,
        message: data.message ?? "",
        token: data.token,
        user: data.user,
        role: data.role,
        telefono: data.telefono,
      };
    } catch (e: any) {
      const status = e?.response?.status ?? 0;
      const message =
        e?.response?.data?.message ??
        e?.message ??
        "No se pudo iniciar sesión.";
      return { status, message };
    }
  }
}
