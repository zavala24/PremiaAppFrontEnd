import { InsertSellPayload } from "../../domain/entities/Sell";
import { InsertSellResponse } from "../../domain/repositories/ISellRepository";

export interface ISellService {
  insertSellByUserPhoneNumber(payload: InsertSellPayload): Promise<InsertSellResponse>;
}
