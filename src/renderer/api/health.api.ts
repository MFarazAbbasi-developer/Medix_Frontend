import { apiClient, ApiResponse } from './client';

export interface HealthData {
  status: 'ok' | 'degraded' | 'error';
  appName: string;
  appVersion: string;
  environment: string;
  uptimeSeconds: number;
  timestamp: string;
  database: {
    status: 'connected' | 'disconnected';
    type: 'postgresql';
  };
}

export const healthApi = {
  getHealth: async (): Promise<HealthData> => {
    const response = (await apiClient.get(
      '/health',
    )) as unknown as ApiResponse<HealthData>;
    return response.data;
  },
};
