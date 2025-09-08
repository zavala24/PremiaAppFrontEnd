import { Paged } from "../dto/Pagination";
import { ServiceResponse } from "../dto/ServiceResponse";
import { Business } from "../entities/Bussiness";


export type BusinessQuery = {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
};

export interface IBusinessRepository {
  getPaged(params: BusinessQuery): Promise<ServiceResponse<Paged<Business>>>;
}
