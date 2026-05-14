import { SetMetadata, applyDecorators, UseInterceptors } from '@nestjs/common';
import { IdempotencyInterceptor } from '../interceptors/idempotency.interceptor.js';

export const IDEMPOTENT_KEY = 'idempotency';

export function Idempotent(): MethodDecorator & ClassDecorator {
  return applyDecorators(
    SetMetadata(IDEMPOTENT_KEY, true),
    UseInterceptors(IdempotencyInterceptor),
  );
}