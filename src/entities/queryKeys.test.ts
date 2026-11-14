import { describe, expect, it } from 'vitest';
import { courseKeys } from '@/entities/course/course.keys';

describe('FACODI query isolation', () => {
  it('separates public filters and pagination', () => {
    const base = { page: 1, search: '', language: '' };
    expect(courseKeys.catalog(base)).not.toEqual(courseKeys.catalog({ ...base, page: 2 }));
    expect(courseKeys.catalog(base)).not.toEqual(courseKeys.catalog({ ...base, search: 'math' }));
    expect(courseKeys.catalog(base)).not.toEqual(courseKeys.catalog({ ...base, language: 'en' }));
  });
  it('separates identities and editorial domains from public results', () => {
    const params = { page: 1, search: '', language: '' };
    expect(courseKeys.editor('alice', 'courses', params)).not.toEqual(courseKeys.editor('bob', 'courses', params));
    expect(courseKeys.editor('alice', 'courses', params)).not.toEqual(courseKeys.editor('alice', 'learning_objects', params));
    expect(courseKeys.editor('alice', 'courses', params)).not.toEqual(courseKeys.catalog(params));
  });
});
