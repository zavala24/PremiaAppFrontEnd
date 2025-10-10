import { Paged } from "../../domain/dto/Pagination";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { AppNotification } from "../../domain/entities/AppNotification";

export type NotificationsQuery = {
  numeroTelefono: string;
  page: number;
  pageSize: number;
  search?: string;
};

export interface INotificationsService {
  GetNotificacionesByUsuarioPaged(
    params: NotificationsQuery
  ): Promise<ServiceResponse<Paged<AppNotification>>>;
}
