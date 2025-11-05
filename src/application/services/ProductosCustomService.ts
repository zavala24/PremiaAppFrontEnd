import {
  IProductosCustomRepository,
  ProductosCustomListResponse,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
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
}
