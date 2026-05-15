import { BaseRepository } from './base.repository';
import type { User } from '@/types';

export class UserRepository extends BaseRepository<User> {
  async findByEmail(email: string): Promise<User | null> {
    return this.queryOneRow(`SELECT * FROM users WHERE email = $1::text`, [email]);
  }

  async findById(id: string): Promise<User | null> {
    return this.queryOneRow(`SELECT * FROM users WHERE id = $1::uuid`, [id]);
  }

  async findByRole(role: string): Promise<User[]> {
    return this.queryRows(`SELECT * FROM users WHERE role = $1::user_role ORDER BY name`, [role]);
  }

  async findAll(): Promise<User[]> {
    return this.queryRows(`SELECT * FROM users ORDER BY name`);
  }
}