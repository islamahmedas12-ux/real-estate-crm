import apiClient from './client';
import type { Activity } from '../types';

export const activitiesApi = {
  getByEntity(entityType: string, entityId: string): Promise<Activity[]> {
    return apiClient
      .get<Activity[]>(`/api/activities/entity/${entityType}/${entityId}`)
      .then((r) => r.data);
  },
};
