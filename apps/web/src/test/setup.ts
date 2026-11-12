import '@testing-library/jest-dom';
import * as matchers from 'vitest-axe/matchers';
import { afterEach, expect } from 'vitest';
import i18n, { LANGUAGE_STORAGE_KEY } from '../i18n';

expect.extend(matchers);

// Components rendered directly in tests need the i18next instance initialised.
// Reset the language after every test so a language-switch test cannot leak.
afterEach(async () => {
  await i18n.changeLanguage('en');
  window.localStorage.removeItem(LANGUAGE_STORAGE_KEY);
});
