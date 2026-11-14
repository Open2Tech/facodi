import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SafeHtml } from '@/components/course/SafeHtml';

it('preserves educational prose and removes executable markup and links', () => {
  const { container } = render(<SafeHtml html={'<h2>Study</h2><p><strong>Important</strong></p><script>alert(1)</script><img src=x onerror=alert(1)><iframe src="https://evil.test"></iframe><a href="javascript:alert(1)" onclick="alert(1)">Unsafe</a><a href="https://example.test">Reading</a>'} />);
  expect(screen.getByRole('heading', { name: 'Study' })).toBeInTheDocument();
  expect(screen.getByText('Important').tagName).toBe('STRONG');
  expect(container.querySelector('script, img, iframe, [onclick]')).toBeNull();
  expect(screen.getByText('Unsafe')).not.toHaveAttribute('href');
  expect(screen.getByRole('link', { name: 'Reading' })).toHaveAttribute('href', 'https://example.test');
});
