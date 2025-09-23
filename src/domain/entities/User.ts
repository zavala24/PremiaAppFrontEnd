// src/domain/entities/User.ts

export type Role = "User" | "Admin" | "SuperAdmin";

export interface User {
  nombre: string;
  telefono?: string; // opcional, si el backend lo devuelve
  role: Role;
  apellidoPaterno?: string;
  apellidoMaterno?: string;
  email?:string;
  puntosAcumulados?: number;
}
