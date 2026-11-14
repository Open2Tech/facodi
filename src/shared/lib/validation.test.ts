import { describe, expect, it } from 'vitest';
import { contentSchema, createPasswordConfirmationSchema, signupSchema } from '@/shared/lib/validation';

const draft = { title: 'Course', slug: 'course', language: 'pt', description: '', summary: '', course_id: '', learning_object_id: '', object_type: 'document', source_url: '' };
describe('FACODI form validation', () => {
  it('rejects missing title, unsafe identifiers, invalid relations and non-web URLs', () => {
    for (const change of [{ title: ' ' }, { slug: '../admin' }, { course_id: 'not-a-uuid' }, { learning_object_id: 'not-a-uuid' }, { source_url: 'javascript:alert(1)' }]) {
      expect(contentSchema.safeParse({ ...draft, ...change }).success).toBe(false);
    }
    expect(contentSchema.safeParse({ ...draft, course_id: '11111111-1111-4111-8111-111111111111', source_url: 'https://example.test/lesson' }).success).toBe(true);
  });
  it('reuses centralized account and password confirmation requirements', () => {
    expect(signupSchema.safeParse({ name: 'Learner', email: 'bad', password: '123' }).success).toBe(false);
    expect(createPasswordConfirmationSchema().safeParse({ password: 'password-one', confirmPassword: 'password-two' }).success).toBe(false);
  });
});
