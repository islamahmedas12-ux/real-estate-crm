import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import * as Sentry from '@sentry/node';

interface ErrorResponse {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const req = request as Request & { id?: string; user?: { id?: string; role?: string } };
    const reqId = req.id;
    const isProduction = process.env.NODE_ENV === 'production';

    // Set user context for Sentry
    if (req.user?.id) {
      Sentry.setUser({ id: req.user.id, role: req.user.role });
    }

    let statusCode = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Internal server error';
    let error = 'Internal Server Error';

    if (exception instanceof HttpException) {
      statusCode = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = isProduction ? 'Internal server error' : exceptionResponse;
        error = exception.name;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const resp = exceptionResponse as Record<string, unknown>;
        message = isProduction
          ? 'Internal server error'
          : ((resp['message'] as string | string[]) ?? exception.message);
        error = (resp['error'] as string) ?? exception.name;
      }
    } else if (exception instanceof Error) {
      this.logger.error({ reqId, err: exception.message }, exception.stack);
      if (isProduction) {
        message = 'Internal server error';
        error = 'Internal Server Error';
      } else {
        message = exception.message;
        error = exception.name;
      }
    } else {
      this.logger.error({ reqId }, 'Unknown exception');
    }

    if (isProduction) {
      message = 'Internal server error';
      error = 'Internal Server Error';
    }

    const body: ErrorResponse = {
      statusCode,
      message,
      error,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    response.status(statusCode).json(body);
  }
}
