// src/infrastructure/repositories/SellRepository.ts
import { InsertSellPayload, InsertSellResult } from "../../domain/entities/Sell";
import { ISellRepository } from "../../domain/repositories/ISellRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";
import { api } from "../http/api";

// Puedes mover este helper a un util compartido si quieres
const mapResponse = (res: any): ServiceResponse => {
  const body = res?.data ?? {};
  const status = body?.status ?? res?.status;
  const message =
    body?.message ??
    (typeof status === "number" && status === 201
      ? "Operación realizada correctamente."
      : "Operación finalizada");
  const success =
    body?.success ?? (typeof status === "number" ? status >= 200 && status < 300 : undefined);
  return { status, success, message };
};

export class SellRepository implements ISellRepository {
  async insertSellByUserPhoneNumber(
    payload: InsertSellPayload
  ): Promise<{ resp: ServiceResponse; result?: InsertSellResult }> {
    // Endpoint: InsertSellByUserPhoneNumber
    const res = await api.post("/Sell/InsertSellByUserPhoneNumber", payload, {
      validateStatus: () => true,
    });

    const resp = mapResponse(res);
    const body = res?.data ?? {};
    const result: InsertSellResult | undefined = body?.data
      ? {
          id: body.data.id,
          totalCobrado: body.data.totalCobrado,
          saldoAntes: body.data.saldoAntes,
          saldoDespues: body.data.saldoDespues,
          puntosGanados: body.data.puntosGanados,
        }
      : undefined;

    return { resp, result };
  }
}
