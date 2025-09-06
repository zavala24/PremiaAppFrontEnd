

import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { IUserService } from "../interfaces/IUserServices";


export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(user: User): Promise<void> {
    // Aquí puedes agregar lógica extra si quieres, por ejemplo validar rol
    await this.userRepository.createUser(user);
  }
}
