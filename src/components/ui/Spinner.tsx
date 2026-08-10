import { Loader2 } from 'lucide-react';

export function Spinner({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <Loader2 className={`${sizes[size]} animate-spin text-primary-500}`} />;
}

export function FullPageSpinner({ message }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
      <Spinner size="lg" />
      {message && <p className="text-neutral-500 text-sm">{message}</p>}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className="card shimmer-bg animate-shimmer rounded-md3 h-32" />
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-14 shimmer-bg animate-shimmer rounded-xl" />
      ))}
    </div>
  );
}
