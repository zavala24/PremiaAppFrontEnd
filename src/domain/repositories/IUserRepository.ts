
import { User } from "../entities/User";
import { ServiceResponse } from "../types/ServiceResponse";

export interface IUserRepository {
  createUser(user: User): Promise<void>;
  registerUser(user: User): Promise<ServiceResponse>;
  getUserByPhone(phoneNumber: string): Promise<{ resp: ServiceResponse; user?: User }>;
  GetUserPuntosByPhoneNumber(phoneNumber: string, id: number): Promise<{ resp: ServiceResponse; user?: User }>;
  updateUser(user: User): Promise<ServiceResponse>;
  getRoleByPhoneForLogin(phoneNumber: string): Promise<ServiceResponse>;
}
