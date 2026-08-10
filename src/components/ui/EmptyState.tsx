import type { ReactNode } from 'react';

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  message?: string;
  action?: ReactNode;
}

export function EmptyState({ icon, title, message, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center text-primary-300 mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-neutral-700 mb-2">{title}</h3>
      {message && <p className="text-sm text-neutral-500 max-w-md mb-4">{message}</p>}
      {action}
    </div>
  );
}
