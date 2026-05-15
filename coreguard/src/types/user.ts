export type UserRole = 'operator' | 'manager';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}