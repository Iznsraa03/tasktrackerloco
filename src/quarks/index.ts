// ============================================================
// LOCO 21 PRO — Design Tokens (Quarks Level)
// Atomic Design: Sub-atomic primitive values — not components
// ============================================================

export const colors = {
  // Core Black-Blue palette
  black: {
    pure: '#FFFFFF',
    rich: '#F8FAFC',
    deep: '#EFEFEF',
    card: '#FFFFFF',
    elevated: '#F8FAFC',
  },
  red: {
    electric: '#D2001A',
    bright: '#EF4444',
    neon: '#DC2626',
    midnight: '#7F1D1D',
    dark: '#991B1B',
    glow: 'rgba(210,0,26,0.15)',
  },
  slate: {
    900: '#0f172a',
    800: '#1e293b',
    700: '#334155',
    600: '#475569',
    500: '#64748b',
    400: '#94a3b8',
    300: '#cbd5e1',
    200: '#e2e8f0',
    100: '#f1f5f9',
  },
  // Status colors
  status: {
    success: '#10b981',
    successLight: 'rgba(16,185,129,0.1)',
    warning: '#f59e0b',
    warningLight: 'rgba(245,158,11,0.1)',
    danger: '#ef4444',
    dangerLight: 'rgba(239,68,68,0.1)',
    info: '#3b82f6',
    infoLight: 'rgba(59,130,246,0.1)',
    purple: '#8b5cf6',
    purpleLight: 'rgba(139,92,246,0.1)',
    orange: '#f97316',
    orangeLight: 'rgba(249,115,22,0.1)',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  '2xl': '48px',
  '3xl': '64px',
} as const;

export const typography = {
  fontFamily: {
    sans: 'Inter, ui-sans-serif, system-ui, sans-serif',
    mono: 'JetBrains Mono, Fira Code, monospace',
  },
  fontSize: {
    xs: '10px',
    sm: '12px',
    base: '14px',
    md: '16px',
    lg: '18px',
    xl: '20px',
    '2xl': '24px',
    '3xl': '30px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
} as const;

export const shadows = {
  sm: '0 1px 2px rgba(0,0,0,0.3)',
  md: '0 4px 6px rgba(0,0,0,0.4)',
  lg: '0 10px 15px rgba(0,0,0,0.5)',
  glow: '0 0 20px rgba(0,102,255,0.3)',
  glowStrong: '0 0 40px rgba(0,102,255,0.5)',
} as const;

export const borderRadius = {
  sm: '6px',
  md: '10px',
  lg: '14px',
  xl: '18px',
  full: '9999px',
} as const;

export const transitions = {
  fast: '150ms ease',
  normal: '250ms ease',
  slow: '400ms ease',
} as const;
