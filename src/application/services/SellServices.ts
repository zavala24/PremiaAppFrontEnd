import {
  InsertSellPayload,
  InsertManySellsPayload
} from "../../domain/entities/Sell";
import {
  InsertSellResponse,
  InsertManySellsResponse,
  ISellRepository
} from "../../domain/repositories/ISellRepository";
import { ISellService } from "../interfaces/ISellService";

export class SellService implements ISellService {
  constructor(private repository: ISellRepository) {}

  async insertSellByUserPhoneNumber(
    payload: InsertSellPayload
  ): Promise<InsertSellResponse> {
    return this.repository.insertSellByUserPhoneNumber(payload);
  }

  async insertManySellsByUserPhoneNumber(
    payload: InsertManySellsPayload
  ): Promise<InsertManySellsResponse> {
    return this.repository.insertManySellsByUserPhoneNumber(payload);
  }
}
