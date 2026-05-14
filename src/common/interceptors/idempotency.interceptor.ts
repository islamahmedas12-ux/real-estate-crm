import {
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Injectable,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, from, throwError, of } from 'rxjs';
import { concatMap, tap, catchError } from 'rxjs/operators';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class IdempotencyInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();

    const idempotencyKey = request.headers['idempotency-key'];
    if (!idempotencyKey) {
      return next.handle();
    }

    const endpoint = request.route?.path ?? request.url;
    const userId = request.user?.id ?? null;

    // Look up prior response
    const existing = await this.prisma.idempotencyKey.findUnique({
      where: {
        key_endpoint: {
          key: idempotencyKey,
          endpoint,
        },
      },
    });

    if (existing) {
      // Check if belongs to same user
      if (userId && existing.userId && existing.userId !== userId) {
        return throwError(
          () => new HttpException('Idempotency key already used by different user', HttpStatus.CONFLICT),
        );
      }
      response.setHeader('Idempotency-Status', 'replayed');
      return of(existing.response as object);
    }

    // Execute handler and store response
    return next.handle().pipe(
      concatMap(async (responseBody) => {
        try {
          await this.prisma.idempotencyKey.create({
            data: {
              key: idempotencyKey,
              endpoint,
              userId,
              response: responseBody as object,
            },
          });
        } catch {
          // Best-effort — don't fail if we can't store the key
        }
        return responseBody;
      }),
      catchError((err) => {
        return throwError(() => err);
      }),
    );
  }
}