import { describe, expect, it } from 'vitest';
import { wrapLines } from './achievementCard';

const measure = (text: string) => text.length * 10;

describe('achievement card text', () => {
  it('wraps words to the available width', () => {
    expect(wrapLines(measure, 'Cálculo derivadas e regras', 120, 4)).toEqual(['Cálculo', 'derivadas e', 'regras']);
  });
  it('ends the last kept line with an ellipsis when the title is too long', () => {
    expect(wrapLines(measure, 'um dois tres quatro cinco seis', 100, 2)).toEqual(['um dois', 'tres…']);
  });
  it('keeps a single word longer than the line instead of dropping it', () => {
    expect(wrapLines(measure, 'Otorrinolaringologia', 50, 2)).toEqual(['Otorrinolaringologia']);
  });
});
