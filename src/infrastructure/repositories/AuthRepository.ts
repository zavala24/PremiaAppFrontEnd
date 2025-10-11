// src/infrastructure/repositories/AuthRepository.ts
import { IAuthRepository, LoginResponse } from "../../domain/repositories/IAuthRepository";
import { apiPublic } from "../http/api";

export class AuthRepository implements IAuthRepository {
  async login(phoneNumber: string, password?: string): Promise<LoginResponse> {
    const payload = {
      numeroTelefono: phoneNumber,
      ...(password ? { password } : {}),
    };

    // ⬇️ NO lanzar error en 4xx/5xx: siempre resuelve la promesa
    const res = await apiPublic.post("/Auth/login", payload, {
      validateStatus: () => true,
    });

    // En tu backend devuelves { status, message, ... }
    const body = res.data ?? {};
    const status = res.status ?? body.status ?? 0;

    return {
      status,
      message: body.message ?? "",
      token: body.token,
      user: body.user,
      role: body.role,
      telefono: body.telefono,
    };
  }
}
