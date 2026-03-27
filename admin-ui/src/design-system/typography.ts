/**
 * Real Estate CRM — Typography Tokens
 * Issue #7 — UX Design System
 */

export const typography = {
  /** Font families */
  fontFamily: {
    sans:  ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
    serif: ['Georgia', 'ui-serif', 'serif'],
    mono:  ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace'],
  },

  /** Font sizes (rem) */
  fontSize: {
    xs:   '0.75rem',   // 12px
    sm:   '0.875rem',  // 14px
    base: '1rem',      // 16px
    lg:   '1.125rem',  // 18px
    xl:   '1.25rem',   // 20px
    '2xl': '1.5rem',   // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
    '5xl': '3rem',     // 48px
  },

  /** Font weights */
  fontWeight: {
    thin:       '100',
    extralight: '200',
    light:      '300',
    normal:     '400',
    medium:     '500',
    semibold:   '600',
    bold:       '700',
    extrabold:  '800',
    black:      '900',
  },

  /** Line heights */
  lineHeight: {
    none:     '1',
    tight:    '1.25',
    snug:     '1.375',
    normal:   '1.5',
    relaxed:  '1.625',
    loose:    '2',
  },

  /** Letter spacing */
  letterSpacing: {
    tighter: '-0.05em',
    tight:   '-0.025em',
    normal:  '0em',
    wide:    '0.025em',
    wider:   '0.05em',
    widest:  '0.1em',
  },

  /** Semantic text styles — combine the above tokens */
  textStyles: {
    heading1: {
      fontSize:   '2.25rem',
      fontWeight: '700',
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    heading2: {
      fontSize:   '1.875rem',
      fontWeight: '700',
      lineHeight: '1.25',
      letterSpacing: '-0.025em',
    },
    heading3: {
      fontSize:   '1.5rem',
      fontWeight: '600',
      lineHeight: '1.375',
    },
    heading4: {
      fontSize:   '1.25rem',
      fontWeight: '600',
      lineHeight: '1.375',
    },
    bodyLarge: {
      fontSize:   '1.125rem',
      fontWeight: '400',
      lineHeight: '1.625',
    },
    body: {
      fontSize:   '1rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    bodySmall: {
      fontSize:   '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    caption: {
      fontSize:   '0.75rem',
      fontWeight: '400',
      lineHeight: '1.5',
    },
    label: {
      fontSize:   '0.875rem',
      fontWeight: '500',
      lineHeight: '1.25',
      letterSpacing: '0.025em',
    },
    code: {
      fontSize:   '0.875rem',
      fontWeight: '400',
      lineHeight: '1.5',
      fontFamily: 'JetBrains Mono, monospace',
    },
  },
} as const;

export type TypographyScale = typeof typography;
