import { type HealthCheckResult, HealthCheckService } from '@nestjs/terminus';
import { Test, type TestingModule } from '@nestjs/testing';

import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  let check: jest.Mock;

  beforeEach(async () => {
    check = jest.fn();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthCheckService,
          useValue: { check },
        },
      ],
    }).compile();

    controller = module.get<HealthController>(HealthController);
  });

  const okResult: HealthCheckResult = {
    status: 'ok',
    info: {},
    error: {},
    details: {},
  };

  describe('liveness', () => {
    it('returns the result of HealthCheckService.check()', async () => {
      check.mockResolvedValueOnce(okResult);
      await expect(controller.liveness()).resolves.toBe(okResult);
      expect(check).toHaveBeenCalledWith([]);
    });

    it('propagates rejections from HealthCheckService.check()', async () => {
      const error = new Error('unhealthy');
      check.mockRejectedValueOnce(error);
      await expect(controller.liveness()).rejects.toBe(error);
    });
  });

  describe('readiness', () => {
    it('returns the result of HealthCheckService.check()', async () => {
      check.mockResolvedValueOnce(okResult);
      await expect(controller.readiness()).resolves.toBe(okResult);
      expect(check).toHaveBeenCalledWith([]);
    });

    it('propagates rejections from HealthCheckService.check()', async () => {
      const error = new Error('not ready');
      check.mockRejectedValueOnce(error);
      await expect(controller.readiness()).rejects.toBe(error);
    });
  });

  describe('startup', () => {
    it('returns the result of HealthCheckService.check()', async () => {
      check.mockResolvedValueOnce(okResult);
      await expect(controller.startup()).resolves.toBe(okResult);
      expect(check).toHaveBeenCalledWith([]);
    });

    it('propagates rejections from HealthCheckService.check()', async () => {
      const error = new Error('not started');
      check.mockRejectedValueOnce(error);
      await expect(controller.startup()).rejects.toBe(error);
    });
  });
});
