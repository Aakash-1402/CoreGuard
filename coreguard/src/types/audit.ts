export interface AuditEntry {
  id: string;
  event_id: string;
  changed_by: string;
  changed_by_name?: string;
  action: string;
  field_changed: string | null;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
}