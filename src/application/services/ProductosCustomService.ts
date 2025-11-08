import {
  IProductosCustomRepository,
  ProductosCustomListResponse,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
  GetProgresoCustomParams,     // 👈 nuevo
  ProgresoCustomDto,           // 👈 nuevo
} from "../../domain/repositories/IProductosCustomRepository";
import { IProductosCustomService } from "../interfaces/IProductosCustomService";

export class ProductosCustomService implements IProductosCustomService {
  constructor(private repo: IProductosCustomRepository) {}

  getProductosByNegocio(idNegocio: number): Promise<ProductosCustomListResponse> {
    return this.repo.getProductosByNegocio(idNegocio);
  }

  acumularProgresoCustom(req: AcumularProgresoCustomRequest) {
    return this.repo.acumularProgresoCustom(req);
  }

  canjearProgresoCustom(req: CanjearProgresoCustomRequest) {
    return this.repo.canjearProgresoCustom(req);
  }

  /** ===== NUEVO: wrapper del progreso ===== */
  async getProgresoCustom(
    params: GetProgresoCustomParams
  ): Promise<{ resp: any; data: ProgresoCustomDto | null }> {
    return this.repo.getProgresoCustom(params);
  }
}
