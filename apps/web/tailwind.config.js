/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        paper: {
          DEFAULT: '#F6F1E7',
          deep: '#EBE2D0',
        },
        ink: {
          DEFAULT: '#1F2421',
          soft: '#5A615C',
          hairline: 'rgba(31, 36, 33, 0.14)',
        },
        brick: {
          DEFAULT: '#B4472B',
          hover: '#9E3E25',
          light: '#F7EDE9',
        },
        forest: {
          DEFAULT: '#1F4D45',
          hover: '#173D37',
          light: '#E6EFEA',
        },
        ochre: {
          DEFAULT: '#D9A441',
          light: '#FAF3E3',
        },
        clay: {
          DEFAULT: '#E8DCC7',
          light: '#F3ECE0',
        },
        success: '#3F7D4E',
        warning: '#C98B2B',
        error: '#A32D2D',
        // Chart colors
        chart: {
          foundation: '#6B4F3A',
          structure: '#1F4D45',
          masonry: '#B4472B',
          roofing: '#8A6FA0',
          flooring: '#D9A441',
          plumbing: '#4F86A6',
          electrical: '#9BB05A',
          finishing: '#D88C9A',
          labour: '#3A3F3C',
        },
      },
      fontFamily: {
        headline: ['Fraunces', 'Georgia', 'serif'],
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['"Instrument Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        body: ['"Instrument Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
        figures: ['"IBM Plex Mono"', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '8px',
        md: '8px',
        lg: '10px',
      },
      borderWidth: {
        hairline: '1px',
      },
      borderColor: {
        hairline: 'rgba(31, 36, 33, 0.14)',
      },
      boxShadow: {
        subtle: '0 1px 3px rgba(31, 36, 33, 0.06), 0 1px 2px rgba(31, 36, 33, 0.04)',
        card: '0 2px 6px rgba(31, 36, 33, 0.05)',
      },
    },
  },
  plugins: [],
};
