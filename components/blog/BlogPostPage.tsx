import React, { useMemo } from 'react';
import { createTranslator, type Locale } from '../../data/i18n';
import { getPostBySlug } from '../../data/blogPosts';
import MarkdownView from '../MarkdownView';

interface BlogPostPageProps {
  slug: string;
  locale: Locale;
  onBack: () => void;
}

const BlogPostPage: React.FC<BlogPostPageProps> = ({ slug, locale, onBack }) => {
  const { t } = createTranslator(locale);
  const post = useMemo(() => getPostBySlug(slug), [slug]);

  if (!post) {
    return (
      <section className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
        <div className="stark-border bg-brand-muted p-10 text-center">
          <h1 className="text-3xl font-black uppercase tracking-tight">Artigo nao encontrado</h1>
          <button
            type="button"
            onClick={onBack}
            className="mt-6 stark-border px-5 py-3 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all"
          >
            {t('blog.backToList')}
          </button>
        </div>
      </section>
    );
  }

  return (
    <article className="max-w-[1600px] mx-auto px-6 lg:px-12 py-16 lg:py-24">
      <button
        type="button"
        onClick={onBack}
        className="mb-8 stark-border px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all inline-flex items-center gap-2"
      >
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        {t('blog.backToList')}
      </button>

      <header className="stark-border bg-white p-8 lg:p-12 mb-10">
        <div className="flex flex-wrap gap-2 mb-6">
          <span className="bg-primary px-3 py-1 text-[10px] font-black uppercase tracking-widest">
            {post.category}
          </span>
          <span className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
            {new Date(post.date).toLocaleDateString(locale === 'pt' ? 'pt-PT' : 'en-US')}
          </span>
        </div>

        <h1 className="text-4xl lg:text-6xl font-black tracking-tighter uppercase leading-[0.95]">
          {post.title}
        </h1>

        <p className="mt-4 text-gray-600 text-lg">{post.excerpt}</p>

        <p className="mt-6 text-sm text-gray-500 font-medium">
          {t('blog.by')} {post.author}
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {post.tags.map((tag) => (
            <span
              key={tag}
              className="border border-black/15 px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-gray-600"
            >
              {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="stark-border bg-white p-8 lg:p-12">
        <MarkdownView content={post.content ?? ''} />
      </div>
    </article>
  );
};

export default BlogPostPage;