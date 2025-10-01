import { User } from "../../domain/entities/User";
import { ServiceResponse } from "../../domain/types/ServiceResponse";

export interface IUserService {
  createUser(user: User): Promise<void>;
  registerUser(user: User): Promise<ServiceResponse>;
  getUserByPhone(phoneNumber: string): Promise<{ resp: ServiceResponse; user?: User }>;
  GetUserPuntosByPhoneNumber(phoneNumber: string, id: number): Promise<{ resp: ServiceResponse; user?: User }>;
  updateUser(user: User): Promise<ServiceResponse>;
}
