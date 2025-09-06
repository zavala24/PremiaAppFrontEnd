import { ServiceResponse } from "./ServiceResponse";
import { User } from "../entities/User";

export type AuthLoginResult = ServiceResponse & {
  user?: User;
  token?: string;
};