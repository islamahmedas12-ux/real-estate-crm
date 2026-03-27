import apiClient from './client'
import type { CompanySettings, ConfigItem } from '../types/reports'

const BASE = '/api/settings'

export const settingsApi = {
  getCompany() {
    return apiClient
      .get<CompanySettings>(`${BASE}/company`)
      .then((r) => r.data)
  },

  updateCompany(data: CompanySettings) {
    return apiClient
      .put<CompanySettings>(`${BASE}/company`, data)
      .then((r) => r.data)
  },

  getPropertyTypes() {
    return apiClient
      .get<ConfigItem[]>(`${BASE}/property-types`)
      .then((r) => r.data)
  },

  updatePropertyTypes(items: ConfigItem[]) {
    return apiClient
      .put<ConfigItem[]>(`${BASE}/property-types`, { items })
      .then((r) => r.data)
  },

  getLeadSources() {
    return apiClient
      .get<ConfigItem[]>(`${BASE}/lead-sources`)
      .then((r) => r.data)
  },

  updateLeadSources(items: ConfigItem[]) {
    return apiClient
      .put<ConfigItem[]>(`${BASE}/lead-sources`, { items })
      .then((r) => r.data)
  },
}
