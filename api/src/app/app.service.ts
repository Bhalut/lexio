import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getPlatformInfo(): { service: string; status: string; timestamp: string } {
    return {
      service: 'lexio-api',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  getHealth(): {
    status: string;
    service: string;
    timestamp: string;
    uptimeSeconds: number;
  } {
    return {
      status: 'ok',
      service: 'lexio-api',
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.round(process.uptime()),
    };
  }
}
