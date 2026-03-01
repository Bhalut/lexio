import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';
import { AppService } from './app.service';

describe('AppController', () => {
  let app: TestingModule;

  beforeAll(async () => {
    app = await Test.createTestingModule({
      controllers: [AppController],
      providers: [AppService],
    }).compile();
  });

  describe('getPlatformInfo', () => {
    it('should return the platform status payload', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getPlatformInfo()).toMatchObject({
        service: 'lexio-api',
        status: 'ok',
      });
    });
  });

  describe('getHealth', () => {
    it('should return the health payload', () => {
      const appController = app.get<AppController>(AppController);
      expect(appController.getHealth()).toMatchObject({
        service: 'lexio-api',
        status: 'ok',
      });
    });
  });
});
