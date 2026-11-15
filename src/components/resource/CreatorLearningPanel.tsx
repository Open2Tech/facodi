import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { z } from 'zod';
import { ArrowRight, BookOpen, ExternalLink } from 'lucide-react';
import { publicLearningRows } from '@/features/learning/publicLearningRpc';

const playlistSchema = z.object({
  playlist_id: z.string(),
  playlist_title: z.string(),
  item_count: z.number(),
  guide_title: z.string(),
  guide_slug: z.string(),
  learning_goal: z.string().nullable().optional(),
  guiding_questions: z.array(z.string()),
  practical_activity: z.string().nullable().optional(),
  suggested_deliverable: z.string().nullable().optional(),
  self_review_criteria: z.string().nullable().optional(),
  teacher_approved: z.boolean(),
});
const videoSchema = z.object({
  video_id: z.string(),
  video_title: z.string(),
  study_topic_slug: z.string(),
  guiding_question: z.string(),
  practice_activity: z.string(),
  self_review_criteria: z.string().nullable().optional(),
  syllabus_links: z.array(z.object({ year: z.number(), unit_title: z.string(), unit_slug: z.string() })),
  editorial_playlists: z.array(z.object({ playlist_slug: z.string(), playlist_title: z.string() })),
  teacher_approved: z.boolean(),
});

export function CreatorLearningPanel({
  kind, slug, youtubeId,
}: { kind: string; slug: string; youtubeId: string | null }) {
  const isIfesPlaylist = kind === 'playlist' && slug.startsWith('facodi-playlist-ifes-');
  const isVideo = kind === 'video' && !!youtubeId;

  const playlist = useQuery({
    queryKey: ['facodi', 'playlist-companion', slug],
    queryFn: () => publicLearningRows('get_public_editorial_playlist_study_guide_v1',
      { p_playlist_slug: slug }, playlistSchema),
    enabled: isIfesPlaylist,
    staleTime: 5 * 60_000,
  });
  const video = useQuery({
    queryKey: ['facodi', 'creator-video-reflection', youtubeId],
    queryFn: () => publicLearningRows('get_public_course_creator_video_study_v1',
      { p_youtube_id: youtubeId }, videoSchema),
    enabled: isVideo,
    staleTime: 5 * 60_000,
  });

  if (!isIfesPlaylist && !isVideo) return null;
  const guide = playlist.data?.[0];
  const reflection = video.data?.[0];

  return <div className="space-y-6">
    {isIfesPlaylist && <section aria-label="Percurso de aprendizagem" className="border border-foreground p-6">
      <p className="font-mono text-xs uppercase text-muted-foreground">FACODI · Sequência editorial</p>
      <h2 className="mt-2 text-2xl font-semibold">Aprende com esta sequência</h2>
      <Link to={`/sequences/${encodeURIComponent(slug)}`}
        className="mt-5 inline-flex items-center gap-2 border border-foreground bg-foreground px-4 py-3 text-sm font-semibold text-background hover:opacity-90">
        Ver aulas organizadas <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      {playlist.isPending && <p role="status" className="mt-4 text-sm text-muted-foreground">A carregar o guia...</p>}
      {playlist.error && <p role="alert" className="mt-4 text-sm">O guia não está disponível neste momento. A sequência de vídeos continua acessível.</p>}
      {guide && <div className="mt-7 border-t border-input pt-6">
        <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase"><BookOpen className="h-4 w-4" aria-hidden="true" /> Guia original de estudo</p>
        <h3 className="mt-3 text-xl font-semibold">{guide.guide_title}</h3>
        {guide.learning_goal && <p className="mt-2 text-sm text-muted-foreground">{guide.learning_goal}</p>}
        <h4 className="mt-5 font-semibold">Questões orientadoras</h4>
        <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm">
          {guide.guiding_questions.map(question => <li key={question}>{question}</li>)}
        </ol>
        {guide.practical_activity && <p className="mt-5 text-sm"><strong>Atividade:</strong> {guide.practical_activity}</p>}
        {guide.suggested_deliverable && <p className="mt-2 text-sm"><strong>Entrega sugerida:</strong> {guide.suggested_deliverable}</p>}
        <p className="mt-5 text-xs text-muted-foreground">
          Material complementar da FACODI, ainda sem validação docente. Os vídeos pertencem aos seus criadores.
        </p>
      </div>}
    </section>}

    {reflection && <section aria-label="Estudo orientado do vídeo" className="border border-foreground p-6">
      <p className="font-mono text-xs uppercase text-muted-foreground">FACODI · Atividade independente</p>
      <h2 className="mt-2 text-2xl font-semibold">Depois de assistir</h2>
      <p className="mt-4 text-sm font-semibold">{reflection.guiding_question}</p>
      <p className="mt-3 text-sm text-muted-foreground">{reflection.practice_activity}</p>
      {!!reflection.editorial_playlists.length && <div className="mt-5">
        <h3 className="text-sm font-semibold">Este vídeo faz parte de</h3>
        <ul className="mt-2 space-y-2 text-sm">{reflection.editorial_playlists.map(item => <li key={item.playlist_slug}>
          <Link className="inline-flex items-center gap-2 underline underline-offset-4" to={`/sequences/${encodeURIComponent(item.playlist_slug)}`}>
            {item.playlist_title} <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </Link>
        </li>)}</ul>
      </div>}
      <p className="mt-5 text-xs text-muted-foreground">
        Esta atividade foi criada a partir do tema e de fontes externas; não é uma transcrição ou avaliação oficial do Ifes.
      </p>
    </section>}
  </div>;
}
