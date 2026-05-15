'use client';
import { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface AddNoteFormProps {
  onSubmit: (content: string) => Promise<void>;
  disabled?: boolean;
}

export function AddNoteForm({ onSubmit, disabled }: AddNoteFormProps) {
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;
    setSaving(true);
    try {
      await onSubmit(content.trim());
      setContent('');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add internal note..."
        className="flex-1 rounded-md border border-gray-300 px-3 py-2 text-sm
                   focus:outline-none focus:ring-2 focus:ring-blue-500"
        disabled={disabled || saving}
      />
      <Button type="submit" variant="primary" size="sm" disabled={disabled || saving || !content.trim()}>
        {saving ? '...' : 'Add'}
      </Button>
    </form>
  );
}