import { describe, expect, it } from 'vitest';
import { canAccessFacodiRoute, facodiRole } from './access';

describe('FACODI access', () => {
  it('accepts only trusted editor and admin roles', () => {
    expect(facodiRole({ role: 'editor' })).toBe('editor');
    expect(facodiRole({ role: 'admin' })).toBe('admin');
    expect(facodiRole({ role: 'superadmin' })).toBe('user');
    expect(facodiRole(undefined)).toBe('user');
  });
  it('restricts editor and admin routes', () => {
    expect(canAccessFacodiRoute('user', 'editor')).toBe(false);
    expect(canAccessFacodiRoute('editor', 'editor')).toBe(true);
    expect(canAccessFacodiRoute('editor', 'admin')).toBe(false);
    expect(canAccessFacodiRoute('admin', 'admin')).toBe(true);
  });
});
