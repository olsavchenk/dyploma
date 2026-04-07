/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{html,ts}'],
  theme: {
    extend: {
      // ── Brand Color Scales ──────────────────────────────────────────────
      colors: {
        blue: {
          50:  '#EEF3FB',
          100: '#D6E2F4',
          200: '#A7BEE6',
          300: '#6D91D2',
          400: '#3F68BA',
          500: '#1F4CA4',
          600: '#0B3D91',
          700: '#082E6E',
          800: '#061F4B',
          900: '#03112A',
        },
        sun: {
          50:  '#FFFAE5',
          100: '#FFF1B8',
          200: '#FFE580',
          300: '#FFD94C',
          400: '#FFD500',
          500: '#E6BE00',
          600: '#B79700',
          700: '#8A7100',
        },
        ink: {
          DEFAULT: '#0A0E1F',
          soft:    '#2B3046',
        },
        paper:       '#FAF7F1',
        rule:        '#E7E1D3',
        'surface-alt': '#F2ECDD',
        tier: {
          bronze:   '#B87333',
          silver:   '#9DA3AE',
          gold:     '#E3B341',
          platinum: '#7FDBDA',
          diamond:  '#5AB1FF',
        },
        success: '#1F8F5C',
        warning: '#D97706',
        danger:  '#C62828',
        info:    '#0B7AB8',
      },

      // ── Typography ────────────────────────────────────────────────────────
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans:    ['Manrope', 'system-ui', 'sans-serif'],
        mono:    ['JetBrains Mono', 'monospace'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1rem' }],
        xs:    ['0.75rem',  { lineHeight: '1rem' }],
        sm:    ['0.875rem', { lineHeight: '1.25rem' }],
        base:  ['1rem',     { lineHeight: '1.6rem' }],
        lg:    ['1.125rem', { lineHeight: '1.75rem' }],
        xl:    ['1.25rem',  { lineHeight: '1.875rem' }],
        '2xl': ['1.5rem',   { lineHeight: '2rem' }],
        '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
        '4xl': ['2.25rem',  { lineHeight: '2.5rem' }],
        '5xl': ['3rem',     { lineHeight: '1.15' }],
        '6xl': ['3.75rem',  { lineHeight: '1.1' }],
      },

      // ── Spacing (4px grid) ────────────────────────────────────────────────
      spacing: {
        '0.5': '2px',
        '1':   '4px',
        '2':   '8px',
        '3':   '12px',
        '4':   '16px',
        '5':   '20px',
        '6':   '24px',
        '8':   '32px',
        '10':  '40px',
        '12':  '48px',
        '16':  '64px',
        '20':  '80px',
        '24':  '96px',
        '32':  '128px',
      },

      // ── Border Radius ─────────────────────────────────────────────────────
      borderRadius: {
        xs:   '6px',
        sm:   '10px',
        md:   '14px',
        lg:   '20px',
        xl:   '28px',
        pill: '999px',
      },

      // ── Box Shadow ────────────────────────────────────────────────────────
      boxShadow: {
        card:  '0 4px 16px -4px rgba(11,61,145,.12)',
        hero:  '0 16px 40px -16px rgba(11,61,145,.18)',
        float: '0 24px 64px -24px rgba(11,61,145,.24)',
        focus: '0 0 0 4px rgba(255,213,0,.35)',
        'inner-sm': 'inset 0 1px 3px rgba(0,0,0,.08)',
      },

      // ── Keyframes ─────────────────────────────────────────────────────────
      keyframes: {
        'rise-in': {
          from: { opacity: '0', transform: 'translateY(12px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
        'fade-in': {
          from: { opacity: '0' },
          to:   { opacity: '1' },
        },
        'sun-burst': {
          '0%':   { opacity: '0', transform: 'scale(0.6)' },
          '60%':  { opacity: '1', transform: 'scale(1.08)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'scale-pop': {
          '0%':   { transform: 'scale(1)' },
          '40%':  { transform: 'scale(1.18)' },
          '100%': { transform: 'scale(1)' },
        },
        'slide-up': {
          from: { opacity: '0', transform: 'translateY(20px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },

      // ── Animations ────────────────────────────────────────────────────────
      animation: {
        'rise-in':   'rise-in 400ms cubic-bezier(.2,.7,.2,1) both',
        'fade-in':   'fade-in 300ms ease-out both',
        'sun-burst': 'sun-burst 600ms cubic-bezier(.34,1.56,.64,1) both',
        'scale-pop': 'scale-pop 300ms cubic-bezier(.34,1.56,.64,1) both',
        'slide-up':  'slide-up 400ms cubic-bezier(.2,.7,.2,1) both',
      },

      // ── Easing ────────────────────────────────────────────────────────────
      transitionTimingFunction: {
        editorial: 'cubic-bezier(.2,.7,.2,1)',
        spring:    'cubic-bezier(.34,1.56,.64,1)',
      },
    },
  },
  plugins: [],
  important: true,
};
