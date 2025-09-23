// UserRepository.ts

import { User } from "../../domain/entities/User";
import { IUserRepository } from "../../domain/repositories/IUserRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";
import { api, apiPublic } from "../http/api";

const mapResponse = (res: any): ServiceResponse => {
  const body = res?.data ?? {};
  const status = body?.status ?? res?.status;
  const message =
    body?.message ??
    (status === 201 ? "Usuario insertado correctamente." : "Operación finalizada");
  const success =
    body?.success ?? (typeof status === "number" ? status >= 200 && status < 300 : undefined);
  return { status, success, message };
};

export class UserRepository implements IUserRepository {
  async createUser(payload: User): Promise<void> {
    try {
      const res = await api.post("/User/InsertUser", payload);
    } catch (err: any) {
      throw err; // deja que tu screen muestre el toast
    }
  }

  async registerUser(payload: User): Promise<ServiceResponse> {
    const res = await apiPublic.post("/User/RegisterUser", payload, {
      validateStatus: () => true,
    });
    return mapResponse(res);
  }

    async getUserByPhone(phoneNumber: string): Promise<{ resp: ServiceResponse; user?: User }> {
    const res = await api.get("/User/GetUserByPhoneNumber", {
      params: { phoneNumber },
      validateStatus: () => true,
    });

    const resp = mapResponse(res);
    const body = res?.data ?? {};


    const user: User | undefined = body?.data
      ? {
          nombre: body.data.nombre ?? "",
          apellidoPaterno: body.data.apellidoPaterno ?? "",
          apellidoMaterno: body.data.apellidoMaterno ?? "",
          email: body.data.email ?? "",
          telefono: body.data.telefono ?? "",
          role: body.role,
          puntosAcumulados: body.data.puntosAcumulados
        }
      : undefined;
          console.log("USER!!",user)
    return { resp, user };
  }

    async updateUser(payload: User): Promise<ServiceResponse> {
    const res = await api.put("/User/UpdateUser", payload, { validateStatus: () => true });
    return mapResponse(res);
  }
}
