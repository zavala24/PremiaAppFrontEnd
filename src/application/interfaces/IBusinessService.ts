import { BusinessQuery } from "../../domain/repositories/IBusinessRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { Business } from "../../domain/entities/Business";

export interface IBusinessService {
  listPaged(params: BusinessQuery): Promise<ServiceResponse<Paged<Business>>>;
  getNegocioConfigByTelefono(phone: string): Promise<ServiceResponse<Business>>;
    actualizarSeguirNegocioByTelefono(
    businessId: number,
    telefono: string,
    activo: boolean
  ): Promise<ServiceResponse<Business>>;

    getNegociosSeguidosByTelefono(
    phone: string
  ): Promise<ServiceResponse<Business[]>>;
}
