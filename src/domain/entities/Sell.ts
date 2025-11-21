// src/domain/entities/Sell.ts

// -------------------------------
// Payload para una sola venta
// -------------------------------
export interface InsertSellPayload {
  NegocioId: number;
  TelefonoCliente: string;
  CreadoPor: string;

  // Datos de la venta
  Articulo?: string | null;
  Descripcion?: string | null;
  Monto: number;
  Cantidad: number;

  PuntosAplicados: boolean;

  TotalCobrado: number;
  SaldoAntes: number;
  SaldoDespues: number;
}

// Lo que regresa una sola venta
export interface InsertSellResult {
  id?: string;
  totalCobrado?: number;
  saldoAntes?: number;
  saldoDespues?: number;
  puntosGanados?: number;
}

// -------------------------------
// Payload para múltiples ventas
// -------------------------------
export interface InsertManySellsPayload {
  TelefonoCliente: string;
  NegocioId: number;
  CreadoPor: string;

  // Lista de ventas
  Ventas: InsertManySellsItem[];
}

// Cada venta dentro del batch
export interface InsertManySellsItem {
  Articulo?: string | null;
  Descripcion?: string | null;

  Monto: number;
  Cantidad: number;

  PuntosAplicados: boolean;

  SaldoAntes: number;
}

// Resultado que tu backend debería regresar
export interface InsertManySellsResult {
  ids: string[];
}
