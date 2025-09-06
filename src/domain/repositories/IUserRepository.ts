import { User } from "../entities/User";


export interface IUserRepository {
  createUser(user: User): Promise<void>;
}
