
import { User } from "../entities/User";
import { ServiceResponse } from "../types/ServiceResponse";

export interface IUserRepository {
  createUser(user: User): Promise<void>;
  registerUser(user: User): Promise<ServiceResponse>;
}
