import { Injectable } from '@nestjs/common';

/**
 * Application service exposing simple greeting logic.
 *
 * Acts as the seed service for the bare NestJS scaffold. Replace or extend
 * once real domain modules are introduced.
 */
@Injectable()
export class AppService {
  /**
   * Build the canonical greeting returned by the root route.
   *
   * @returns The fixed greeting string `"Hello World!"`.
   */
  public getHello(): string {
    return 'Hello World!';
  }
}
