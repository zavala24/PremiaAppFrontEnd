import {
  InsertManySellsPayload,
  InsertSellPayload
} from "../../domain/entities/Sell";
import {
  InsertSellResponse,
  InsertManySellsResponse
} from "../../domain/repositories/ISellRepository";

export interface ISellService {
  insertSellByUserPhoneNumber(payload: InsertSellPayload): Promise<InsertSellResponse>;
  insertManySellsByUserPhoneNumber(
    payload: InsertManySellsPayload
  ): Promise<InsertManySellsResponse>;
}
