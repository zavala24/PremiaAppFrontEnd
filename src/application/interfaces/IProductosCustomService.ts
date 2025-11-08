import { ProductoCustom } from "../../domain/entities/ProductoCustom";
import {
  ProductosCustomListResponse,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
  GetProgresoCustomParams,          // 👈 nuevo
  ProgresoCustomDto,                // 👈 nuevo
} from "../../domain/repositories/IProductosCustomRepository";

export interface IProductosCustomService {
  getProductosByNegocio(idNegocio: number): Promise<ProductosCustomListResponse>;

  acumularProgresoCustom(
    req: AcumularProgresoCustomRequest
  ): Promise<{ resp: any; data?: any }>;

  canjearProgresoCustom(
    req: CanjearProgresoCustomRequest
  ): Promise<{ resp: any; data?: any }>;

  /** ===== NUEVO: progreso de una promo por cliente ===== */
  getProgresoCustom(
    params: GetProgresoCustomParams
  ): Promise<{ resp: any; data: ProgresoCustomDto | null }>;
}

export type {
  ProductoCustom,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
  GetProgresoCustomParams,          // 👈 export
  ProgresoCustomDto,                // 👈 export
};
