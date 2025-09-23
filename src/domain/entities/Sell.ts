// src/domain/entities/Sell.ts
export interface InsertSellPayload {
  NegocioId: number;
  TelefonoCliente: string;
  CreadoPor: string;
  Articulo?: string | null;
  Descripcion?: string | null;
  Monto: number;
  PuntosAplicados: boolean;
  TotalCobrado: number;
  SaldoAntes: number;
  SaldoDespues: number;
}

export interface InsertSellResult {
  id?: string;
  totalCobrado?: number;
  saldoAntes?: number;
  saldoDespues?: number;
  puntosGanados?: number;
}
