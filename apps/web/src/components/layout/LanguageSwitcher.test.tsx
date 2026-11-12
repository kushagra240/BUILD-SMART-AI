import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { LanguageSwitcher } from './LanguageSwitcher';
import i18n, { LANGUAGE_STORAGE_KEY } from '../../i18n';

describe('LanguageSwitcher', () => {
  it('lists English, Hindi and Marathi with a translated accessible label', () => {
    render(<LanguageSwitcher />);

    expect(screen.getByLabelText('Language')).toBeInTheDocument();
    const options = screen.getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual([
      'English',
      'हिंदी',
      'मराठी',
    ]);
  });

  it('switches the whole namespace to Hindi and remembers the choice', async () => {
    render(<LanguageSwitcher />);

    fireEvent.change(screen.getByLabelText('Language'), { target: { value: 'hi' } });

    expect(await screen.findByLabelText('भाषा')).toBeInTheDocument();
    expect(screen.getByText('हिंदी')).toBeInTheDocument();
    expect(window.localStorage.getItem(LANGUAGE_STORAGE_KEY)).toBe('hi');
    expect(i18n.language).toBe('hi');
  });

  it('exposes Marathi navigation strings once Marathi is selected', async () => {
    await i18n.changeLanguage('mr');
    render(<LanguageSwitcher />);

    expect(screen.getByLabelText('भाषा')).toBeInTheDocument();
    expect(i18n.t('nav.newEstimate')).toBe('नवीन अंदाज');
  });
});
