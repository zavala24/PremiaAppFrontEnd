import axios from "axios";
import { IAuthRepository } from "./IAuthRepository";
import { User } from "../../domain/entities/Usert";

export class AuthRepository implements IAuthRepository {
  async login(phoneNumber: string): Promise<{ user: User; token: string; message: string }> {
    const response = await axios.post("http://192.168.1.43:5137/api/Auth/login", {
      numeroTelefono: phoneNumber,
    });

    console.log("RESULT", response.data);

    // Mapear la respuesta del backend a un objeto User
    const user: User = {
      nombre: response.data.user.toLowerCase(), // "Julio Zavala"
      role: response.data.role.toLowerCase(),   // "Admin"
    };

    return {
      user,
      token: response.data.token,
      message: response.data.message,
    };
  }
}
