import { ProductoCustom } from "../../domain/entities/ProductoCustom";
import {
  ProductosCustomListResponse,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
} from "../../domain/repositories/IProductosCustomRepository";

export interface IProductosCustomService {
  getProductosByNegocio(idNegocio: number): Promise<ProductosCustomListResponse>;

  acumularProgresoCustom(
    req: AcumularProgresoCustomRequest
  ): Promise<{ resp: any; data?: any }>;

  canjearProgresoCustom(
    req: CanjearProgresoCustomRequest
  ): Promise<{ resp: any; data?: any }>;
}

export type { ProductoCustom, AcumularProgresoCustomRequest, CanjearProgresoCustomRequest };
