'use client';
import useSWR from 'swr';
import type { EventDetail } from '@/types';

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export function useEventDetail(eventId: string | null) {
  const { data, error, isLoading, mutate } = useSWR<{ data: EventDetail }>(
    eventId ? `/api/events/${eventId}` : null,
    fetcher,
    { revalidateOnFocus: false },
  );

  return {
    detail: data?.data ?? null,
    isLoading,
    error,
    refresh: mutate,
  };
}