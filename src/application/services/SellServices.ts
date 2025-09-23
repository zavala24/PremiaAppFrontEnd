// src/application/services/SellService.ts

import { InsertSellPayload, InsertSellResponse, ISellRepository } from "../../domain/repositories/ISellRepository";
import { ISellService } from "../interfaces/ISellService";


export class SellService implements ISellService {
  private repository: ISellRepository;

  constructor(repository: ISellRepository) {
    this.repository = repository;
  }

  async insertSellByUserPhoneNumber(payload: InsertSellPayload): Promise<InsertSellResponse> {
    // Aquí podrías agregar validaciones de negocio si es necesario
    return await this.repository.insertSellByUserPhoneNumber(payload);
  }
}
