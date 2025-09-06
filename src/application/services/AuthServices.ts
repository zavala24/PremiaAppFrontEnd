// src/application/services/AuthService.ts
import { User } from "../../domain/entities/User";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import { AuthLoginResult } from "../../domain/types/AuthLoginResult";

export class AuthService {
  constructor(private authRepo: IAuthRepository) {}

  async login(phoneNumber: string): Promise<AuthLoginResult> {
    if (!phoneNumber) {
      return { success: false, message: "El teléfono es requerido" };
    }

    try {
      const result = await this.authRepo.login(phoneNumber);
      return {
        success: true,
        status: 200,
        message: result.message ?? "Login exitoso",
        user: result.user,
        token: result.token,
      };
    } catch (error: any) {
      const status =
        error?.response?.status ??
        error?.status ??
        error?.response?.data?.status;
      const message =
        error?.response?.data?.message ??
        error?.message ??
        "Error en login";
      return { success: false, status, message };
    }
  }
}

