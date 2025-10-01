
import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";
import { IUserService } from "../interfaces/IUserServices";



export class UserService implements IUserService {
  constructor(private userRepository: IUserRepository) {}

  async createUser(user: User): Promise<void> {
    // Aquí puedes agregar lógica extra si quieres, por ejemplo validar rol
    await this.userRepository.createUser(user);
  }

  registerUser(user: User): Promise<ServiceResponse> {
    return this.userRepository.registerUser(user);
  }

  getUserByPhone(phoneNumber: string) {
    return this.userRepository.getUserByPhone(phoneNumber);
  }

  GetUserPuntosByPhoneNumber(phoneNumber: string, id: number) {
    return this.userRepository.GetUserPuntosByPhoneNumber(phoneNumber, id);
  }

    updateUser(user: User): Promise<ServiceResponse> {
    return this.userRepository.updateUser(user);
  }
}
