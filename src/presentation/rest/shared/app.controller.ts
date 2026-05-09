import { Controller, Get } from '@nestjs/common';

import { AppService } from '@application/shared/service/app.service';

/**
 * Root HTTP controller serving the smoke-test greeting endpoint.
 *
 * Wired only to verify that bootstrap, dependency injection, and routing
 * are functional in the scaffold.
 */
@Controller()
export class AppController {
  /**
   * Construct the controller and store its service dependency.
   *
   * @param appService - The application service providing greeting logic.
   */
  public constructor(private readonly appService: AppService) {}

  /**
   * Handle `GET /` and return the greeting.
   *
   * @returns The greeting string produced by {@link AppService.getHello}.
   */
  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }
}
