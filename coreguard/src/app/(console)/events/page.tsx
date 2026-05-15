import { Suspense } from 'react';
import { EventTable } from '@/components/events/EventTable';
import { Spinner } from '@/components/ui/Spinner';

export default function EventsPage() {
  return (
    <Suspense fallback={<Spinner className="py-16" />}>
      <EventTable />
    </Suspense>
  );
}