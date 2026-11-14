import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { LogOut, MonitorSmartphone } from 'lucide-react';
import { authErrorKey } from '@/entities/auth/authErrors';
import { useAuth } from '@/features/auth/useAuth';
import { useSignOutOtherSessions } from '@/features/auth/queries/useAccountMutations';
import { Button } from '@/components/ui/button';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

export function SessionControls() {
  const { t } = useTranslation();
  const { signOut } = useAuth();
  const others = useSignOutOtherSessions();
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [leaving, setLeaving] = useState(false);
  return <div className="space-y-4">
    <p className="max-w-prose text-sm text-muted-foreground">{t('profile.sessionsDescription')}</p>
    <div className="flex flex-wrap gap-3">
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button type="button" variant="outline" disabled={others.isPending}><MonitorSmartphone aria-hidden="true" />{t(others.isPending ? 'common.working' : 'profile.signOutOthers')}</Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('profile.signOutOthers')}</AlertDialogTitle>
            <AlertDialogDescription>{t('profile.signOutOthersConfirm')}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              setError(''); setDone(false);
              try { await others.mutateAsync(); setDone(true); }
              catch (cause) { setError(authErrorKey(cause)); }
            }}>{t('common.confirm')}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <Button type="button" variant="ghost" disabled={leaving} onClick={async () => {
        setError(''); setLeaving(true);
        try { await signOut(); }
        catch (cause) { setError(authErrorKey(cause)); setLeaving(false); }
      }}><LogOut aria-hidden="true" />{t('profile.signOutHere')}</Button>
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{t(error)}</p>}
    {done && <p role="status" className="text-sm">{t('profile.signedOutOthers')}</p>}
  </div>;
}
