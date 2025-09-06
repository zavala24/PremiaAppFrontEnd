import { User } from "../../domain/entities/User";


export interface IUserService {
  createUser(user: User): Promise<void>;
}
