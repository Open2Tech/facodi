import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { UnitVideoLibraryFrame } from './UnitVideoLibraryFrame';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, args?: { count?: number }) => `${key} ${args?.count ?? ''}` }),
}));

describe('unit secondary video library', () => {
  it('defers video content until the collapsed library is opened', () => {
    render(<UnitVideoLibraryFrame collapsed count={91}>
      <div data-testid="video-player">player</div>
    </UnitVideoLibraryFrame>);
    expect(screen.getByText('composedPath.library 91')).toBeInTheDocument();
    expect(screen.queryByTestId('video-player')).not.toBeInTheDocument();
    const details = screen.getByText('composedPath.library 91').closest('details') as HTMLDetailsElement;
    details.open = true;
    fireEvent(details, new Event('toggle'));
    expect(screen.getByTestId('video-player')).toBeInTheDocument();
  });

  it('opens direct video links immediately', () => {
    render(<UnitVideoLibraryFrame collapsed count={100} forceOpen>
      <div data-testid="linked-video">linked</div>
    </UnitVideoLibraryFrame>);
    expect(screen.getByTestId('linked-video')).toBeInTheDocument();
    expect(screen.getByText('composedPath.library 100').closest('details')).toHaveAttribute('open');
  });

  it('does not change the legacy library layout', () => {
    render(<UnitVideoLibraryFrame collapsed={false} count={3}>
      <div data-testid="legacy-library">visible</div>
    </UnitVideoLibraryFrame>);
    expect(screen.getByTestId('legacy-library')).toBeInTheDocument();
    expect(screen.queryByText('composedPath.library 3')).not.toBeInTheDocument();
  });
});
