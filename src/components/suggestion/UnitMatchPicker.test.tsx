import { expect, it, vi } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import type { UnitOption } from '@/entities/suggestion/suggestion.types';
import { UnitMatchPicker } from '@/components/suggestion/UnitMatchPicker';

const lesti = { id: '11111111-1111-4111-8111-111111111111', code: 'LESTI', title: 'Sistemas', slug: 'lesti' };
const lei = { id: '22222222-2222-4222-8222-222222222222', code: 'LEI', title: 'Informática', slug: 'lei' };
const units: UnitOption[] = [
  { id: 'u-bd', code: '1941', title: 'Bases de Dados I', slug: 'bd', course: lesti },
  { id: 'u-pr', code: '2001', title: 'Programação', slug: 'pr', course: lei },
];

it('clears the unit on course change and lets a match choose course and unit together', () => {
  const onChange = vi.fn();
  const { rerender } = render(<UnitMatchPicker units={units} matches={[{ unit: units[0], score: 80 }, { unit: units[1], score: 60 }]}
    courseId={lesti.id} unitId="u-bd" onChange={onChange} />);

  // Matches are limited to the chosen course, and only its units are offered.
  expect(screen.getAllByRole('radio')).toHaveLength(1);
  expect(screen.queryByRole('option', { name: /Programação/ })).toBeNull();

  fireEvent.change(screen.getAllByRole('combobox')[0], { target: { value: lei.id } });
  expect(onChange).toHaveBeenLastCalledWith({ courseId: lei.id, unitId: '' });

  rerender(<UnitMatchPicker units={units} matches={[{ unit: units[0], score: 80 }, { unit: units[1], score: 60 }]}
    courseId="" unitId="" onChange={onChange} />);
  expect(screen.getAllByRole('combobox')[1]).toBeDisabled();
  fireEvent.click(screen.getAllByRole('radio')[1]);
  expect(onChange).toHaveBeenLastCalledWith({ courseId: lei.id, unitId: 'u-pr' });
});
