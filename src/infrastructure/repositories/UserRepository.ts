// UserRepository.ts
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { api } from "../http/api";

export class UserRepository implements IUserRepository {
  async createUser(payload: User): Promise<void> {
    try {
      const res = await api.post("/User/InsertUser", payload);
    } catch (err: any) {
      throw err; // deja que tu screen muestre el toast
    }
  }
}
