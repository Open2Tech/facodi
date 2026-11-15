import type { ReactElement } from 'react';
import { waitFor } from '@testing-library/react';
import { HelmetProvider } from 'react-helmet-async';
import { Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import FacodiLayout from '@/components/layout/FacodiLayout';
import { NoIndex, PageSeo, SeoScope } from '@/components/layout/PageSeo';
import { removeStaticHeadTags } from '@/components/layout/seoClaims';
import { renderHeadTags, staticPageMeta } from '@/shared/seo/seo';
import { renderWithProviders } from '@/shared/test/renderWithProviders';

vi.mock('@/features/auth/useAuth', () => ({ useAuth: () => ({ user: null, role: 'user', loading: false, signOut: vi.fn() }) }));

const head = (selector: string) => [...document.head.querySelectorAll(selector)];

function renderRoute(route: string, page: ReactElement) {
  return renderWithProviders(<HelmetProvider><SeoScope><Routes>
    <Route element={<FacodiLayout />}><Route path="*" element={page} /></Route>
  </Routes></SeoScope></HelmetProvider>, { route });
}

describe('page head ownership', () => {
  it('drops the static shell tags so React owns the head', () => {
    document.head.innerHTML = `${renderHeadTags([{ tag: 'title', text: 'Shell' }, { tag: 'meta', name: 'description', content: 'Shell' }])}<meta name="theme-color" content="#000">`;
    removeStaticHeadTags();
    expect(head('title, meta[name=description]')).toHaveLength(0);
    expect(head('meta[name=theme-color]')).toHaveLength(1);
  });

  it('lets a page replace the layout title and description instead of duplicating them', async () => {
    document.head.innerHTML = '';
    renderRoute('/courses', <PageSeo {...staticPageMeta('/courses', { title: 'Explorar cursos', description: 'Catálogo aberto.' })} />);
    await waitFor(() => expect(document.title).toBe('Explorar cursos — FACODI'));
    expect(head('title')).toHaveLength(1);
    expect(head('meta[name=description]').map(meta => meta.getAttribute('content'))).toEqual(['Catálogo aberto.']);
    expect(head('link[rel=canonical]').map(link => link.getAttribute('href'))).toEqual(['https://facodi.com/courses']);
  });

  it('keeps a single robots tag when the layout and a page both ask for noindex', async () => {
    document.head.innerHTML = '';
    renderRoute('/login', <NoIndex />);
    await waitFor(() => expect(head('meta[name=robots]').map(meta => meta.getAttribute('content'))).toEqual(['noindex, follow']));
    expect(head('title')).toHaveLength(1);
    expect(head('meta[name=description]')).toHaveLength(1);
  });
});
