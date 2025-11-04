import { describe, it, expect } from 'vitest';
import { mockAuthService } from '@/lib/mock/services';

describe('Auth Service', () => {
  it('should send magic link successfully', async () => {
    const result = await mockAuthService.sendMagicLink('test@example.com');

    expect(result.success).toBe(true);
    expect(result.message).toContain('Magic link sent');
  });

  it('should get current user', async () => {
    const user = await mockAuthService.getCurrentUser();

    expect(user).toBeDefined();
    expect(user?.email).toBeDefined();
    expect(user?.full_name).toBeDefined();
    expect(user?.role).toBe('medical_rep');
  });

  it('should sign out user', async () => {
    await expect(mockAuthService.signOut()).resolves.toBeUndefined();
  });
});
