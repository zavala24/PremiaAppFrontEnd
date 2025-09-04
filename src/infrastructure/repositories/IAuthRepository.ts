export interface IAuthRepository {
  login(phoneNumber: string): Promise<{ token: string; message: string }>;
}