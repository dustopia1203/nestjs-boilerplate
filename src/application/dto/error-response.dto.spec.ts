import { ErrorBodyDto, ErrorResponseDto } from './error-response.dto';

describe('ErrorBodyDto', () => {
  it('holds code, name, and message properties', () => {
    const dto = new ErrorBodyDto();
    dto.code = 401_000_002;
    dto.name = 'UNAUTHORISED';
    dto.message = 'User is not authenticated';
    expect(dto.code).toBe(401_000_002);
    expect(dto.name).toBe('UNAUTHORISED');
    expect(dto.message).toBe('User is not authenticated');
  });
});

describe('ErrorResponseDto', () => {
  it('holds error, timestamp, path, and traceId properties', () => {
    const body = new ErrorBodyDto();
    body.code = 401_000_002;
    body.name = 'UNAUTHORISED';
    body.message = 'User is not authenticated';

    const dto = new ErrorResponseDto();
    dto.error = body;
    dto.timestamp = 1_747_141_920;
    dto.path = '/health/live';
    dto.traceId = 'abc-123';

    expect(dto.error).toBe(body);
    expect(dto.timestamp).toBe(1_747_141_920);
    expect(dto.path).toBe('/health/live');
    expect(dto.traceId).toBe('abc-123');
  });
});
