'use client';
import { formatDate } from '@/lib/utils';
import type { Note } from '@/types';

interface NotesListProps {
  notes: Note[];
}

export function NotesList({ notes }: NotesListProps) {
  if (notes.length === 0) {
    return <p className="text-sm text-gray-500 italic py-4">No notes yet.</p>;
  }

  return (
    <div className="space-y-3">
      {notes.map((note) => (
        <div key={note.id} className="p-3 bg-gray-50 rounded-md border border-gray-200">
          <p className="text-sm text-gray-800">{note.content}</p>
          <p className="text-xs text-gray-400 mt-2">
            {note.author_name ?? note.author_id} &middot; {formatDate(note.created_at)}
          </p>
        </div>
      ))}
    </div>
  );
}