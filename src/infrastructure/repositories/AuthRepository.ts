import axios, { AxiosError } from "axios";
import { IAuthRepository } from "../../domain/repositories/IAuthRepository";
import { User } from "../../domain/entities/User";


export class AuthRepository implements IAuthRepository {
  async login(phoneNumber: string): Promise<{ user: User; token: string; message: string }> {
    try {
      const { data } = await axios.post("http://192.168.1.43:5137/api/Auth/login", {
        numeroTelefono: phoneNumber,
      });

      const user: User = {
        nombre: data.user.toLowerCase(),
        role: data.role.toLowerCase(),
      };

      console.log("✅ Usuario mapeado:", user);
      return {
        user,
        token: data.token,
        message: data.message ?? "Inicio de sesión exitoso",
      };
    } catch (e) {

      const err = e as AxiosError<any>;

      // Si no hay respuesta del servidor
      if (!err.response) {
        throw new Error("Error de conexión: el servidor no responde.");
      }

      // Si hay respuesta con error HTTP
      throw new Error(err.response.data?.message ?? "Error al iniciar sesión.");
    }
  }
}
