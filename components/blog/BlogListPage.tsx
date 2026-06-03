import React, { useMemo } from 'react';
import { createTranslator, type Locale } from '../../data/i18n';
import { getPublishedPosts } from '../../data/blogPosts';

interface BlogListPageProps {
  locale: Locale;
  onSelectPost: (slug: string) => void;
}

const BlogListPage: React.FC<BlogListPageProps> = ({ locale, onSelectPost }) => {
  const { t } = createTranslator(locale);
  const posts = useMemo(() => getPublishedPosts(), []);

  return (
    <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <div className="mb-12">
        <h1 className="text-6xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.85]">
          {t('blog.title')}
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-3xl">
          Reflexoes sobre educacao aberta, tecnologia inclusiva e comunidade.
        </p>
      </div>

      {!posts.length && (
        <div className="stark-border bg-brand-muted p-10 text-center">
          <p className="text-lg font-semibold text-gray-700">{t('blog.empty')}</p>
        </div>
      )}

      {!!posts.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {posts.map((post) => (
            <article key={post.slug} className="stark-border bg-white p-8 flex flex-col gap-5">
              <div className="flex flex-wrap gap-2">
                <span className="bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest">
                  {post.category}
                </span>
                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                  {new Date(post.date).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
                </span>
              </div>

              <h2 className="text-3xl font-black tracking-tight text-black">{post.title}</h2>

              <p className="text-gray-600 text-lg leading-relaxed">{post.excerpt}</p>

              <p className="text-sm text-gray-500 font-medium">
                {t('blog.by')} {post.author}
              </p>

              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="border border-black/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>

              <button
                type="button"
                onClick={() => onSelectPost(post.slug)}
                className="mt-2 inline-flex items-center justify-center stark-border px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all"
              >
                {t('blog.readMore')}
              </button>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default BlogListPage;