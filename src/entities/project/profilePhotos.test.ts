import { describe, expect, it } from 'vitest';
import { PROFILE_PHOTOS, profilePhoto } from './profilePhotos';

const shipped = Object.keys(import.meta.glob('/public/team/*.jpeg'))
  .map(file => file.replace(/^\/public/, ''));

describe('profile photos', () => {
  it('points every configured portrait to an existing local JPEG', () => {
    for (const path of Object.values(PROFILE_PHOTOS)) {
      expect(path).toMatch(/^\/team\/[a-z0-9-]+\.jpeg$/);
      expect(shipped, path).toContain(path);
    }
  });

  it('maps approved contributor and founder slugs to the supplied files', () => {
    expect(profilePhoto('gustavo-scheidt')).toBe('/team/gustavo.jpeg');
    expect(profilePhoto('marcelo-santos')).toBe('/team/marcelo-santos.jpeg');
  });

  it('keeps the icon fallback for profiles without photos', () => {
    expect(profilePhoto('unknown-person')).toBeNull();
  });
});
