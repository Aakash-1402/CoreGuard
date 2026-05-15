'use client';

import { useParams } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { Card, CardHeader, CardContent } from '@/components/ui/Card';
import { Spinner } from '@/components/ui/Spinner';
import { ErrorBanner } from '@/components/ui/ErrorBanner';
import { EventDetailPanel } from '@/components/events/EventDetailPanel';
import { EventTimeline } from '@/components/events/EventTimeline';
import { EventActions } from '@/components/events/EventActions';
import { AssignOwner } from '@/components/events/AssignOwner';
import { NotesList } from '@/components/events/NotesList';
import { AddNoteForm } from '@/components/events/AddNoteForm';
import { EvidenceList } from '@/components/events/EvidenceList';
import { useEventDetail } from '@/hooks/useEventDetail';
import type { EventStatus } from '@/types';

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { detail, isLoading, error, refresh } = useEventDetail(id);
  const [actionError, setActionError] = useState<string | null>(null);
  const [users, setUsers] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    fetch('/api/users', { credentials: 'include' })
      .then((r) => r.json())
      .then((d) => setUsers(d.data ?? []))
      .catch(() => {});
  }, []);

  const handleStatusAction = useCallback(async (status: EventStatus) => {
    setActionError(null);
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message ?? 'Action failed');
    }
    refresh();
  }, [id, refresh]);

  const handleAssignOwner = useCallback(async (userId: string) => {
    setActionError(null);
    const res = await fetch(`/api/events/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ owner_id: userId }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message ?? 'Assignment failed');
    }
    refresh();
  }, [id, refresh]);

  const handleAddNote = useCallback(async (content: string) => {
    setActionError(null);
    const res = await fetch(`/api/events/${id}/notes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ content }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.error?.message ?? 'Failed to add note');
    }
    refresh();
  }, [id, refresh]);

  if (isLoading) return <Spinner className="py-16" />;
  if (error) return <ErrorBanner message="Failed to load event detail" onRetry={refresh} />;
  if (!detail) return <ErrorBanner message="Event not found" />;

  const { event, notes, evidence, auditLog } = detail;

  return (
    <div className="space-y-6">
      <EventDetailPanel event={event} />

      {actionError && (
        <ErrorBanner message={actionError} onRetry={() => setActionError(null)} />
      )}

      <div className="flex flex-wrap items-center gap-4">
        <EventActions currentStatus={event.status} onAction={handleStatusAction} />
        <AssignOwner
          currentOwnerId={event.owner_id}
          currentOwnerName={event.owner_name}
          users={users}
          onAssign={handleAssignOwner}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader><h3 className="text-base font-semibold">Audit Timeline</h3></CardHeader>
            <CardContent><EventTimeline entries={auditLog} /></CardContent>
          </Card>
          <Card>
            <CardHeader><h3 className="text-base font-semibold">Evidence ({evidence.length})</h3></CardHeader>
            <CardContent><EvidenceList items={evidence} /></CardContent>
          </Card>
        </div>
        <div className="space-y-6">
          <Card>
            <CardHeader><h3 className="text-base font-semibold">Notes ({notes.length})</h3></CardHeader>
            <CardContent>
              <div className="space-y-3">
                <AddNoteForm onSubmit={handleAddNote} />
                <NotesList notes={notes} />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}