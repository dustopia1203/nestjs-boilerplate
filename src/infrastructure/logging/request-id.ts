import type { IncomingMessage, ServerResponse } from 'node:http';

import { v7 as uuidv7 } from 'uuid';

/**
 * Generates a UUID v7 request ID for an HTTP request.
 *
 * @param _request - Incoming request assigned the generated ID by pino-http.
 * @param response - HTTP response receiving the request ID header.
 * @returns Generated UUID v7 request ID.
 */
export function generateRequestId(_request: IncomingMessage, response: ServerResponse): string {
  const requestId = uuidv7();
  response.setHeader('X-Request-Id', requestId);
  return requestId;
}
