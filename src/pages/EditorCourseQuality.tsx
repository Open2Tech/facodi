import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ArrowLeft, ArrowRight, ClipboardCheck, ExternalLink, RefreshCcw } from 'lucide-react';
import { supabase } from '@/shared/api/supabase/supabaseClient';
import { useAuth } from '@/features/auth/useAuth';
import { canAccessFacodiRoute } from '@/entities/facodi/access';
import { Button } from '@/components/ui/button';
import { PageState } from '@/components/layout/PageState';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const COURSE = 'IFES-CAR-ADM-INT-2026';
const COURSE_SLUG = 'ifes-cariacica-administracao-integrado-2026';
const PAGE_SIZE = 20;
const issueSchema = z.object({
  issue_key: z.string(),
  issue_kind: z.string(),
  priority: z.number(),
  target_object_id: z.string().uuid(),
  item_title: z.string(),
  school_year: z.number().nullable(),
  verification_scope: z.string().nullable(),
  description: z.string().nullable(),
  latest_editorial_decision: z.string().nullable(),
  latest_editorial_note: z.string().nullable(),
  last_reviewed_at: z.string().nullable(),
  teacher_approved: z.boolean(),
});
const qualitySchema = z.object({
  course_code: z.string(),
  curriculum_units: z.number(),
  editorial_reviews_pending: z.number(),
  recorded_editorial_decisions: z.number(),
  source_pages_recheck: z.number(),
  curricular_discrepancies_open: z.number(),
});
type Issue = z.infer<typeof issueSchema>;
type Decision = 'editorial_verified' | 'revision_required' | 'not_suitable';

const labels: Record<string, string> = {
  study_module: 'Guia prático', editorial_playlist: 'Playlist',
  creator_video: 'Vídeo externo', study_guide: 'Guia orientador',
  external_reading: 'Leitura externa', curriculum_discrepancy: 'Divergência curricular',
};
const decisions: { value: Decision; label: string; description: string }[] = [
  { value: 'editorial_verified', label: 'Verificado pela FACODI', description: 'Revisão editorial concluída; não equivale a homologação docente nem altera a publicação.' },
  { value: 'revision_required', label: 'Requer correção', description: 'Registar o que precisa ser revisto antes da próxima validação.' },
  { value: 'not_suitable', label: 'Não adequado', description: 'Sinalizar material impróprio ou insuficiente para o percurso.' },
];

async function editorRpc(name: string, args: Record<string, unknown>) {
  // The live editorial RPCs were added after the last generated database types.
  const client = supabase as unknown as { rpc: (method: string, params: Record<string, unknown>) =>
    Promise<{ data: unknown; error: { message: string } | null }> };
  const { data, error } = await client.rpc(name, args);
  if (error) throw new Error(error.message);
  return data;
}

function resourceHref(item: Issue): string | null {
  const suffix = item.issue_key.split(':').slice(3).join(':');
  if (item.issue_kind === 'curriculum_discrepancy') return `/courses/${COURSE_SLUG}`;
  if (item.issue_kind === 'study_module' || item.issue_kind === 'study_guide' ||
      item.issue_kind === 'editorial_playlist') {
    return suffix ? `/resources/${encodeURIComponent(suffix)}` : null;
  }
  if (item.issue_kind === 'creator_video') {
    return suffix && /^[a-zA-Z0-9_-]{11}$/.test(suffix) ? `/resources/youtube-${suffix}` : null;
  }
  return null;
}

export default function EditorCourseQuality() {
  const { user, role } = useAuth();
  const client = useQueryClient();
  const userId = user?.id ?? '';
  const allowed = !!user && canAccessFacodiRoute(role, 'editor');
  const queueKey = ['facodi', 'ifes-editorial-review', userId];
  const qualityKey = ['facodi', 'ifes-editorial-quality', userId];
  const queue = useQuery({
    queryKey: queueKey,
    queryFn: async () => issueSchema.array().parse(await editorRpc('list_editor_course_review_queue_v1',
      { p_course_code: COURSE, p_limit: 200, p_offset: 0 })),
    enabled: allowed,
    staleTime: 30_000,
  });
  const quality = useQuery({
    queryKey: qualityKey,
    queryFn: async () => qualitySchema.array().parse(await editorRpc('get_editor_ifes_course_quality_v1',
      { p_course_code: COURSE })),
    enabled: allowed,
    staleTime: 30_000,
  });
  const [kind, setKind] = useState('all');
  const [status, setStatus] = useState('pending');
  const [year, setYear] = useState('all');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Issue | null>(null);
  const [decision, setDecision] = useState<Decision>('revision_required');
  const [note, setNote] = useState('');
  const review = useMutation({
    mutationFn: async (input: { key: string; decision: Decision; note: string }) => {
      return z.string().uuid().parse(await editorRpc('record_editor_course_review_v1',
        { p_issue_key: input.key, p_decision: input.decision, p_review_note: input.note }));
    },
    onSuccess: async () => {
      setSelected(null);
      setNote('');
      await Promise.all([
        client.invalidateQueries({ queryKey: queueKey }),
        client.invalidateQueries({ queryKey: qualityKey }),
      ]);
    },
  });

  const all = queue.data ?? [];
  const filtered = useMemo(() => all.filter(item =>
    (kind === 'all' || item.issue_kind === kind) &&
    (year === 'all' || item.school_year === Number(year)) &&
    (status === 'all' || (status === 'pending' ? !item.latest_editorial_decision :
      item.latest_editorial_decision === status))
  ), [all, kind, status, year]);
  const maxPage = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const visible = filtered.slice((Math.min(page, maxPage) - 1) * PAGE_SIZE, Math.min(page, maxPage) * PAGE_SIZE);
  const kinds = [...new Set(all.map(item => item.issue_kind))];
  const stats = quality.data?.[0];

  function changeFilters(set: (value: string) => void, value: string) {
    set(value);
    setPage(1);
  }

  if (!allowed) return <PageState title="Acesso reservado" description="Esta área exige o perfil editorial da FACODI." />;

  return <main>
    <Link to="/editor" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
      <ArrowLeft className="h-4 w-4" aria-hidden="true" /> Voltar à equipa editorial
    </Link>
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="max-w-3xl">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">FACODI · Revisão académica</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Qualidade editorial — Ifes Cariacica</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Verifica conteúdos complementares do PPC 2026 e regista decisões justificadas.
          Uma decisão editorial não representa aprovação docente, não altera automaticamente
          conteúdos públicos e não resolve divergências institucionais.
        </p>
      </div>
      <Button variant="outline" type="button" disabled={queue.isFetching} onClick={() => {
        void queue.refetch(); void quality.refetch();
      }}><RefreshCcw className="h-4 w-4" aria-hidden="true" /> Atualizar</Button>
    </header>

    <div className="mt-8 grid gap-3 sm:grid-cols-3" aria-label="Indicadores editoriais">
      {[
        ['Itens na fila', all.length],
        ['Aguardam decisão', all.filter(item => !item.latest_editorial_decision).length],
        ['Fontes a confirmar', stats?.source_pages_recheck ?? '—'],
      ].map(([label, value]) => <div key={label} className="border border-input p-5">
        <p className="font-mono text-2xl font-semibold tabular-nums">{value}</p>
        <p className="mt-1 text-sm text-muted-foreground">{label}</p>
      </div>)}
    </div>

    <section className="mt-9" aria-labelledby="ifes-queue-heading">
      <h2 id="ifes-queue-heading" className="text-2xl font-semibold">Pendências e decisões</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-3">
        <label className="space-y-1 text-sm font-medium">Tipo de conteúdo
          <select value={kind} onChange={e => changeFilters(setKind, e.target.value)}
            className="block w-full border border-input bg-background px-3 py-2">
            <option value="all">Todos</option>
            {kinds.map(value => <option key={value} value={value}>{labels[value] ?? value}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Estado da revisão
          <select value={status} onChange={e => changeFilters(setStatus, e.target.value)}
            className="block w-full border border-input bg-background px-3 py-2">
            <option value="pending">Por rever</option>
            <option value="all">Todos os estados</option>
            {decisions.map(value => <option key={value.value} value={value.value}>{value.label}</option>)}
          </select>
        </label>
        <label className="space-y-1 text-sm font-medium">Ano curricular
          <select value={year} onChange={e => changeFilters(setYear, e.target.value)}
            className="block w-full border border-input bg-background px-3 py-2">
            <option value="all">Todos os anos</option>
            {[1, 2, 3].map(value => <option key={value} value={value}>{value}º ano</option>)}
          </select>
        </label>
      </div>

      {queue.isPending && <p role="status" className="mt-6 text-sm">A carregar as verificações...</p>}
      {queue.error && <div role="alert" className="mt-6 border border-destructive p-5 text-sm">
        Não foi possível consultar a fila: {queue.error.message}
        <Button className="mt-3" variant="outline" type="button" onClick={() => void queue.refetch()}>Repetir</Button>
      </div>}
      {queue.isSuccess && <p className="mt-5 font-mono text-xs text-muted-foreground" aria-live="polite">
        {filtered.length} itens encontrados · {Math.min(page, maxPage)} / {maxPage}
      </p>}

      <ul className="mt-3 divide-y divide-input border-y border-input">
        {visible.map(item => <li key={item.issue_key} className="py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="font-mono text-xs uppercase text-muted-foreground">
                {labels[item.issue_kind] ?? item.issue_kind}{item.school_year ? ` · ${item.school_year}º ano` : ''}
                {' · '}{item.latest_editorial_decision ? 'Revisão registada' : 'Pendente'}
              </p>
              <h3 className="mt-2 text-lg font-semibold">{item.item_title}</h3>
              {item.verification_scope && <p className="mt-2 text-xs text-muted-foreground">{item.verification_scope}</p>}
              {item.description && <p className="mt-2 max-w-prose text-sm text-muted-foreground">{item.description}</p>}
              {item.latest_editorial_note && <blockquote className="mt-3 border-l-2 border-input pl-3 text-sm">
                Revisão anterior: {item.latest_editorial_note}
              </blockquote>}
              {resourceHref(item) && <Link to={resourceHref(item)!} className="mt-3 inline-flex items-center gap-1 text-sm font-semibold underline underline-offset-4">
                Abrir recurso <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </Link>}
            </div>
            <Button variant="outline" size="sm" disabled={review.isPending} onClick={() => {
              review.reset(); setSelected(item); setDecision('revision_required'); setNote('');
            }}><ClipboardCheck className="h-4 w-4" aria-hidden="true" />
              {item.latest_editorial_decision ? 'Nova revisão' : 'Rever'}
            </Button>
          </div>
        </li>)}
      </ul>
      {queue.isSuccess && !filtered.length && <p className="mt-5 text-sm text-muted-foreground">Nenhum item corresponde aos filtros escolhidos.</p>}
      {maxPage > 1 && <nav className="mt-5 flex items-center justify-end gap-3" aria-label="Paginação da fila">
        <Button type="button" size="sm" variant="outline" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Anterior</Button>
        <span className="font-mono text-xs tabular-nums">{page} / {maxPage}</span>
        <Button type="button" size="sm" variant="outline" disabled={page >= maxPage} onClick={() => setPage(p => Math.min(maxPage, p + 1))}>
          Próxima <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Button>
      </nav>}
    </section>
    <AlertDialog open={!!selected} onOpenChange={open => { if (!open && !review.isPending) setSelected(null); }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Registar revisão editorial</AlertDialogTitle>
          <AlertDialogDescription>
            {selected?.item_title}. Esta decisão é auditável, não altera a publicação e não comprova validação docente.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <fieldset className="space-y-3" disabled={review.isPending}>
          <legend className="text-sm font-semibold">Decisão</legend>
          {decisions.map(option => <label key={option.value} className="flex cursor-pointer items-start gap-3 border border-input p-3 text-sm">
            <input type="radio" name="facodi-review-decision" value={option.value}
              checked={decision === option.value} onChange={() => setDecision(option.value)}
              className="mt-1 accent-current" />
            <span><strong className="block">{option.label}</strong><span className="mt-1 block text-muted-foreground">{option.description}</span></span>
          </label>)}
          <label className="block text-sm font-semibold" htmlFor="facodi-review-note">Justificação (8–2000 caracteres)</label>
          <textarea id="facodi-review-note" rows={4} minLength={8} maxLength={2000} required
            value={note} onChange={e => setNote(e.target.value)}
            placeholder="Descreve o que verificaste e quais fontes consultaste."
            className="block w-full resize-y border border-input bg-background p-3 text-sm" />
        </fieldset>
        {review.error && <p role="alert" className="text-sm text-destructive">{review.error.message}</p>}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={review.isPending}>Cancelar</AlertDialogCancel>
          <AlertDialogAction disabled={!selected || note.trim().length < 8 || review.isPending}
            onClick={event => {
              event.preventDefault();
              if (selected && note.trim().length >= 8 && !review.isPending) {
                review.mutate({ key: selected.issue_key, decision, note: note.trim() });
              }
            }}>{review.isPending ? 'A guardar…' : 'Confirmar e guardar'}</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </main>;
}
