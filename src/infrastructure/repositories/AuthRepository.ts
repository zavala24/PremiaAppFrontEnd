import axios from "axios";
import { IAuthRepository } from "./IAuthRepository";

export class AuthRepository implements IAuthRepository {
  async login(phoneNumber: string): Promise<{ token: string; message: string }> {
    const response = await axios.post("http://192.168.1.43:5137/api/Auth/login", {
      numeroTelefono: phoneNumber,
    });

    return response.data;
  }
}
