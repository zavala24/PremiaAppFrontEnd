// src/domain/repositories/ISellRepository.ts
import { ServiceResponse } from "../types/ServiceResponse";
import { InsertSellPayload, InsertSellResult } from "../entities/Sell";

export interface InsertSellResponse {
  resp: ServiceResponse;
  result?: InsertSellResult;
}

export interface ISellRepository {
  insertSellByUserPhoneNumber(
    payload: InsertSellPayload
  ): Promise<InsertSellResponse>;
}
export { InsertSellPayload };

