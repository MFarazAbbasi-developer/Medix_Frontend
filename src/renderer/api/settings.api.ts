import { apiClient, ApiResponse } from './client';

export type SettingDataType = 'STRING' | 'NUMBER' | 'BOOLEAN' | 'JSON';

export interface SystemSetting {
  id: string;
  organizationId: string;
  key: string;
  value: string;
  dataType: SettingDataType;
  group: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SettingsResponse {
  items: SystemSetting[];
  map: Record<string, string>;
}

export interface SettingItemDto {
  key: string;
  value: string;
  dataType?: SettingDataType;
  group?: string;
  description?: string;
}

export interface UpdateSettingsDto {
  settings: SettingItemDto[];
}

export const settingsApi = {
  getSettings: async (): Promise<SettingsResponse> => {
    const response = (await apiClient.get('/settings')) as unknown as ApiResponse<SettingsResponse>;
    return response.data;
  },

  updateSettings: async (
    data: UpdateSettingsDto,
  ): Promise<SettingsResponse> => {
    const response = (await apiClient.patch('/settings', data)) as unknown as ApiResponse<SettingsResponse>;
    return response.data;
  },
};
