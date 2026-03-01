import { Test } from '@nestjs/testing';
import { AppService } from './app.service';

describe('AppService', () => {
  let service: AppService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [AppService],
    }).compile();

    service = app.get<AppService>(AppService);
  });

  describe('getPlatformInfo', () => {
    it('should return the platform status payload', () => {
      expect(service.getPlatformInfo()).toMatchObject({
        service: 'lexio-api',
        status: 'ok',
      });
    });
  });

  describe('getHealth', () => {
    it('should return the health payload', () => {
      expect(service.getHealth()).toMatchObject({
        service: 'lexio-api',
        status: 'ok',
      });
    });
  });
});
