import { cn } from '@/lib/utils';

interface SkeletonCardProps {
  className?: string;
}

const SkeletonCard = ({ className }: SkeletonCardProps) => (
  <div className={cn('bg-card border border-border rounded-lg p-6 animate-pulse', className)}>
    <div className="h-4 bg-muted rounded w-2/3 mb-4" />
    <div className="h-3 bg-muted rounded w-full mb-2" />
    <div className="h-3 bg-muted rounded w-4/5 mb-4" />
    <div className="flex gap-2">
      <div className="h-6 bg-muted rounded-full w-16" />
      <div className="h-6 bg-muted rounded-full w-20" />
    </div>
  </div>
);

export const SkeletonTable = () => (
  <div className="bg-card border border-border rounded-lg animate-pulse">
    <div className="h-12 bg-surface-elevated border-b border-border" />
    {Array.from({ length: 5 }).map((_, i) => (
      <div key={i} className="h-14 border-b border-border px-4 flex items-center gap-4">
        <div className="h-3 bg-muted rounded w-24" />
        <div className="h-3 bg-muted rounded w-32" />
        <div className="h-3 bg-muted rounded w-20" />
        <div className="h-3 bg-muted rounded w-16 ml-auto" />
      </div>
    ))}
  </div>
);

export default SkeletonCard;
