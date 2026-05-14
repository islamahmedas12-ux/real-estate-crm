import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

declare global {
  interface Express {
    interface Request {
      id: string;
    }
  }
}

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger(CorrelationIdMiddleware.name);

  use(req: Request, res: Response, next: NextFunction) {
    const id = req.headers['x-request-id'] as string ?? randomUUID();
    req.id = id;
    res.setHeader('X-Request-Id', id);
    this.logger.log(`Request ${id} started: ${req.method} ${req.url}`);
    next();
  }
}