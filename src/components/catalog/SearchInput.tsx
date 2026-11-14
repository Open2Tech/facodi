import { useEffect, useRef, useState, type ComponentProps } from 'react';
import { Input } from '@/components/ui/input';
import { useDebouncedValue } from '@/shared/hooks/useDebouncedValue';

type SearchInputProps = Omit<ComponentProps<typeof Input>, 'value' | 'onChange' | 'type'> & {
  value: string;
  onSearch: (value: string) => void;
  delay?: number;
};

/**
 * Search box for URL-backed lists. Keystrokes stay in local state and reach `onSearch` once typing pauses,
 * so asynchronous URL updates can neither drop characters nor fire a request per keystroke.
 */
export function SearchInput({ value, onSearch, delay = 300, ...props }: SearchInputProps) {
  const [draft, setDraft] = useState(value);
  const debounced = useDebouncedValue(draft, delay);
  const emitted = useRef(value);
  const onSearchRef = useRef(onSearch);
  onSearchRef.current = onSearch;
  useEffect(() => {
    // Adopt external changes (reset, back navigation) but ignore the echo of what this input just sent.
    if (value !== emitted.current) {
      emitted.current = value;
      setDraft(value);
    }
  }, [value]);
  useEffect(() => {
    if (debounced === emitted.current) return;
    emitted.current = debounced;
    onSearchRef.current(debounced);
  }, [debounced]);
  return <Input {...props} type="search" value={draft} onChange={event => setDraft(event.target.value)} />;
}
