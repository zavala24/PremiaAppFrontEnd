import { IAuthRepository } from "../../infrastructure/repositories/IAuthRepository";


export interface ServiceResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

export class AuthService {
  constructor(private authRepo: IAuthRepository) {}

  async login(phoneNumber: string): Promise<ServiceResponse<{ token: string }>> {
    if (!phoneNumber) {
      return { success: false, message: "El teléfono es requerido" };
    }

    try {
      const result = await this.authRepo.login(phoneNumber);
      return {
        success: true,
        message: result.message || "Login exitoso",
        data: { token: result.token },
      };
    } catch (error: any) {
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Error en login",
      };
    }
  }
}
