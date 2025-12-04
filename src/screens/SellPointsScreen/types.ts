// src/presentation/screens/SellPoints/types.ts

export interface CartItem {
  id: string;
  articulo: string;
  descripcion?: string | null;
  monto: number;
  cantidad: number;
  esCustom?: boolean;
  idProductoCustom?: number | null;
  // === NUEVO CAMPO ===
  customAction?: "acumular" | "canjear" | null; 
}
export interface WhatsAppContext {
  toPhone: string;
  businessName: string;
  customerName?: string | null;
  article?: string | null;
  amount: number;
  applied: number;
  total: number;
  saldoAntes: number;
  saldoDespues: number;
  // Custom properties
  isCustom?: boolean;
  promoNombre?: string | null;
  accion?: "acumular" | "canjear" | null;
  porcentaje?: number | null;
  estado?: string | null;
  cantidadPromo?: number | null;
  cartItems?: { articulo?: string | null; cantidad: number; monto: number }[];
}

// Interfaces simplificadas para Props
export interface CustomerData {
  name: string | null;
  balance: number;
  valid: boolean | null;
}