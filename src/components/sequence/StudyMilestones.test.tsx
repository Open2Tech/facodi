import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/i18n/config';
import { studyMilestones } from '@/entities/sequence/milestones';
import { useStudyMilestones } from '@/features/milestones/useStudyMilestones';
import { StudyMilestones } from './StudyMilestones';

vi.mock('@/features/milestones/useStudyMilestones', () => ({ useStudyMilestones: vi.fn() }));

describe('StudyMilestones', () => {
  it('shows the weekly run, reached milestones and progress towards the next ones, without certificates', async () => {
    await i18n.changeLanguage('pt');
    const now = new Date();
    vi.mocked(useStudyMilestones).mockReturnValue({
      data: studyMilestones({
        completions: [{ playlistId: 'a', videoId: 'v1', completedAt: now.toISOString() }],
        itemCounts: new Map([['a', 1]]), notes: 3, now,
      }),
      isPending: false, isError: false, retry: vi.fn(),
    });
    render(<I18nextProvider i18n={i18n}><StudyMilestones /></I18nextProvider>);
    const section = screen.getByRole('region', { name: 'Os teus marcos' });
    expect(within(section).getByText('Esta semana já conta.')).toBeInTheDocument();
    expect(within(section).getByText('Primeira sequência completa').nextSibling).toHaveTextContent('Alcançado');
    expect(within(section).getByText('10 notas no caderno').nextSibling).toHaveTextContent('3 de 10');
    expect(within(section).getByText(/Não são certificados/)).toBeInTheDocument();
  });
});
