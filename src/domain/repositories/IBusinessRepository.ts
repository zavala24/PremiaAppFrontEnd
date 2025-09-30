import { Paged } from "../dto/Pagination";
import { ServiceResponse } from "../dto/ServiceResponse";
import { Business } from "../entities/Business";
import { NegocioFollowTelefonoDto } from "../entities/NegocioFollowUsuarioDto";


export type BusinessQuery = {
  page: number;
  pageSize: number;
  search?: string;
  category?: string;
};

export interface IBusinessRepository {
  getPaged(params: BusinessQuery): Promise<ServiceResponse<Paged<Business>>>;
  getNegocioConfigByTelefono(phone: string): Promise<ServiceResponse<Business>>;
    actualizarSeguirNegocioByTelefono(
    dto: NegocioFollowTelefonoDto
  ): Promise<ServiceResponse<Business>>;
}
