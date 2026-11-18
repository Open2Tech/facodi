import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { ResourceFeedbackView } from './ResourceFeedback';

const view = (value: boolean | null, onAnswer = vi.fn()) => render(<I18nextProvider i18n={i18n}>
  <ResourceFeedbackView isVideo value={value} pending={false} onAnswer={onAnswer} />
</I18nextProvider>);

describe('ResourceFeedbackView', () => {
  it('asks the question and sends the chosen answer', async () => {
    await i18n.changeLanguage('pt');
    const onAnswer = vi.fn();
    view(null, onAnswer);
    expect(screen.getByRole('heading', { name: 'Este vídeo ajudou-te?' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Não' }));
    expect(onAnswer).toHaveBeenCalledWith(false);
    expect(screen.queryByText(/Obrigado/)).not.toBeInTheDocument();
  });

  it('marks the saved answer and thanks the learner', () => {
    view(true);
    expect(screen.getByRole('button', { name: 'Sim' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: 'Não' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByText(/Obrigado!/)).toBeInTheDocument();
  });
});
