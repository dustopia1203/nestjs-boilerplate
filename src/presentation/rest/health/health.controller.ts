import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, type HealthCheckResult } from '@nestjs/terminus';

/**
 * K8s health probe endpoints (`/health/live`, `/health/ready`, `/health/startup`).
 * Each probe calls `HealthCheckService.check([])` — add real indicators to the array as needed.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  /**
   * Injects the Terminus health-check service.
   *
   * @param healthCheckService - Runs health indicator arrays and aggregates results.
   */
  public constructor(private readonly healthCheckService: HealthCheckService) {}

  /**
   * Liveness probe — signals whether the process is alive.
   *
   * @returns Aggregated health-check result from all registered indicators.
   */
  @Get('live')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiResponse({ status: 200, description: 'Application is alive' })
  @ApiResponse({ status: 503, description: 'Application is not alive' })
  public liveness(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([]);
  }

  /**
   * Readiness probe — signals whether the app can serve traffic.
   *
   * @returns Aggregated health-check result from all registered indicators.
   */
  @Get('ready')
  @HealthCheck()
  @ApiOperation({ summary: 'Readiness probe' })
  @ApiResponse({ status: 200, description: 'Application is ready to serve traffic' })
  @ApiResponse({ status: 503, description: 'Application is not ready' })
  public readiness(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([]);
  }

  /**
   * Startup probe — signals whether the app has finished initialising.
   *
   * @returns Aggregated health-check result from all registered indicators.
   */
  @Get('startup')
  @HealthCheck()
  @ApiOperation({ summary: 'Startup probe' })
  @ApiResponse({ status: 200, description: 'Application has started successfully' })
  @ApiResponse({ status: 503, description: 'Application has not started yet' })
  public startup(): Promise<HealthCheckResult> {
    return this.healthCheckService.check([]);
  }
}
