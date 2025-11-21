import { ServiceResponse } from "../types/ServiceResponse";
import {
  InsertSellPayload,
  InsertSellResult,
  InsertManySellsPayload,
  InsertManySellsResult
} from "../entities/Sell";

export interface InsertSellResponse {
  resp: ServiceResponse;
  result?: InsertSellResult;
}

export interface InsertManySellsResponse {
  resp: ServiceResponse;
  result?: InsertManySellsResult;
}

export interface ISellRepository {
  insertSellByUserPhoneNumber(
    payload: InsertSellPayload
  ): Promise<InsertSellResponse>;

  insertManySellsByUserPhoneNumber(
    payload: InsertManySellsPayload
  ): Promise<InsertManySellsResponse>;
}
