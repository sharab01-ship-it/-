import type { ReactNode } from 'react';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'neutral';
}

const variants = {
  primary: 'chip-primary',
  success: 'chip-success',
  warning: 'chip-warning',
  error: 'chip-error',
  neutral: 'chip-neutral',
};

export function Badge({ children, variant = 'neutral' }: BadgeProps) {
  return <span className={variants[variant]}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'primary' | 'success' | 'warning' | 'error' | 'neutral'; label: string }> = {
    pending: { variant: 'warning', label: 'قيد المراجعة' },
    approved: { variant: 'success', label: 'معتمد' },
    rejected: { variant: 'error', label: 'مرفوض' },
    suspended: { variant: 'error', label: 'موقوف' },
    active: { variant: 'success', label: 'نشط' },
    completed: { variant: 'primary', label: 'مكتمل' },
  };
  const config = map[status] || { variant: 'neutral' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
