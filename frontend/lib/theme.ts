/**
 * Application Theme Configuration
 * Teal/Cyan color palette - Cool, modern, professional
 */

export const theme = {
  colors: {
    // Primary - Teal/Cyan
    primary: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a',
    },

    // Secondary - Slate
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
    },

    // Accent - Emerald (success states)
    accent: {
      500: '#10b981',
      600: '#059669',
    },

    // Danger - Rose (critical issues)
    danger: {
      500: '#f43f5e',
      600: '#e11d48',
    },

    // Warning - Amber
    warning: {
      500: '#f59e0b',
      600: '#d97706',
    },
  },

  gradients: {
    primary: 'from-cyan-500 to-teal-600',
    secondary: 'from-slate-600 to-slate-700',
    hero: 'from-white to-cyan-50',
    card: 'from-cyan-500 to-teal-600',
  },
} as const;

// Severity color mappings
export const severityColors = {
  critical: 'text-rose-600 bg-rose-50 border-rose-200',
  warning: 'text-amber-600 bg-amber-50 border-amber-200',
  suggestion: 'text-cyan-600 bg-cyan-50 border-cyan-200',
} as const;

// Priority color mappings
export const priorityColors = {
  critical: 'text-rose-600',
  high: 'text-amber-600',
  medium: 'text-cyan-600',
  low: 'text-slate-600',
} as const;
