/**
 * Real Estate CRM — Design System Shared Components
 * Issue #7 — UX Design System
 *
 * Re-exports the core UI primitives from the shared component library so that
 * feature modules can import from a single canonical path:
 *
 *   import { Button, Card, Badge, Input, Table } from '@/design-system/components'
 */

// Primitives already living in the ui/ library
export { Button }        from '../../../components/ui/Button';
export { Input }         from '../../../components/ui/Input';
export { DataTable as Table } from '../../../components/ui/DataTable';
export { StatsCard }     from '../../../components/ui/StatsCard';
export { LoadingSpinner } from '../../../components/ui/LoadingSpinner';
export { Skeleton }      from '../../../components/ui/Skeleton';
export { SearchBar }     from '../../../components/ui/SearchBar';
export { Select }        from '../../../components/ui/Select';
export { Textarea }      from '../../../components/ui/Textarea';
export { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
export { ErrorBoundary } from '../../../components/ui/ErrorBoundary';

// ---------------------------------------------------------------------------
// Card — lightweight wrapper (defined here so the design system owns it)
// ---------------------------------------------------------------------------
import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  shadow?: 'none' | 'sm' | 'md' | 'lg';
  border?: boolean;
}

export function Card({
  children,
  className = '',
  padding = 'md',
  shadow = 'sm',
  border = true,
}: CardProps): React.ReactElement {
  const padMap = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-8' } as const;
  const shadowMap = { none: '', sm: 'shadow-sm', md: 'shadow-md', lg: 'shadow-lg' } as const;
  const cls = [
    'rounded-xl bg-white dark:bg-neutral-800',
    padMap[padding],
    shadowMap[shadow],
    border ? 'border border-neutral-200 dark:border-neutral-700' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return React.createElement('div', { className: cls }, children);
}

// ---------------------------------------------------------------------------
// Badge — status / label chip
// ---------------------------------------------------------------------------
export type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'neutral';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const badgeVariantClasses: Record<BadgeVariant, string> = {
  primary:   'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300',
  secondary: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
  success:   'bg-green-100  text-green-700  dark:bg-green-900  dark:text-green-300',
  warning:   'bg-amber-100  text-amber-700  dark:bg-amber-900  dark:text-amber-300',
  error:     'bg-red-100    text-red-700    dark:bg-red-900    dark:text-red-300',
  neutral:   'bg-slate-100  text-slate-700  dark:bg-slate-800  dark:text-slate-300',
};

export function Badge({
  children,
  variant = 'neutral',
  className = '',
}: BadgeProps): React.ReactElement {
  const cls = [
    'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
    badgeVariantClasses[variant],
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return React.createElement('span', { className: cls }, children);
}
