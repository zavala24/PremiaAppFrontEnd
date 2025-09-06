import { User } from "../entities/User";


export interface IAuthRepository {
  login(phoneNumber: string): Promise<{ user: User; token: string; message: string}>;
}
