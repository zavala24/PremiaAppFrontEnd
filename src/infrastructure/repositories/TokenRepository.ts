import { api } from "../http/api";
import { ITokenRepository, InsertTokenPayload } from "../../domain/repositories/ITokenRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";

// Igual que en SellRepository: mapea la respuesta del backend a ServiceResponse
const mapResponse = (res: any): ServiceResponse => {
  const body = res?.data ?? {};
  const status = body?.status ?? res?.status;
  const message =
    body?.message ??
    (typeof status === "number" && status >= 200 && status < 300
      ? "Operación realizada correctamente."
      : "Operación finalizada");
  const success =
    body?.success ?? (typeof status === "number" ? status >= 200 && status < 300 : undefined);
  return { status, success, message };
};

export class TokenRepository implements ITokenRepository {
  async insertOrUpdateToken(payload: InsertTokenPayload): Promise<ServiceResponse> {

    const res = await api.post("/TokenDispositivo/InsertOrUpdateToken", payload, {
      validateStatus: () => true,
    });
    return mapResponse(res);
  }
}
