import { timingSafeEqual } from 'node:crypto';

export type AdminTokenStatus = 'VALID' | 'INVALID' | 'NOT_CONFIGURED';

export function validateAdminBearerToken(
  authorizationHeader: string | undefined,
  expectedToken: string | undefined
): AdminTokenStatus {
  if (!expectedToken) return 'NOT_CONFIGURED';
  if (!authorizationHeader?.startsWith('Bearer ')) return 'INVALID';

  const provided = Buffer.from(authorizationHeader.slice('Bearer '.length));
  const expected = Buffer.from(expectedToken);
  if (provided.length !== expected.length) return 'INVALID';

  return timingSafeEqual(provided, expected) ? 'VALID' : 'INVALID';
}
