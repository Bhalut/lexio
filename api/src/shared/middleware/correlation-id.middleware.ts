import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuid } from 'uuid';
import { AuthRequest } from '../../modules/auth/auth-request.type';

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction): void {
    const correlationId = (req.headers['x-correlation-id'] as string) || uuid();
    const authRequest = req as AuthRequest;

    req.headers['x-correlation-id'] = correlationId;
    authRequest.correlationId = correlationId;
    res.setHeader('x-correlation-id', correlationId);

    const start = Date.now();

    res.on('finish', () => {
      const duration = Date.now() - start;
      this.logger.log(
        JSON.stringify({
          correlationId,
          method: req.method,
          path: req.originalUrl,
          statusCode: res.statusCode,
          durationMs: duration,
          userAgent: req.headers['user-agent']?.substring(0, 50),
        }),
      );
    });

    next();
  }
}
