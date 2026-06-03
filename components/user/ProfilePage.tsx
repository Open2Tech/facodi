import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../services/supabase';

interface Props {
  onBack: () => void;
  t: (key: string) => string;
}

interface UnitFavorite {
  id: string;
  unit_code: string;
  created_at: string;
}

const ROLE_LABELS: Record<string, string> = {
  admin: 'auth.adminBadge',
  editor: 'auth.editorBadge',
  user: 'auth.userBadge',
};

const ProfilePage: React.FC<Props> = ({ onBack, t }) => {
  const { user, profile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name ?? '');
  const [bio, setBio] = useState(profile?.bio ?? '');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<UnitFavorite[]>([]);
  const [favLoading, setFavLoading] = useState(true);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState<string | null>(null);

  useEffect(() => {
    setDisplayName(profile?.display_name ?? '');
    setBio(profile?.bio ?? '');
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    setFavLoading(true);
    supabase
      .from('unit_favorites')
      .select('id, unit_code, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        setFavorites((data as UnitFavorite[]) ?? []);
        setFavLoading(false);
      });
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    setSaveMsg(null);
    const { error } = await supabase
      .from('profiles')
      .upsert({ id: user.id, display_name: displayName || null, bio: bio || null }, { onConflict: 'id' });
    setIsSaving(false);
    setSaveMsg(error ? t('auth.errorGeneric') : t('auth.saveChanges') + ' ✓');
  };

  const handleRemoveFavorite = async (id: string) => {
    await supabase.from('unit_favorites').delete().eq('id', id);
    setFavorites((prev) => prev.filter((f) => f.id !== id));
  };

  const handleSignOut = async () => {
    setSignOutError(null);
    setIsSigningOut(true);
    try {
      await signOut();
      onBack();
    } catch {
      setSignOutError(t('auth.errorGeneric'));
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16">
        <p className="text-sm text-gray-400 uppercase font-bold">Sessão não encontrada.</p>
      </div>
    );
  }

  const resolvedProfile = profile ?? {
    id: user.id,
    username: null,
    display_name: user.user_metadata?.full_name ?? null,
    avatar_url: user.user_metadata?.avatar_url ?? null,
    bio: null,
    avatar_path: null,
    role: 'user' as const,
    submissions_count: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const avatarUrl = resolvedProfile.avatar_url ?? null;
  const roleKey = ROLE_LABELS[resolvedProfile.role] ?? 'auth.userBadge';

  return (
    <div className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button onClick={onBack} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest mb-12 hover:text-primary transition-colors">
        <span className="material-symbols-outlined text-base">arrow_back</span>
        Voltar
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-16">
        {/* Left: avatar + info */}
        <div className="lg:col-span-4 flex flex-col gap-8">
          <div className="stark-border p-8 flex flex-col items-center gap-4 bg-brand-muted">
            {avatarUrl ? (
              <img src={avatarUrl} alt={profile.display_name ?? 'Avatar'} className="w-24 h-24 rounded-full stark-border object-cover" referrerPolicy="no-referrer" />
            ) : (
              <div className="w-24 h-24 rounded-full stark-border bg-primary flex items-center justify-center">
                <span className="text-4xl font-black text-black select-none">
                  {(profile.display_name ?? profile.username ?? '?')[0].toUpperCase()}
                </span>
              </div>
            )}
            <div className="text-center">
              <p className="text-xl font-black tracking-tighter">{resolvedProfile.display_name ?? resolvedProfile.username ?? user.email}</p>
              {resolvedProfile.username && <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">@{resolvedProfile.username}</p>}
              <span className="inline-block mt-3 px-3 py-1 text-[9px] font-black uppercase tracking-widest stark-border bg-white">
                {t(roleKey)}
              </span>
            </div>
          </div>

          <button
            onClick={handleSignOut}
            disabled={isSigningOut}
            className="w-full stark-border py-3 text-[10px] font-black uppercase tracking-widest hover:bg-black hover:text-white transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`material-symbols-outlined text-base ${isSigningOut ? 'animate-spin' : ''}`}>{isSigningOut ? 'progress_activity' : 'logout'}</span>
            {isSigningOut ? 'A sair...' : t('nav.logout')}
          </button>
          {signOutError && <p className="text-[10px] font-bold uppercase text-red-600">{signOutError}</p>}
        </div>

        {/* Right: edit form + favorites */}
        <div className="lg:col-span-8 flex flex-col gap-12">
          {/* Edit profile */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">{t('auth.editProfile')}</h2>
            <form onSubmit={handleSave} className="flex flex-col gap-5">
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">{t('auth.displayName')}</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  maxLength={80}
                  className="w-full stark-border px-4 py-3 text-sm font-medium outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all"
                />
              </div>
              <div>
                <label className="text-[9px] font-black uppercase tracking-widest text-gray-500 block mb-1">{t('auth.bio')}</label>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  rows={4}
                  maxLength={300}
                  className="w-full stark-border px-4 py-3 text-sm font-medium outline-none focus:shadow-[4px_4px_0px_0px_rgba(239,255,0,1)] transition-all resize-none"
                />
              </div>
              {saveMsg && <p className="text-[10px] font-bold uppercase text-gray-600">{saveMsg}</p>}
              <button
                type="submit"
                disabled={isSaving}
                className="self-start bg-primary text-black px-8 py-3 text-[10px] font-black uppercase tracking-widest stark-border hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] transition-all disabled:opacity-50"
              >
                {isSaving ? '...' : t('auth.saveChanges')}
              </button>
            </form>
          </div>

          {/* Unit favorites */}
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] mb-6 border-b border-black pb-3">{t('auth.unitFavorites')}</h2>
            {favLoading ? (
              <p className="text-[10px] uppercase font-bold text-gray-400">A carregar...</p>
            ) : favorites.length === 0 ? (
              <p className="text-[10px] uppercase font-bold text-gray-400">{t('auth.noFavorites')}</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {favorites.map((fav) => (
                  <li key={fav.id} className="flex items-center justify-between stark-border px-4 py-3 bg-brand-muted">
                    <span className="text-[11px] font-bold uppercase tracking-widest">{fav.unit_code}</span>
                    <button
                      onClick={() => handleRemoveFavorite(fav.id)}
                      aria-label="Remover favorito"
                      className="text-gray-400 hover:text-black transition-colors"
                    >
                      <span className="material-symbols-outlined text-base">close</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
