import { User } from "../../domain/entities/Usert";


export interface IAuthRepository {
  login(phoneNumber: string): Promise<{ user: User; token: string; message: string}>;
}
