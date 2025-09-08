import { BusinessQuery } from "../../domain/repositories/IBusinessRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { Business } from "../../domain/entities/Bussiness";

export interface IBusinessService {
  listPaged(params: BusinessQuery): Promise<ServiceResponse<Paged<Business>>>;
}
