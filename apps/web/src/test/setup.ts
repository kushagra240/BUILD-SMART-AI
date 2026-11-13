import '@testing-library/jest-dom';
import * as matchers from 'vitest-axe/matchers';
import { afterEach, expect } from 'vitest';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';

expect.extend(matchers);

// jsdom does not implement ResizeObserver (used by recharts) or matchMedia
// (used by framer-motion's reduced-motion check). The observer reports a fixed
// box so charts render instead of warning about a 0x0 container.
class ResizeObserverStub {
  private readonly callback: ResizeObserverCallback;

  constructor(callback: ResizeObserverCallback) {
    this.callback = callback;
  }

  observe(target: Element) {
    this.callback(
      [
        {
          target,
          contentRect: { width: 320, height: 260 },
          borderBoxSize: [],
          contentBoxSize: [],
          devicePixelContentBoxSize: [],
        } as unknown as ResizeObserverEntry,
      ],
      this as unknown as ResizeObserver
    );
  }

  unobserve() {}

  disconnect() {}
}

if (typeof globalThis.ResizeObserver === 'undefined') {
  (globalThis as unknown as { ResizeObserver: typeof ResizeObserverStub }).ResizeObserver =
    ResizeObserverStub;
}

if (typeof window.matchMedia !== 'function') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }),
  });
}

// Components rendered directly in tests need the i18next instance initialised.
// Reset the language after every test so a language-switch test cannot leak.
afterEach(async () => {
  await i18n.changeLanguage('en');
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
});
