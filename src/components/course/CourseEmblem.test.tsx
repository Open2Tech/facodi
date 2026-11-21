import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { expect, it } from 'vitest';
import { renderWithProviders } from '@/shared/test/renderWithProviders';
import i18n from '@/i18n/config';
import { CourseEmblem } from '@/components/course/CourseEmblem';

it('opens the neuroscience discovery with the keyboard and closes it on click', async () => {
  await i18n.changeLanguage('pt');
  renderWithProviders(<CourseEmblem detail course={{ slug: 'neurociencias-cognitivas-neuropsicologia', title: 'Neurociências' }} />);
  const button = screen.getByRole('button', { name: /Neurociências/ });
  const caption = screen.getByText(/através da sinapse/);
  const user = userEvent.setup();
  expect(caption).not.toBeVisible();
  await user.tab();
  await user.keyboard('{Enter}');
  expect(button).toHaveAttribute('aria-expanded', 'true');
  expect(caption).toBeVisible();
  await user.click(button);
  expect(caption).not.toBeVisible();
});

it('keeps catalog symbols and the fallback for new courses decorative', () => {
  renderWithProviders(<>
    <CourseEmblem course={{ slug: 'psicologia', title: 'Psicologia' }} />
    <CourseEmblem detail course={{ slug: 'novo', title: 'Novo curso' }} />
  </>);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
});
