import { describe, expect, it } from 'vitest';
import { courseKeys } from '@/entities/course/course.keys';
import { contributionKeys } from '@/entities/contribution/contribution.keys';
import { notesKeys } from '@/entities/notes/notes.keys';
import { suggestionKeys } from '@/entities/suggestion/suggestion.keys';
import { sequenceKeys } from '@/entities/sequence/sequence.keys';
import { feedbackKeys } from '@/entities/feedback/feedback.keys';

describe('FACODI query isolation', () => {
  it('separates public filters and pagination', () => {
    const base = { page: 1, search: '', language: '' };
    expect(courseKeys.resources(base)).not.toEqual(courseKeys.resources({ ...base, page: 2 }));
    expect(courseKeys.resources(base)).not.toEqual(courseKeys.resources({ ...base, search: 'math' }));
    expect(courseKeys.resources(base)).not.toEqual(courseKeys.resources({ ...base, tag: 'logic' }));
    expect(courseKeys.units(base)).not.toEqual(courseKeys.resources(base));
    expect(courseKeys.units(base)).not.toEqual(courseKeys.publicCourses());
  });
  it('separates identities and editorial domains from public results', () => {
    const params = { page: 1, search: '', language: '' };
    expect(courseKeys.editor('alice', 'courses', params)).not.toEqual(courseKeys.editor('bob', 'courses', params));
    expect(courseKeys.editor('alice', 'courses', params)).not.toEqual(courseKeys.editor('alice', 'learning_objects', params));
    expect(courseKeys.editor('alice', 'courses', params)).not.toEqual(courseKeys.publicCourses());
  });
  it('scopes contribution and review queues to the signed-in account', () => {
    expect(contributionKeys.myPlaylists('alice')).not.toEqual(contributionKeys.myPlaylists('bob'));
    expect(contributionKeys.pendingPlaylists('alice')).not.toEqual(contributionKeys.pendingPlaylists('bob'));
    expect(contributionKeys.blueprintPage('alice', 'draft', 1)).not.toEqual(contributionKeys.blueprintPage('alice', 'accepted', 1));
    expect(contributionKeys.blueprintPage('alice', 'draft', 1).slice(0, 4)).toEqual(contributionKeys.blueprints('alice'));
    expect(contributionKeys.myPlaylists('alice').slice(0, 3)).toEqual(['facodi', 'private', 'alice']);
    expect(notesKeys.mine('alice')).not.toEqual(notesKeys.mine('bob'));
    expect(notesKeys.mine('alice').slice(0, 3)).toEqual(['facodi', 'private', 'alice']);
    expect(suggestionKeys.mine('alice')).not.toEqual(suggestionKeys.mine('bob'));
    expect(suggestionKeys.queue('alice').slice(0, 4)).toEqual(suggestionKeys.all('alice'));
    expect(suggestionKeys.mine('alice').slice(0, 3)).toEqual(['facodi', 'private', 'alice']);
    expect(sequenceKeys.progress('alice', 'p1')).not.toEqual(sequenceKeys.progress('bob', 'p1'));
    expect(sequenceKeys.progress('alice', 'p1').slice(0, 4)).toEqual(sequenceKeys.progressAll('alice'));
    expect(sequenceKeys.overview('alice').slice(0, 4)).toEqual(sequenceKeys.progressAll('alice'));
    expect(feedbackKeys.mine('alice', 'lo1')).not.toEqual(feedbackKeys.mine('bob', 'lo1'));
    expect(feedbackKeys.mine('alice', 'lo1').slice(0, 3)).toEqual(['facodi', 'private', 'alice']);
    expect(sequenceKeys.list(null).slice(0, 3)).toEqual(['facodi', 'sequences', 'public']);
    expect(sequenceKeys.forVideo('v1').slice(0, 3)).toEqual(['facodi', 'sequences', 'public']);
    expect(sequenceKeys.videoCompletion('alice', 'v1').slice(0, 4)).toEqual(sequenceKeys.progressAll('alice'));
  });
});
