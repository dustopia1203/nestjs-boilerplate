import type { IncomingMessage, ServerResponse } from 'node:http';

import { generateRequestId } from './request-id';

const UUID_V7_PATTERN = /^[\da-f]{8}-[\da-f]{4}-7[\da-f]{3}-[89ab][\da-f]{3}-[\da-f]{12}$/;

describe('generateRequestId', () => {
  it('returns a UUID v7 and exposes it on the response', () => {
    const setHeader = jest.fn();
    const request = { headers: {} } as IncomingMessage;
    const response = { setHeader } as unknown as ServerResponse;

    const requestId = generateRequestId(request, response);

    expect(requestId).toMatch(UUID_V7_PATTERN);
    expect(setHeader).toHaveBeenCalledWith('X-Request-Id', requestId);
  });

  it('does not reuse a client-supplied request ID', () => {
    const clientRequestId = '01943c74-3546-7a2f-a4db-2b924e28f9a9';
    const request = { headers: { 'x-request-id': clientRequestId } } as unknown as IncomingMessage;
    const response = { setHeader: jest.fn() } as unknown as ServerResponse;

    expect(generateRequestId(request, response)).not.toBe(clientRequestId);
  });
});
