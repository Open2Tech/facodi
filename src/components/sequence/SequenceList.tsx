import { ArrowRight } from 'lucide-react';
import { VideoThumbnail } from '@/components/resource/VideoCard';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import type { SequenceSummary } from '@/entities/sequence/sequence';
import { plainText } from '@/shared/lib/text';

/** Ruled list of editorial sequences; the lesson count and linked unit codes are the scanning cues. */
/** `showUnits` is off inside a unit page, where the list is already filtered to that unit. */
export function SequenceList({ sequences, headingLevel = 2, showUnits = true }: { sequences: SequenceSummary[]; headingLevel?: 2 | 3 | 4; showUnits?: boolean }) {
  const { t } = useTranslation();
  const Heading = headingLevel === 2 ? 'h2' : headingLevel === 3 ? 'h3' : 'h4';
  return <ul className="divide-y divide-input border-y border-input">
    {sequences.map(sequence => <li key={sequence.id}>
      <Link to={`/sequences/${encodeURIComponent(sequence.slug)}`}
        className="group grid grid-cols-[6rem_minmax(0,1fr)] gap-x-4 gap-y-2 py-5 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring sm:grid-cols-[10rem_minmax(0,1fr)_auto] sm:gap-x-6 sm:px-3">
        <span className="self-start border border-input"><VideoThumbnail info={{ youtubeId: null, thumbnail: sequence.cover, durationSeconds: null, channel: null, reviewScope: null, fullReviewed: false, licenseVerified: false }} /></span>
        <span className="min-w-0">
          <Heading className="text-lg font-semibold leading-snug decoration-2 underline-offset-4 group-hover:underline">{sequence.title}</Heading>
          {sequence.description && <span className="mt-1 line-clamp-2 max-w-prose text-sm text-muted-foreground">{plainText(sequence.description)}</span>}
        </span>
        <span className="col-start-2 flex items-center gap-4 text-sm sm:col-start-auto sm:flex-col sm:items-end sm:justify-center sm:gap-1">
          <span className="font-mono tabular-nums">{t('sequences.lessons', { count: sequence.itemCount })}</span>
          {showUnits && !!sequence.unitCodes.length && <span className="font-mono text-label text-muted-foreground">{t('sequences.unitCount', { count: sequence.unitCodes.length })}</span>}
          <ArrowRight className="hidden h-4 w-4 sm:block" aria-hidden="true" />
        </span>
      </Link>
    </li>)}
  </ul>;
}
