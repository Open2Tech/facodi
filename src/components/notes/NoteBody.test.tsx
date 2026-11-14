import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { NoteBody } from './NoteBody';

describe('NoteBody', () => {
  it('formats the toolbar Markdown subset and never injects markup', () => {
    const { container } = render(<NoteBody text={'**Fit** on *train* with `fit()`\n\n```python\nx = 1\n```\n<img src=x onerror=alert(1)>'} />);
    expect(screen.getByText('Fit').tagName).toBe('STRONG');
    expect(screen.getByText('train').tagName).toBe('EM');
    expect(screen.getByText('fit()').tagName).toBe('CODE');
    expect(container.querySelector('pre code')?.textContent).toBe('x = 1');
    expect(container.querySelector('img')).toBeNull();
    expect(screen.getByText('<img src=x onerror=alert(1)>')).toBeInTheDocument();
  });
});
