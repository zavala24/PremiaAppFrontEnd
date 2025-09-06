import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";


export class UserRepository implements IUserRepository {
  async createUser(user: User): Promise<void> {
    const res = await fetch("https://miapi.com/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(user),
    });

    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Error al crear usuario");
    }
  }

}
