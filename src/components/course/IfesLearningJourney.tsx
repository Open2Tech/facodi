import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, ListVideo } from 'lucide-react';
import { IfesStudyProgressPanel } from '@/components/course/IfesStudyProgressPanel';
import { publicLearningRows } from '@/features/learning/publicLearningRpc';
import { unitPath } from '@/entities/course/course.paths';

const COURSE_CODE = 'IFES-CAR-ADM-INT-2026';

const unitSchema = z.object({
  unit_code: z.string().nullable().optional(),
  unit_title: z.string(),
  unit_slug: z.string(),
  study_module_slug: z.string().nullable().optional(),
  study_topic_count: z.number(),
  reading_count: z.number(),
  video_count: z.number(),
  playlist_count: z.number(),
});
const yearSchema = z.object({
  school_year: z.number(),
  year_title: z.string(),
  year_description: z.string().nullable().optional(),
  unit_count: z.number(),
  units: z.array(unitSchema),
  interdisciplinary_projects: z.array(z.object({
    title: z.string(),
    slug: z.string(),
    challenge: z.string().nullable().optional(),
  })),
});
const playlistSchema = z.object({
  playlist_slug: z.string(),
  playlist_title: z.string(),
  item_count: z.number(),
  guide_slug: z.string().nullable().optional(),
  connected_curricular_units: z.array(z.object({ year: z.number() })),
});

export function IfesLearningJourney({ courseSlug }: { courseSlug: string }) {
  const [selectedYear, setSelectedYear] = useState(1);
  const years = useQuery({
    queryKey: ['facodi', 'ifes-admin-2026', 'study-years'],
    queryFn: () => publicLearningRows('get_public_course_year_journey_v1', {
      p_course_code: COURSE_CODE, p_school_year: null,
    }, yearSchema),
    staleTime: 5 * 60_000,
  });
  const playlists = useQuery({
    queryKey: ['facodi', 'ifes-admin-2026', 'creator-playlists'],
    queryFn: () => publicLearningRows('list_public_course_creator_playlists_v1', {
      p_course_code: COURSE_CODE, p_year: null, p_creator_handle: null,
    }, playlistSchema),
    staleTime: 5 * 60_000,
  });

  const current = years.data?.find(year => year.school_year === selectedYear);
  const yearPlaylists = playlists.data?.filter(playlist =>
    playlist.connected_curricular_units.some(unit => unit.year === selectedYear)) ?? [];

  return <section aria-labelledby="ifes-learning-heading" className="mb-12 border-t border-foreground pt-10">
    <div className="flex flex-wrap items-start justify-between gap-5">
      <div className="max-w-2xl">
        <p className="font-mono text-label uppercase tracking-wide text-muted-foreground">FACODI · Estudo independente</p>
        <h2 id="ifes-learning-heading" className="mt-2 text-3xl font-semibold tracking-[-0.02em]">Aprende por ano e por disciplina</h2>
        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
          Consulta guias, atividades práticas e playlists dos criadores originais. São recursos
          complementares ao PPC de 2026, não aulas oficiais nem avaliações do Ifes.
        </p>
      </div>
      <Link to="/sequences" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4">
        Todas as sequências <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
    </div>

    <div role="group" aria-label="Ano do curso" className="mt-7 flex flex-wrap gap-2">
      {[1, 2, 3].map(year => <button type="button" key={year}
        aria-pressed={selectedYear === year}
        onClick={() => setSelectedYear(year)}
        className={selectedYear === year
          ? 'border border-foreground bg-foreground px-5 py-2 text-sm font-semibold text-background'
          : 'border border-input px-5 py-2 text-sm font-semibold transition-colors hover:border-foreground'}>
        {year}º ano
      </button>)}
    </div>

    {years.isPending && <p role="status" className="mt-6 text-sm text-muted-foreground">A carregar os percursos...</p>}
    {years.error && <p role="alert" className="mt-6 border border-input p-4 text-sm">
      Não foi possível carregar os percursos. <button type="button" className="font-semibold underline" onClick={() => void years.refetch()}>Tentar novamente</button>
    </p>}
    {current && <div className="mt-7">
      <h3 className="text-xl font-semibold">{current.year_title}</h3>
      {current.year_description && <p className="mt-2 max-w-prose text-sm text-muted-foreground">{current.year_description}</p>}
      <p className="mt-2 font-mono text-label text-muted-foreground">{current.unit_count} disciplinas · 3 tópicos de estudo por guia</p>
      <IfesStudyProgressPanel courseSlug={courseSlug} units={current.units} />
      {!!current.interdisciplinary_projects.length && <div className="mt-8 border border-foreground bg-muted/30 p-5">
        <h4 className="font-semibold">Projetos interdisciplinares opcionais</h4>
        <ul className="mt-3 space-y-3">
          {current.interdisciplinary_projects.map(project => <li key={project.slug}>
            <Link className="inline-flex items-center gap-2 font-semibold underline underline-offset-4" to={`/resources/${encodeURIComponent(project.slug)}`}>
              {project.title} <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            {project.challenge && <p className="mt-1 text-sm text-muted-foreground">{project.challenge}</p>}
          </li>)}
        </ul>
      </div>}
      <div className="mt-9">
        <h4 className="inline-flex items-center gap-2 text-lg font-semibold">
          <ListVideo className="h-5 w-5" aria-hidden="true" /> Playlists e videoaulas
        </h4>
        {playlists.isPending && <p role="status" className="mt-3 text-sm text-muted-foreground">A carregar playlists...</p>}
        {playlists.error && <p role="alert" className="mt-3 text-sm">Não foi possível carregar as playlists. <button type="button" className="font-semibold underline" onClick={() => void playlists.refetch()}>Tentar novamente</button></p>}
        {playlists.isSuccess && !yearPlaylists.length && <p className="mt-3 text-sm text-muted-foreground">Ainda não há playlists adicionais para este ano.</p>}
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {yearPlaylists.map(playlist => <li key={playlist.playlist_slug}>
            <Link to={`/sequences/${encodeURIComponent(playlist.playlist_slug)}`}
              className="group flex h-full flex-col border border-input p-4 transition-colors hover:border-foreground">
              <span className="font-semibold group-hover:underline group-hover:underline-offset-4">{playlist.playlist_title}</span>
              <span className="mt-2 font-mono text-label text-muted-foreground">
                {playlist.item_count} vídeos {playlist.guide_slug ? '· guia de estudo' : ''}
              </span>
              <span className="mt-auto inline-flex items-center gap-2 pt-4 text-sm font-semibold">Ver sequência <ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
            </Link>
          </li>)}
        </ul>
      </div>
    </div>}
  </section>;
}
