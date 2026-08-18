/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        theme: {
          global: 'var(--bg-global)',
          card: 'var(--bg-card)',
          'secondary-bg': 'var(--bg-secondary)',
          hover: 'var(--bg-hover)',
          border: 'var(--border-card)',
          primary: 'var(--text-primary)',
          secondary: 'var(--text-secondary)',
          muted: 'var(--text-muted)',
          indigo: 'var(--brand-indigo)',
          amber: 'var(--brand-amber)',
          'badge-indigo': 'var(--badge-indigo-bg)',
          'badge-amber': 'var(--badge-amber-bg)'
        },
        brand: {
          50: '#F0F4F8',
          100: '#D9E2EC',
          500: '#2B4C7E',
          600: '#1B365D',
          700: '#102A43',
          800: '#0B1A30',
          900: '#060F1E'
        },
        accent: {
          50: '#FAF7F2',
          100: '#F0E5D1',
          500: '#C5A059',
          605: '#B08B47',
          700: '#9C7737',
          850: '#815F24',
          900: '#614414'
        },
        dark: {
          bg: '#060B16',
          card: 'rgba(255,255,255,0.03)',
          sidebar: '#060B16',
          border: 'rgba(255,255,255,0.06)'
        }
      },
      boxShadow: {
        theme: 'var(--shadow-card)'
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
};
