import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface ErrorResponseBody {
  statusCode: number;
  error: string;
  message: string | string[];
  path: string;
  timestamp: string;
  correlationId: string | null;
}

@Catch()
@Injectable()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const context = host.switchToHttp();
    const response = context.getResponse<Response>();
    const request = context.getRequest<Request>();

    const correlationId = this.getCorrelationId(request);
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const body = this.buildResponseBody(exception, request, status, correlationId);

    if (status >= HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        JSON.stringify({
          correlationId,
          path: request.originalUrl,
          method: request.method,
          statusCode: status,
          error:
            exception instanceof Error
              ? {
                  name: exception.name,
                  message: exception.message,
                  stack: exception.stack,
                }
              : String(exception),
        }),
      );
    }

    response.status(status).json(body);
  }

  private buildResponseBody(
    exception: unknown,
    request: Request,
    status: number,
    correlationId: string | null,
  ): ErrorResponseBody {
    if (exception instanceof HttpException) {
      const exceptionResponse = exception.getResponse();
      if (typeof exceptionResponse === 'string') {
        return {
          statusCode: status,
          error: exception.name,
          message: exceptionResponse,
          path: request.originalUrl,
          timestamp: new Date().toISOString(),
          correlationId,
        };
      }

      const normalized = exceptionResponse as {
        message?: string | string[];
        error?: string;
      };

      return {
        statusCode: status,
        error: normalized.error || exception.name,
        message: normalized.message || exception.message,
        path: request.originalUrl,
        timestamp: new Date().toISOString(),
        correlationId,
      };
    }

    return {
      statusCode: status,
      error: 'InternalServerError',
      message: 'An unexpected error occurred.',
      path: request.originalUrl,
      timestamp: new Date().toISOString(),
      correlationId,
    };
  }

  private getCorrelationId(request: Request): string | null {
    const headerValue = request.headers['x-correlation-id'];
    if (Array.isArray(headerValue)) {
      return headerValue[0] || null;
    }

    return headerValue || null;
  }
}
