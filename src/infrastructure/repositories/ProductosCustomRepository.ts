import { api } from "../http/api";
import { ProductoCustom } from "../../domain/entities/ProductoCustom";
import {
  IProductosCustomRepository,
  ProductosCustomListResponse,
  AcumularProgresoCustomRequest,
  CanjearProgresoCustomRequest,
  GetProgresoCustomParams,      // 👈 nuevo
  ProgresoCustomDto,            // 👈 nuevo
} from "../../domain/repositories/IProductosCustomRepository";
import { ServiceResponse } from "../../domain/types/ServiceResponse";

const mapResponse = (res: any): ServiceResponse => {
  const body = res?.data ?? {};
  const status = body?.status ?? res?.status;
  const message =
    body?.message ??
    (typeof status === "number" && status === 201
      ? "Operación realizada correctamente."
      : "Operación finalizada");
  const success =
    body?.success ?? (typeof status === "number" ? status >= 200 && status < 300 : undefined);
  return { status, success, message };
};

export class ProductosCustomRepository implements IProductosCustomRepository {
  async getProductosByNegocio(idNegocio: number): Promise<ProductosCustomListResponse> {
    const res = await api.get("/ProductosCustom/GetProductosCustomByIdNegocio", {
      params: { idNegocio },
      validateStatus: () => true,
    });

    const resp = mapResponse(res);
    const body = res?.data ?? {};
    const data: ProductoCustom[] = Array.isArray(body?.data) ? body.data.map(normalize) : [];

    return { resp, data };
  }

  async acumularProgresoCustom(req: AcumularProgresoCustomRequest) {
    const res = await api.post("/ProductosCustom/AcumularProgresoCustom", req, {
      validateStatus: () => true,
    });
    const resp = mapResponse(res);
    return { resp, data: res?.data?.data };
  }

  async canjearProgresoCustom(req: CanjearProgresoCustomRequest) {
    const res = await api.post("/ProductosCustom/CanjearProgresoCustom", req, {
      validateStatus: () => true,
    });
    const resp = mapResponse(res);
    return { resp, data: res?.data?.data };
  }

  /** ===== NUEVO: consumo del endpoint de progreso =====
   *  GET /ProductosCustom/GetProgresoCustom
   *  params: idNegocio, telefonoCliente, idProductoCustom
   */
  async getProgresoCustom(
    params: GetProgresoCustomParams
  ): Promise<{ resp: ServiceResponse; data: ProgresoCustomDto | null }> {
    const res = await api.get("/ProductosCustom/GetProgresoCustom", {
      params,
      validateStatus: () => true,
    });
    const resp = mapResponse(res);
    const raw = res?.data?.data;
    const data: ProgresoCustomDto | null = raw ? normalizeProgress(raw) : null;
    return { resp, data };
  }
}

/* ===== helpers ===== */
function normalize(raw: any): ProductoCustom {
  return {
    idProductoCustom: Number(raw?.idProductoCustom ?? raw?.IdProductoCustom ?? 0),
    idNegocio: Number(raw?.idNegocio ?? raw?.IdNegocio ?? 0),
    nombreProducto: String(raw?.nombreProducto ?? raw?.NombreProducto ?? ""),
    descripcion: raw?.descripcion ?? raw?.Descripcion ?? null,
    meta: Number(raw?.meta ?? raw?.Meta ?? 0),
    porcentajePorCompra: Number(raw?.porcentajePorCompra ?? raw?.PorcentajePorCompra ?? 0),
    tipoAcumulacion: (raw?.tipoAcumulacion ?? raw?.TipoAcumulacion ?? "Compra") as any,
    recompensa: raw?.recompensa ?? raw?.Recompensa ?? null,
    estado: Boolean(raw?.estado ?? raw?.Estado ?? false),
    creadoPor: raw?.creadoPor ?? raw?.CreadoPor ?? null,
    creadoFecha: raw?.creadoFecha ?? raw?.CreadoFecha ?? null,
    actualizadoPor: raw?.actualizadoPor ?? raw?.ActualizadoPor ?? null,
    actualizadoFecha: raw?.actualizadoFecha ?? raw?.ActualizadoFecha ?? null,
  };
}

/* ===== NUEVO: normalizador de progreso ===== */
function normalizeProgress(raw: any): ProgresoCustomDto {
  return {
    existeProgreso: Boolean(raw?.existeProgreso ?? raw?.ExisteProgreso ?? false),
    estado: String(raw?.estado ?? raw?.Estado ?? "Activo"),
    porcentaje: Number(raw?.porcentaje ?? raw?.Porcentaje ?? 0),
    ultimaActualizacion: String(raw?.ultimaActualizacion ?? raw?.UltimaActualizacion ?? ""),
    productoNombre: String(raw?.productoNombre ?? raw?.ProductoNombre ?? ""),
    idProductoCustom: Number(raw?.idProductoCustom ?? raw?.IdProductoCustom ?? 0),
    telefonoCliente: String(raw?.telefonoCliente ?? raw?.TelefonoCliente ?? ""),
  };
}
