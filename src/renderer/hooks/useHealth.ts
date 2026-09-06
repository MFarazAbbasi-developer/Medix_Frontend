import { useQuery } from '@tanstack/react-query';
import { useEffect } from 'react';
import { healthApi, HealthData } from '../api';
import { useAppStore } from '../store/appStore';

export function useHealth() {
  const { apiBaseUrl, setBackendStatus, setServerInfo } = useAppStore();

  const query = useQuery<HealthData, Error>({
    queryKey: ['health', apiBaseUrl],
    queryFn: () => healthApi.getHealth(),
    refetchInterval: 15000,
    retry: 1,
    staleTime: 5000,
  });

  useEffect(() => {
    if (query.isLoading) {
      setBackendStatus('checking');
    } else if (query.isSuccess && query.data) {
      setBackendStatus(query.data.status === 'ok' ? 'connected' : 'disconnected');
      setServerInfo({
        appName: query.data.appName,
        appVersion: query.data.appVersion,
        databaseStatus: query.data.database?.status,
        uptimeSeconds: query.data.uptimeSeconds,
      });
    } else if (query.isError) {
      setBackendStatus('disconnected');
      setServerInfo(null);
    }
  }, [query.isLoading, query.isSuccess, query.isError, query.data, setBackendStatus, setServerInfo]);

  return query;
}
