export interface Evidence {
  id: string;
  event_id: string;
  title: string;
  link: string | null;
  type: string;
  added_by: string;
  added_by_name?: string;
  created_at: string;
}