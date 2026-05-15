'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useMemo } from 'react';
import type { EventFilters } from '@/types';

export function useFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const filters: EventFilters = useMemo(() => ({
    severity: searchParams.get('severity') ?? undefined,
    status: searchParams.get('status') ?? undefined,
    source: searchParams.get('source') ?? undefined,
    search: searchParams.get('search') ?? undefined,
    sort: searchParams.get('sort') ?? 'detected_at',
    order: (searchParams.get('order') as 'asc' | 'desc') ?? 'desc',
    page: Number(searchParams.get('page')) || 1,
  }), [searchParams]);

  const setFilter = useCallback(
    (key: keyof EventFilters, value: string | undefined) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value && value.length > 0) {
        params.set(key, value);
      } else {
        params.delete(key);
      }
      if (key !== 'page') params.set('page', '1');
      router.push(`/events?${params.toString()}`);
    },
    [router, searchParams],
  );

  const clearFilters = useCallback(() => {
    router.push('/events');
  }, [router]);

  return { filters, setFilter, clearFilters };
}