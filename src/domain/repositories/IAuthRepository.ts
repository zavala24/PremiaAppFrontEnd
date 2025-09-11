// src/domain/repositories/IAuthRepository.ts
import { Role, User } from "../entities/User";

export type LoginResponse = {
  status: number;
  message: string;
  token?: string;
  user?: string;     // nombre completo desde el back
  role?: Role;     // rol desde el back
  telefono?: string;
};

export interface IAuthRepository {
  login(
    phoneNumber: string,
    password?: string
  ): Promise<LoginResponse>;
}
