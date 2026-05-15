export interface Note {
  id: string;
  event_id: string;
  author_id: string;
  author_name?: string;
  content: string;
  created_at: string;
}