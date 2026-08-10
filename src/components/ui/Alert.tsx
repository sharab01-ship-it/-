import type { ReactNode } from 'react';
import { AlertCircle, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

type AlertType = 'success' | 'error' | 'warning' | 'info';

interface AlertProps {
  type: AlertType;
  message: string;
  onClose?: () => void;
}

const config: Record<AlertType, { bg: string; text: string; icon: ReactNode; border: string }> = {
  success: {
    bg: 'bg-success-50',
    text: 'text-success-600',
    border: 'border-success-100',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-error-50',
    text: 'text-error-600',
    border: 'border-error-100',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-warning-50',
    text: 'text-warning-600',
    border: 'border-warning-100',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  info: {
    bg: 'bg-accent-50',
    text: 'text-accent-600',
    border: 'border-accent-100',
    icon: <Info className="w-5 h-5" />,
  },
};

export function Alert({ type, message, onClose }: AlertProps) {
  const c = config[type];
  return (
    <div
      className={`flex items-start gap-3 p-4 rounded-xl border ${c.bg} ${c.border} ${c.text} animate-slide-up`}
    >
      <div className="flex-shrink-0 mt-0.5">{c.icon}</div>
      <p className="flex-1 text-sm font-medium leading-relaxed">{message}</p>
      {onClose && (
        <button onClick={onClose} className="flex-shrink-0 hover:opacity-70 transition-opacity">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
