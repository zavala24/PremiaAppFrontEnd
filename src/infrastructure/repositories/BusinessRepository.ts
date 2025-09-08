import { api } from "../http/api";
import { IBusinessRepository, BusinessQuery } from "../../domain/repositories/IBusinessRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { Business } from "../../domain/entities/Bussiness";

export class BusinessRepository implements IBusinessRepository {
  async getPaged(params: BusinessQuery): Promise<ServiceResponse<Paged<Business>>> {
    const res = await api.get("/Negocio/GetNegociosPaged", { params });
    return res.data as ServiceResponse<Paged<Business>>;
  }
}