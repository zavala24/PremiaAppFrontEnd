export interface BusinessConfig {
  id: number;
  porcentajeVentas: number;    
  urlLogo?: string | null;
  activo: boolean;
  permitirConfiguracionPersonalizada?: boolean;
}

export interface Business {
  idNegocio: number;
  name: string;
  category?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;
  direccion?: string | null;
  descripcion?: string | null;
  puntosAcumulados?: number | null;
  configuracion?: BusinessConfig | null;
}