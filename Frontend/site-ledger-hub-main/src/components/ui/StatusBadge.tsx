import type { ProjectStatus } from '@/types/project';
import { cn } from '@/lib/utils';

type BadgeVariant = 'success' | 'warning' | 'info' | 'muted' | 'destructive';

// Backend sends uppercase enum values: ACTIVE, COMPLETED, ON_HOLD
const variantMap: Record<string, BadgeVariant> = {
  ACTIVE: 'success',
  COMPLETED: 'info',
  ON_HOLD: 'warning',
  ARCHIVED: 'muted',
  // legacy lowercase fallbacks
  active: 'success',
  completed: 'info',
  'on-hold': 'warning',
  'on_hold': 'warning',
};

const variantStyles: Record<BadgeVariant, string> = {
  success: 'bg-success/10 text-success border-success/20',
  warning: 'bg-warning/10 text-warning border-warning/20',
  info: 'bg-info/10 text-info border-info/20',
  muted: 'bg-muted-foreground/10 text-muted-foreground border-muted-foreground/20',
  destructive: 'bg-destructive/10 text-destructive border-destructive/20',
};

interface StatusBadgeProps {
  status: ProjectStatus | string;
  className?: string;
}

const StatusBadge = ({ status, className }: StatusBadgeProps) => {
  const variant = variantMap[status] || 'muted';
  // Convert ACTIVE -> Active, ON_HOLD -> On Hold
  const label = status.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  return (
    <span
      className={cn(
        'inline-flex px-2.5 py-1 rounded-full text-xs font-semibold uppercase tracking-wide border',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  );
};

export default StatusBadge;
