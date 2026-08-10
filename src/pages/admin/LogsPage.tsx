import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import type { ActivityLog } from '@/types';
import { ScrollText, CheckCircle2, XCircle } from 'lucide-react';

export default function LogsPage() {
  const { data, isLoading, error, execute } = useAsync<{ logs: ActivityLog[] }>(
    () => api.getActivityLog(),
    [],
    { immediate: true }
  );

  const logs = data?.logs || [];

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="سجل العمليات" subtitle="سجل جميع العمليات الحساسة في النظام" />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        {isLoading && <TableSkeleton rows={8} />}

        {data && logs.length === 0 && (
          <EmptyState
            icon={<ScrollText className="w-8 h-8" />}
            title="لا توجد سجلات"
            message="لم يتم تسجيل أي عمليات بعد."
          />
        )}

        {data && logs.length > 0 && (
          <Pagination
            items={logs}
            pageSize={15}
            emptyState={<EmptyState icon={<ScrollText className="w-8 h-8" />} title="لا توجد سجلات" />}
            renderItem={(log) => (
              <div key={log.id} className="card mb-2 flex items-start gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                  log.result === 'success' ? 'bg-success-50 text-success-500' : 'bg-error-50 text-error-500'
                }`}>
                  {log.result === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant={log.result === 'success' ? 'success' : 'error'}>{log.actionType}</Badge>
                    <span className="text-xs text-neutral-400">{new Date(log.createdAt).toLocaleString('ar-SA')}</span>
                  </div>
                  <p className="text-sm font-medium text-neutral-700">{log.action}</p>
                  <p className="text-xs text-neutral-400">المستخدم: {log.userName}</p>
                  {log.errorDetails && <p className="text-xs text-error-400 mt-1">الخطأ: {log.errorDetails}</p>}
                </div>
              </div>
            )}
          />
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
