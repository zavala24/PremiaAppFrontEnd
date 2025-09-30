import { IBusinessService } from "../interfaces/IBusinessService";
import { IBusinessRepository, BusinessQuery } from "../../domain/repositories/IBusinessRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { Business } from "../../domain/entities/Business";
import { NegocioFollowTelefonoDto } from "../../domain/entities/NegocioFollowUsuarioDto";

export class BusinessService implements IBusinessService {
  constructor(private repo: IBusinessRepository) {}

  async listPaged(params: BusinessQuery): Promise<ServiceResponse<Paged<Business>>> {
    const r = await this.repo.getPaged(params);
    // Tu API ya devuelve status/message; si no es 2xx lanzamos para que el UI muestre toast
    if (r.status >= 200 && r.status < 300) return r;
    throw new Error(r.message || "Error al obtener negocios");
  }

    getNegocioConfigByTelefono(phone: string): Promise<ServiceResponse<Business>> {
    return this.repo.getNegocioConfigByTelefono(phone);
  }

  async actualizarSeguirNegocioByTelefono(
    businessId: number,
    telefono: string,
    activo: boolean
  ): Promise<ServiceResponse<Business>> {
    const dto: NegocioFollowTelefonoDto = {
      IdNegocio: businessId,
      Telefono: telefono,
      Activo: activo,
    };
    return this.repo.actualizarSeguirNegocioByTelefono(dto);
  }
}
