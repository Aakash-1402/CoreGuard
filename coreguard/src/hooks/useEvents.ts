'use client';
import useSWR from 'swr';
import type { EventFilters, PaginatedResponse, RiskEvent } from '@/types';

function buildUrl(filters: EventFilters): string {
  const params = new URLSearchParams();
  if (filters.severity) params.set('severity', filters.severity);
  if (filters.status) params.set('status', filters.status);
  if (filters.source) params.set('source', filters.source);
  if (filters.search) params.set('search', filters.search);
  if (filters.sort) params.set('sort', filters.sort);
  if (filters.order) params.set('order', filters.order);
  if (filters.page) params.set('page', String(filters.page));
  params.set('limit', String(filters.limit ?? 20));
  return `/api/events?${params.toString()}`;
}

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEvents(filters: EventFilters, refreshInterval = 30_000) {
  const { data, error, isLoading, isValidating, mutate } = useSWR<{
    data: RiskEvent[];
    meta: PaginatedResponse<RiskEvent>['meta'];
  }>(buildUrl(filters), fetcher, {
    refreshInterval,
    revalidateOnFocus: true,
    dedupingInterval: 2000,
  });

  return {
    events: data?.data ?? [],
    meta: data?.meta ?? { page: 1, limit: 20, total: 0, totalPages: 0 },
    isLoading,
    isRefreshing: isValidating && !isLoading,
    error,
    refresh: mutate,
  };
}