import { useState } from 'react';
import { expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchInput } from '@/components/catalog/SearchInput';

function Harness({ onSearch }: { onSearch: (value: string) => void }) {
  const [value, setValue] = useState('');
  return <>
    <SearchInput aria-label="Search" value={value} delay={50} onSearch={next => {
      onSearch(next);
      // The URL commits later than the keystroke, like an async router update.
      setTimeout(() => setValue(next), 0);
    }} />
    <button type="button" onClick={() => setValue('')}>Reset</button>
  </>;
}

it('keeps fast typing intact, searches once per pause and adopts external resets', async () => {
  const user = userEvent.setup();
  const onSearch = vi.fn();
  render(<Harness onSearch={onSearch} />);
  const input = screen.getByRole('searchbox', { name: 'Search' });
  await user.type(input, 'algebra');
  expect(input).toHaveValue('algebra');
  await waitFor(() => expect(onSearch).toHaveBeenCalledWith('algebra'));
  expect(onSearch).toHaveBeenCalledTimes(1);
  await user.click(screen.getByRole('button', { name: 'Reset' }));
  expect(input).toHaveValue('');
});
