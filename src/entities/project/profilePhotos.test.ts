import { describe, expect, it } from 'vitest';
import { PROFILE_PHOTOS, profilePhoto } from './profilePhotos';

const shipped = Object.keys(import.meta.glob('/public/team/*.webp')).map(file => file.replace(/^\/public/, ''));

describe('profile photos', () => {
  it('points every photo at a WebP file shipped in public/team', () => {
    for (const path of Object.values(PROFILE_PHOTOS)) {
      expect(path).toMatch(/^\/team\/[a-z0-9-]+\.webp$/);
      expect(shipped, path).toContain(path);
    }
  });
  it('returns null for profiles without a photo', () => {
    expect(profilePhoto('marcelo-santos')).toBeNull();
    expect(profilePhoto('gustavo-scheidt')).toBe('/team/gustavo-scheidt.webp');
  });
});
