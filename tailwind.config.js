// ============================================================
// tailwind.config.js — Configuração do Tailwind CSS v3
// Tema "Industrial Clean" — chumbo escuro + âmbar metálico
// ============================================================

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],

  darkMode: 'class',

  theme: {
    extend: {
      // ─── Fonte ─────────────────────────────────────────────
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },

      // ─── Paleta "Industrial Clean" ─────────────────────────
      colors: {
        fenix: {
          bg:        '#0a0a0f',
          surface:   '#111118',
          card:      '#16161f',
          cardHover: '#1e1e2a',
          border:    '#2a2a3a',
          borderAlt: '#3a3a50',
        },

        amber: {
          DEFAULT: '#f59e0b',
          light:   '#fbbf24',
          dark:    '#d97706',
          glow:    'rgba(245, 158, 11, 0.2)',
        },

        steel: {
          DEFAULT: '#94a3b8',
          light:   '#cbd5e1',
          dark:    '#475569',
        },

        status: {
          ok:       '#10b981',
          warning:  '#f59e0b',
          critical: '#ef4444',
          okBg:     'rgba(16, 185, 129, 0.12)',
          warnBg:   'rgba(245, 158, 11, 0.12)',
          critBg:   'rgba(239, 68, 68, 0.12)',
        },
      },

      // ─── Tipografia fluida ─────────────────────────────────
      fontSize: {
        // clamp() nativo no Tailwind v3 via fontSize
        'fluid-sm': 'clamp(0.75rem, 1.5vw, 0.875rem)',
        'fluid-md': 'clamp(0.875rem, 2vw, 1rem)',
        'fluid-lg': 'clamp(1rem, 2.5vw, 1.25rem)',
        'fluid-xl': 'clamp(1.25rem, 3vw, 1.75rem)',
      },

      // ─── Espaçamentos extras ───────────────────────────────
      spacing: {
        '4.5': '1.125rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
      },

      // ─── Animações ─────────────────────────────────────────
      keyframes: {
        pulse_border: {
          '0%, 100%': { borderColor: '#ef4444' },
          '50%':      { borderColor: 'rgba(239, 68, 68, 0.25)' },
        },
        fade_in: {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to:   { opacity: '1', transform: 'translateY(0)'   },
        },
        shimmer: {
          '0%':   { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition:  '200% 0' },
        },
        // entrada lateral para painéis/drawers
        slide_in: {
          from: { opacity: '0', transform: 'translateX(-8px)' },
          to:   { opacity: '1', transform: 'translateX(0)'    },
        },
      },

      animation: {
        pulse_border: 'pulse_border 1.5s ease-in-out infinite',
        fade_in:      'fade_in 0.3s ease-out forwards',
        shimmer:      'shimmer 1.6s ease-in-out infinite',
        slide_in:     'slide_in 0.25s ease-out forwards',
      },

      // ─── Transições ────────────────────────────────────────
      transitionDuration: {
        '250': '250ms',
      },

      transitionTimingFunction: {
        'smooth': 'cubic-bezier(0.4, 0, 0.2, 1)',
      },

      // ─── Bordas ────────────────────────────────────────────
      borderRadius: {
        'card': '0.75rem',
      },

      // ─── Box shadows industriais ───────────────────────────
      boxShadow: {
        'card':     '0 1px 3px rgba(0,0,0,0.5), 0 1px 2px rgba(0,0,0,0.4)',
        'card-hov': '0 4px 20px rgba(0,0,0,0.6), 0 0 0 1px rgba(245,158,11,0.1)',
        'amber':    '0 0 20px rgba(245,158,11,0.15)',
        'amber-lg': '0 0 40px rgba(245,158,11,0.2), 0 0 80px rgba(245,158,11,0.08)',
        'inset-top':'inset 0 1px 0 rgba(255,255,255,0.04)',
      },
    },
  },

  plugins: [],
}