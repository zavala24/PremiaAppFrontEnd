export type TipoAcumulacion = "Compra" | "Monto" | "Cantidad";

export interface ProductoCustom {
  idProductoCustom: number;
  idNegocio: number;
  nombreProducto: string;
  descripcion: string | null;
  meta: number;
  porcentajePorCompra: number; // 0..100
  tipoAcumulacion: TipoAcumulacion;
  recompensa: string | null;
  estado: boolean;
  creadoPor?: string | null;
  creadoFecha?: string | null;
  actualizadoPor?: string | null;
  actualizadoFecha?: string | null;
}
