import { query, queryOne, execute } from '../connection';

export abstract class BaseRepository<T> {
  protected async queryRows<R = T>(sql: string, params?: unknown[]): Promise<R[]> {
    return query<R>(sql, params);
  }

  protected async queryOneRow<R = T>(sql: string, params?: unknown[]): Promise<R | null> {
    return queryOne<R>(sql, params);
  }

  protected async execute(sql: string, params?: unknown[]): Promise<number> {
    return execute(sql, params);
  }
}