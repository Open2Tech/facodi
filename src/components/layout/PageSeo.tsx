import { useMemo, useState, type ReactNode } from 'react';
import { Helmet } from 'react-helmet-async';
import { headTags, type PageMeta } from '@/shared/seo/seo';
import { SeoClaimsContext, useSeoClaim, type SeoClaim, type SeoClaims } from '@/components/layout/seoClaims';

export function SeoScope({ children }: { children: ReactNode }) {
  const [claims, setClaims] = useState<SeoClaims>({ page: 0, robots: 0 });
  const [claim] = useState(() => (key: SeoClaim) => {
    setClaims(current => ({ ...current, [key]: current[key] + 1 }));
    return () => setClaims(current => ({ ...current, [key]: current[key] - 1 }));
  });
  const value = useMemo(() => ({ claims, claim }), [claims, claim]);
  return <SeoClaimsContext.Provider value={value}>{children}</SeoClaimsContext.Provider>;
}

/** Per-page title, description, canonical, share card and JSON-LD; the build snapshots use the same tags. */
export function PageSeo(props: PageMeta) {
  useSeoClaim(...(props.noindex ? ['page', 'robots'] as const : ['page'] as const));
  return <Helmet>
    {headTags(props).map((tag, index) => {
      if (tag.tag === 'title') return <title key="title">{tag.text}</title>;
      if (tag.tag === 'link') return <link key={tag.rel} rel={tag.rel} href={tag.href} />;
      if (tag.tag === 'script') return <script key={`ld-${index}`} type={tag.type}>{tag.text}</script>;
      return tag.name
        ? <meta key={tag.name} name={tag.name} content={tag.content} />
        : <meta key={tag.property} property={tag.property} content={tag.content} />;
    })}
  </Helmet>;
}

/** Missing or unpublished content: keep it out of search results. */
export function NoIndex() {
  useSeoClaim('robots');
  return <Helmet><meta name="robots" content="noindex, follow" /></Helmet>;
}
