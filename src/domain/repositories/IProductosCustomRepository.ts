import { ProductoCustom } from "../entities/ProductoCustom";
import { ServiceResponse } from "../types/ServiceResponse";

/* Requests para los POST */
export interface AcumularProgresoCustomRequest {
  usuario: string;               // vendedor / quien ejecuta
  usuarioOperacion?: string | null; // opcional
  telefonoCliente: string;       // a quién se le acumula/canjea
  idProductoCustom: number;
  cantidad?: number | null;      // para Compra/Cantidad
  monto?: number | null;         // para Monto
  descripcion?: string | null;
  idNegocio: number
}

export interface CanjearProgresoCustomRequest extends AcumularProgresoCustomRequest {}

/* Respuestas */
export interface ProductosCustomListResponse {
  resp: ServiceResponse;
  data: ProductoCustom[];
}

export interface IProductosCustomRepository {
  getProductosByNegocio(idNegocio: number): Promise<ProductosCustomListResponse>;

  acumularProgresoCustom(
    req: AcumularProgresoCustomRequest
  ): Promise<{ resp: ServiceResponse; data?: any }>;

  canjearProgresoCustom(
    req: CanjearProgresoCustomRequest
  ): Promise<{ resp: ServiceResponse; data?: any }>;
}
