import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import i18n from './index';
import en from './locales/en.json';
import hi from './locales/hi.json';
import mr from './locales/mr.json';
import { NotFoundPage } from '../pages/NotFoundPage';

type Dictionary = Record<string, unknown>;

/** Flattens a nested dictionary into dot-separated string keys. */
function flatten(dictionary: Dictionary, prefix = ''): Record<string, string> {
  return Object.entries(dictionary).reduce<Record<string, string>>((flat, [key, value]) => {
    const path = prefix ? `${prefix}.${key}` : key;
    if (typeof value === 'string') {
      flat[path] = value;
    } else if (value !== null && typeof value === 'object') {
      Object.assign(flat, flatten(value as Dictionary, path));
    }
    return flat;
  }, {});
}

/** Extracts `{{placeholder}}` names so translations cannot drop a variable. */
function placeholders(value: string): string[] {
  return [...value.matchAll(/\{\{\s*(\w+)\s*\}\}/g)].map((match) => match[1]).sort();
}

const englishKeys = Object.keys(flatten(en)).sort();
const locales = {
  hi: flatten(hi),
  mr: flatten(mr),
};

describe('translation dictionaries', () => {
  afterEach(() => {
    cleanup();
  });

  it.each(Object.keys(locales))('%s has exactly the same keys as English', (language) => {
    const dictionary = locales[language as keyof typeof locales];
    expect(Object.keys(dictionary).sort()).toEqual(englishKeys);
  });

  it.each(Object.keys(locales))('%s has no empty or untranslated-placeholder values', (language) => {
    const dictionary = locales[language as keyof typeof locales];
    for (const key of englishKeys) {
      expect(dictionary[key]?.trim(), `${language} is missing ${key}`).not.toBe('');
      expect(placeholders(dictionary[key] ?? ''), `${language} placeholder mismatch at ${key}`).toEqual(
        placeholders(flatten(en)[key])
      );
    }
  });

  it('renders the Hindi dictionary when the language is Hindi', async () => {
    await i18n.changeLanguage('hi');
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: hi.notFound.title })).toBeInTheDocument();
    expect(screen.getByText(hi.notFound.body)).toBeInTheDocument();
  });

  it('renders the Marathi dictionary when the language is Marathi', async () => {
    await i18n.changeLanguage('mr');
    render(
      <MemoryRouter>
        <NotFoundPage />
      </MemoryRouter>
    );

    expect(screen.getByRole('heading', { name: mr.notFound.title })).toBeInTheDocument();
    expect(screen.getByText(mr.notFound.body)).toBeInTheDocument();
  });
});
