import type { ReactNode } from 'react';
import { AlertCircle } from 'lucide-react';
import { Alert } from './Alert';

interface ErrorBoundaryStateProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: ErrorBoundaryStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-error-50 flex items-center justify-center text-error-400 mb-4">
        <AlertCircle className="w-8 h-8" />
      </div>
      <Alert type="error" message={message} />
      {onRetry && (
        <button onClick={onRetry} className="btn-tonal mt-4">
          إعادة المحاولة
        </button>
      )}
    </div>
  );
}

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">{children}</div>;
}

export function PageHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      <div>
        <h1 className="text-2xl font-bold text-neutral-800">{title}</h1>
        {subtitle && <p className="text-sm text-neutral-500 mt-1">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}
