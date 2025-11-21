import {
  InsertSellPayload,
  InsertSellResult,
  InsertManySellsPayload,
  InsertManySellsResult
} from "../../domain/entities/Sell";
import {
  ISellRepository,
  InsertSellResponse,
  InsertManySellsResponse
} from "../../domain/repositories/ISellRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";
import { api } from "../http/api";

const mapResponse = (res: any): ServiceResponse => {
  const body = res?.data ?? {};
  const status = body?.status ?? res?.status;
  return {
    status,
    message: body?.message ?? "Operación finalizada",
    success: body?.status
  };
};

export class SellRepository implements ISellRepository {
  async insertSellByUserPhoneNumber(
    payload: InsertSellPayload
  ): Promise<InsertSellResponse> {
    const res = await api.post("/Sell/InsertSellByUserPhoneNumber", payload, {
      validateStatus: () => true
    });

    const resp = mapResponse(res);
    const body = res.data ?? {};

    const result: InsertSellResult | undefined = body.data
      ? {
          id: body.data.id,
          totalCobrado: body.data.totalCobrado,
          saldoAntes: body.data.saldoAntes,
          saldoDespues: body.data.saldoDespues,
          puntosGanados: body.data.puntosGanados
        }
      : undefined;

    return { resp, result };
  }

  async insertManySellsByUserPhoneNumber(
    payload: InsertManySellsPayload
  ): Promise<InsertManySellsResponse> {
    const res = await api.post(
      "/Sell/InsertManySellsByUserPhoneNumber",
      payload,
      { validateStatus: () => true }
    );

    const resp = mapResponse(res);
    const body = res.data ?? {};

    let result: InsertManySellsResult | undefined;

    if (Array.isArray(body.data)) {
      result = { ids: body.data };
    } else if (body?.data?.ids) {
      result = { ids: body.data.ids };
    }

    return { resp, result };
  }
}
