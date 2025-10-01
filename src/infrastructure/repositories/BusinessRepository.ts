// src/infrastructure/repositories/BusinessRepository.ts
import { api } from "../http/api";
import {
  IBusinessRepository,
  BusinessQuery,
} from "../../domain/repositories/IBusinessRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { Business } from "../../domain/entities/Business";
import { NegocioFollowTelefonoDto } from "../../domain/entities/NegocioFollowUsuarioDto";

// Envolturas genéricas del backend
type ApiResponse<T> = { status: number; message: string; data: T | null };
type ApiPaged<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasPrev: boolean;
  hasNext: boolean;
};

// Mapper JSON -> dominio
const mapApiBusiness = (n: any): Business => ({
  id: n.idNegocio,
  name: n.nombre,
  category: n.categoria ?? null,
  facebook: n.facebook ?? null,
  instagram: n.instagram ?? null,
  sitioWeb: n.sitioWeb ?? null,
  direccion: n.direccion ?? null,
  descripcion: n.descripcion ?? null,
  configuracion: n?.configuracion
    ? {
        id: n.configuracion.idConfiguracionNegocio,
        porcentajeVentas: n.configuracion.porcentajeVentas,
        urlLogo: n.configuracion.urlLogo ?? null,
        activo: !!n.configuracion.activo,
      }
    : null,
    puntosAcumulados: n.puntosAcumulados ?? n.PuntosAcumulados
});

export class BusinessRepository implements IBusinessRepository {
  async getPaged(
    params: BusinessQuery
  ): Promise<ServiceResponse<Paged<Business>>> {
    const { data } = await api.get<ApiResponse<ApiPaged<any>>>(
      "/Negocio/GetNegociosPaged",
      { params }
    );

    const mapped = data.data
      ? {
          ...data.data,
          items: data.data.items.map(mapApiBusiness),
        }
      : null;

    return {
      status: data.status,
      message: data.message,
      data: mapped,
    };
  }

  async getNegocioConfigByTelefono(phone: string): Promise<ServiceResponse<Business>> {
    const { data } = await api.get<ApiResponse<any>>(
      "/Negocio/GetNegocioConfigByTelefonoAsync",
      { params: { telefono: phone } }
    );

    return {
      status: data.status,
      message: data.message,
      data: data.data ? mapApiBusiness(data.data) : null,
    };
  }

  async actualizarSeguirNegocioByTelefono(
    dto: NegocioFollowTelefonoDto
  ): Promise<ServiceResponse<Business>> {
    const { data } = await api.post<ApiResponse<any>>(
      "/Negocio/InsertUpdateSeguirNegocioByUsuario",
      dto 
    );

    return {
      status: data.status,
      message: data.message,
      data: data.data ? mapApiBusiness(data.data) : null,
    };
  }

    async getNegociosSeguidosByTelefono(phone: string): Promise<ServiceResponse<Business[]>> {
    const { data } = await api.get<ApiResponse<any>>(
      "/Negocio/GetNegociosSeguidosByTelefono",
      { params: { telefono: phone } }
    );
    console.log("DATAAAAA",data.data)
    const raw = data.data;
    const arr: any[] = Array.isArray(raw) ? raw : raw?.items ?? [];
    return {
      status: data.status,
      message: data.message,
      data: arr.map(mapApiBusiness),
    };
  }
  
}
