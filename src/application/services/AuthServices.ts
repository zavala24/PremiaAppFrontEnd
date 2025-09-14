import { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import { User, Role } from "../../domain/entities/User";
// importa normalizeRole (si lo dejaste en este mismo archivo, no necesitas import)

export class AuthService {
  constructor(private repo: IAuthRepository) {}

  async login(
    phoneNumber: string,
    password?: string
  ): Promise<
    | {
        success: true;
        user: User;
        token: string;
        role: Role;            // <= devolvemos Role, no string
        message: string;
      }
    | { success: false; message: string; status?: number }
  > {

    const res = await this.repo.login(phoneNumber, password);

    if (res.status === 200 && res.token && res.user) {
      const role: Role = res.role ?? "User";

      const user: User = {
        nombre: res.user,
        telefono: res.telefono,
        role,                                  // <= ahora es Role
      };

      return {
        success: true,
        user,
        token: res.token,
        role,
        message: res.message ?? "Inicio de sesión exitoso",
      };
    }

    return {
      success: false,
      message: res.message ?? "No se pudo iniciar sesión",
      status: res.status,
    };
  }
}
