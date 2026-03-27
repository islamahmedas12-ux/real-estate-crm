import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, tap } from 'rxjs';
import type { Request } from 'express';
import { ActivitiesService } from './activities.service.js';
import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import { ActivityEntityType } from '@prisma/client';

/**
 * Metadata key for @LogActivity decorator.
 */
export const LOG_ACTIVITY_KEY = 'log_activity';

export interface LogActivityOptions {
  entityType: ActivityEntityType;
  /** Extract entity ID from request params — defaults to 'id' */
  idParam?: string;
}

/**
 * Decorator to mark a controller method for automatic activity logging.
 *
 * Usage:
 *   @LogActivity({ entityType: ActivityEntityType.PROPERTY })
 *   @Post()
 *   create(...) { ... }
 */
export function LogActivity(options: LogActivityOptions): MethodDecorator {
  return (target, key, descriptor) => {
    Reflect.defineMetadata(LOG_ACTIVITY_KEY, options, descriptor.value as object);
    return descriptor;
  };
}

const METHOD_TO_ACTION: Record<string, string> = {
  POST: 'CREATE',
  PUT: 'UPDATE',
  PATCH: 'UPDATE',
  DELETE: 'DELETE',
};

@Injectable()
export class ActivityInterceptor implements NestInterceptor {
  constructor(
    private readonly activitiesService: ActivitiesService,
    private readonly reflector: Reflector,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const options = this.reflector.get<LogActivityOptions | undefined>(
      LOG_ACTIVITY_KEY,
      context.getHandler(),
    );

    if (!options) {
      return next.handle();
    }

    const request = context.switchToHttp().getRequest<Request & { user?: AuthenticatedUser }>();
    const method = request.method;
    const action = METHOD_TO_ACTION[method] ?? method;
    const idParam = options.idParam ?? 'id';
    const user = request.user;

    return next.handle().pipe(
      tap((responseBody) => {
        const rawEntityId =
          request.params[idParam] ??
          (responseBody && typeof responseBody === 'object' ? responseBody.id : undefined);
        const entityId = Array.isArray(rawEntityId) ? rawEntityId[0] : rawEntityId;

        if (!entityId) return;

        const description = `${action} ${options.entityType.toLowerCase()} ${entityId}`;

        this.activitiesService
          .log({
            type: action,
            description,
            entityType: options.entityType,
            entityId,
            performedBy: user?.id ?? 'system',
            metadata: action === 'CREATE' ? { created: true } : undefined,
          })
          .catch(() => {
            // Activity logging should never break the main flow
          });
      }),
    );
  }
}
