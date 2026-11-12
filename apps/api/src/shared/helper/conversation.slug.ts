import { randomBytes } from 'crypto';

export function createConversationSlug(): string {
  const randomPart = randomBytes(8).toString('hex');
  return `conv-${randomPart}`;
}
