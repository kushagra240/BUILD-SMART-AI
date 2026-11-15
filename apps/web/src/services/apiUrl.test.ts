import { describe, expect, it } from 'vitest';

import { resolveApiUrl } from './apiClient';

const RENDER = 'https://build-smart-ai-42f1.onrender.com';

describe('resolveApiUrl', () => {
  it('falls back to the same-origin proxy when no URL is configured', () => {
    expect(resolveApiUrl(undefined)).toBe('/api/v1');
    expect(resolveApiUrl('')).toBe('/api/v1');
    expect(resolveApiUrl('   ')).toBe('/api/v1');
  });

  it('uses the same-origin proxy for localhost so the dev proxy and cookie stay first-party', () => {
    expect(resolveApiUrl('http://localhost:8000')).toBe('/api/v1');
    expect(resolveApiUrl('http://127.0.0.1:8000/api/v1')).toBe('/api/v1');
  });

  it('accepts an absolute backend URL and appends the API path once', () => {
    expect(resolveApiUrl(RENDER)).toBe(`${RENDER}/api/v1`);
    expect(resolveApiUrl(`${RENDER}/`)).toBe(`${RENDER}/api/v1`);
    expect(resolveApiUrl(`${RENDER}/api/v1`)).toBe(`${RENDER}/api/v1`);
    expect(resolveApiUrl(`${RENDER}/api/v1/`)).toBe(`${RENDER}/api/v1`);
  });

  it('recovers a URL that was pasted as a markdown link (production incident)', () => {
    expect(resolveApiUrl(`[${RENDER}](${RENDER})`)).toBe(`${RENDER}/api/v1`);
  });

  it('trims quotes, backticks and whitespace around the value', () => {
    expect(resolveApiUrl(`  "${RENDER}"  `)).toBe(`${RENDER}/api/v1`);
    expect(resolveApiUrl(`\`${RENDER}\``)).toBe(`${RENDER}/api/v1`);
  });

  it('assumes https for a bare hostname', () => {
    expect(resolveApiUrl('build-smart-ai-42f1.onrender.com')).toBe(`${RENDER}/api/v1`);
  });

  it('ignores values that cannot become a usable API base', () => {
    expect(resolveApiUrl('not a url')).toBe('/api/v1');
    expect(resolveApiUrl('ftp://example.com')).toBe('/api/v1');
    expect(resolveApiUrl('/api/v1')).toBe('/api/v1');
  });

  it('refuses a plain-HTTP backend when the app is served over HTTPS', () => {
    expect(resolveApiUrl('http://api.example.com', { servedOverHttps: true })).toBe('/api/v1');
  });
});
