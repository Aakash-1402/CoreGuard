import { NextResponse } from 'next/server';
import { AppError } from './errors';
import { createLogger } from './logger';

const logger = createLogger('ApiResponse');

export class ApiResponse {
  static success<T>(data: T, meta?: Record<string, unknown>) {
    const body: Record<string, unknown> = { data };
    if (meta) { body.meta = meta; }
    return NextResponse.json(body, { status: 200 });
  }

  static created<T>(data: T) {
    return NextResponse.json({ data }, { status: 201 });
  }

  static error(error: AppError) {
    logger.warn({ code: error.code, message: error.message }, 'API error');
    return NextResponse.json(error.toJSON(), { status: error.statusCode });
  }

  static internalError(error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    logger.error({ err: error instanceof Error ? error : undefined }, 'Internal server error');
    return NextResponse.json(
      { error: { code: 'INTERNAL_ERROR', message } },
      { status: 500 },
    );
  }
}