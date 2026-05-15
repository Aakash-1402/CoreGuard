'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';

interface AssignOwnerProps {
  currentOwnerId: string | null;
  currentOwnerName?: string;
  users: { id: string; name: string }[];
  onAssign: (userId: string) => Promise<void>;
  disabled?: boolean;
}

export function AssignOwner({ currentOwnerId, currentOwnerName, users, onAssign, disabled }: AssignOwnerProps) {
  const [selectedId, setSelectedId] = useState(currentOwnerId ?? '');
  const [saving, setSaving] = useState(false);

  const userOptions = users.map((u) => ({ value: u.id, label: u.name }));

  const handleAssign = async () => {
    if (!selectedId || selectedId === currentOwnerId) return;
    setSaving(true);
    try {
      await onAssign(selectedId);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500 font-medium">Owner:</span>
      <Select
        value={selectedId}
        onChange={setSelectedId}
        options={userOptions}
        placeholder={currentOwnerName ?? 'Unassigned'}
        className="w-48"
      />
      <Button
        variant="primary" size="sm"
        disabled={disabled || saving || !selectedId || selectedId === currentOwnerId}
        onClick={handleAssign}
      >
        {saving ? '...' : 'Assign'}
      </Button>
    </div>
  );
}