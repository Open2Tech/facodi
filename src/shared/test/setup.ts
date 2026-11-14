import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { server } from './mswServer';

localStorage.setItem('i18nextLng', 'en');

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

class IntersectionObserverMock {
  constructor(public callback: IntersectionObserverCallback) {}
  observe() {
    // Trigger intersection for testing
    this.callback(
      [
        {
          target: document.createElement('div'),
          isIntersecting: true,
          intersectionRatio: 1,
          time: 0,
          boundingClientRect: new DOMRect(),
          intersectionRect: new DOMRect(),
          rootBounds: null,
        },
      ],
      this as unknown as IntersectionObserver
    );
  }
  unobserve() {}
  disconnect() {}
  takeRecords() {
    return [];
  }
}

if (!window.ResizeObserver) {
  window.ResizeObserver = ResizeObserverMock;
}

if (!window.IntersectionObserver) {
  window.IntersectionObserver = IntersectionObserverMock as unknown as typeof IntersectionObserver;
}

if (!window.scrollTo) {
  window.scrollTo = vi.fn();
}

beforeAll(() => {
  server.listen();
});

afterEach(() => {
  server.resetHandlers();
  cleanup();
});

afterAll(() => {
  server.close();
});
