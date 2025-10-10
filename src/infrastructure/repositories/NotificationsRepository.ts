// src/infrastructure/repositories/NotificationsRepository.ts
import { api } from "../http/api";
import {
  INotificationsRepository,
  NotificationsQuery,
} from "../../domain/repositories/INotificationsRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { AppNotification } from "../../domain/entities/AppNotification";

// Respuestas genéricas como en tu BusinessRepository
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

// Mapper JSON -> dominio (ajusta los nombres si tu backend cambia)
const mapApiNotification = (n: any): AppNotification => ({
  id: n.idNotificacion ?? n.id ?? 0,
  userId: n.idUsuario,
  businessId: n.idNegocio,
  title: n.titulo,
  body: n.cuerpo,
  logoUrl: n.urlLogo ?? null,
  createdAt: n.creadoCuando,        // ISO string
  businessName: n.negocioNombre ?? n.nombreNegocio ?? "", // el backend debe enviarlo
});

export class NotificationsRepository implements INotificationsRepository {
async GetNotificacionesByUsuarioPaged(
  params: NotificationsQuery
): Promise<ServiceResponse<Paged<AppNotification>>> {

  const { numeroTelefono, page, pageSize, search } = params;

  const { data } = await api.get<ApiResponse<ApiPaged<any>>>(
    "/Notificaciones/GetNotificacionesUsuario",
    {
      params: {
        numeroTelefono,
        page,
        pageSize,
        ...(search ? { search } : {}), // si no hay search, no lo manda
      },
    }
  );

  const mapped: Paged<AppNotification> | null = data.data
    ? {
        ...data.data,
        items: (data.data.items || []).map(mapApiNotification),
      }
    : null;
  return {
    status: data.status,
    message: data.message,
    data: mapped,      // 👈 el paginado va aquí
  };
}
}
