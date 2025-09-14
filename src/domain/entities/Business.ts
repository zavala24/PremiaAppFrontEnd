export interface BusinessConfig {
  id: number;
  porcentajeVentas: number;    
  urlLogo?: string | null;
  activo: boolean;
}

export interface Business {
  id: number;
  name: string;
  category?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  sitioWeb?: string | null;
  direccion?: string | null;
  descripcion?: string | null;

  configuracion?: BusinessConfig | null;
}