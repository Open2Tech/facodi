import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { toast, type ToasterProps } from 'sonner';
import type { StudyNote } from '@/entities/notes/notes';
import type { useNotebook } from './useNotebook';

type Notebook = Pick<ReturnType<typeof useNotebook>, 'isGuest' | 'remove' | 'restore'>;

/** Toast feedback for notebook writes, and deletion with undo. `persist` resolves to whether the write succeeded. */
export function useNoteActions(notebook: Notebook, position?: ToasterProps['position']) {
  const { t } = useTranslation();
  const { isGuest, remove: removeNote, restore } = notebook;
  const persist = useCallback(async (action: () => Promise<unknown>, success?: string) => {
    try {
      await action();
      if (success) toast.success(success, { position });
      return true;
    } catch {
      toast.error(t(isGuest ? 'notes.storageFailed' : 'notes.saveFailed'), { position });
      return false;
    }
  }, [isGuest, position, t]);
  const remove = useCallback(async (note: StudyNote) => {
    if (!await persist(() => removeNote(note.id))) return;
    toast(t('notes.deleted'), { position, action: { label: t('notes.undo'), onClick: () => void persist(() => restore(note)) } });
  }, [persist, position, removeNote, restore, t]);
  return { persist, remove };
}
