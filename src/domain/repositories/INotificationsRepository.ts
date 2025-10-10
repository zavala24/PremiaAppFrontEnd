// src/domain/repositories/INotificationsRepository.ts
import { ServiceResponse } from "../dto/ServiceResponse";
import { Paged } from "../dto/Pagination";
import { AppNotification } from "../entities/AppNotification";

export type NotificationsQuery = {
  numeroTelefono: string;
  page: number;
  pageSize: number;
  search?: string; 
};

export interface INotificationsRepository {
  GetNotificacionesByUsuarioPaged(
    params: NotificationsQuery
  ): Promise<ServiceResponse<Paged<AppNotification>>>;
}
