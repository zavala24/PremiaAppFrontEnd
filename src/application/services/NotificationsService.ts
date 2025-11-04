
import { INotificationsRepository } from "../../domain/repositories/INotificationsRepository";
import { ServiceResponse } from "../../domain/dto/ServiceResponse";
import { Paged } from "../../domain/dto/Pagination";
import { AppNotification } from "../../domain/entities/AppNotification";
import { INotificationsService, NotificationsQuery } from "../interfaces/INotificationsService";


export class NotificationsService implements INotificationsService {
  constructor(private readonly repo: INotificationsRepository) {}

  async GetNotificacionesByUsuarioPaged(
    params: NotificationsQuery
  ): Promise<ServiceResponse<Paged<AppNotification>>> {
    return this.repo.GetNotificacionesByUsuarioPaged(params);
  }
}
