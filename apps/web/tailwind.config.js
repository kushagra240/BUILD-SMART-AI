/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Figma design system (see docs/decisions/ADR-001-design-language-from-landing-export.md).
        // `paper` is the page canvas, `panel` the card surface, `night` the
        // signature dark CTA, `accent` the single interactive colour.
        paper: {
          DEFAULT: '#F2F4F7',
          deep: '#E8ECF2',
        },
        panel: {
          DEFAULT: '#FBFCFE',
          muted: '#F6F8FB',
        },
        night: {
          DEFAULT: '#151820',
          soft: '#20242C',
          deep: '#111319',
        },
        accent: {
          DEFAULT: '#315EFB',
          hover: '#2455E6',
          soft: '#E8EDFF',
          tint: '#EDF1FF',
          deep: '#214AC9',
        },
        line: {
          DEFAULT: '#DCE1E8',
          soft: '#DFE4EC',
          strong: '#E1E5EB',
        },
        ink: {
          DEFAULT: '#17191F',
          soft: '#747C88',
          hairline: 'rgba(23, 25, 31, 0.10)',
        },
        // Legacy semantic aliases kept so existing screens adopt the new
        // palette without a per-file colour audit. Brick and forest now both
        // resolve to the accent blue; `night` is used for dark primary CTAs.
        brick: {
          DEFAULT: '#315EFB',
          hover: '#2455E6',
          light: '#E8EDFF',
        },
        forest: {
          DEFAULT: '#315EFB',
          hover: '#2455E6',
          light: '#E8EDFF',
        },
        clay: {
          DEFAULT: '#E1E5EB',
          light: '#EDF0F5',
        },
        ochre: {
          DEFAULT: '#D9A441',
          light: '#FAF3E3',
        },
        success: '#3F7D4E',
        warning: '#C98B2B',
        error: '#A32D2D',
        // Cost-category ramp: dark neutral -> accent blue -> cool grey.
        chart: {
          foundation: '#151820',
          structure: '#315EFB',
          masonry: '#6685F4',
          roofing: '#2455E6',
          flooring: '#8FA8F5',
          plumbing: '#8F98A8',
          electrical: '#B7C2D8',
          finishing: '#5C6470',
          labour: '#AFC4FB',
        },
      },
      fontFamily: {
        headline: ['Manrope', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
        sans: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        body: ['Manrope', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        figures: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
        xl: '13px',
        '2xl': '15px',
        '3xl': '17px',
      },
      maxWidth: {
        shell: '1400px',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(23, 25, 31, 0.06), 0 1px 2px rgba(23, 25, 31, 0.04)',
        card: '0 2px 8px rgba(23, 25, 31, 0.05)',
        nav: '0 12px 35px rgba(18, 23, 32, 0.14)',
        soft: '0 12px 34px rgba(18, 24, 35, 0.08)',
        lift: '0 18px 40px rgba(18, 24, 35, 0.13)',
        panel: '0 20px 55px rgba(18, 24, 35, 0.08)',
      },
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(14px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'rise-in': 'rise-in 0.5s cubic-bezier(0.16, 1, 0.3, 1) both',
      },
    },
  },
  plugins: [],
};
