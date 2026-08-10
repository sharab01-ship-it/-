import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { Notification } from '@/types';
import { Bell } from 'lucide-react';

export default function StudentNotificationsPage() {
  const { data, isLoading, error, execute } = useAsync<{ notifications: Notification[] }>(
    () => api.getNotifications(),
    [],
    { immediate: true }
  );

  const notifications = data?.notifications || [];

  if (error && !data) {
    return (
      <DashboardLayout>
        <PageContainer><ErrorState message={error} onRetry={execute} /></PageContainer>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <PageContainer><div className="flex justify-center py-12"><Spinner size="lg" /></div></PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="إشعاراتي" subtitle="الإشعارات الواردة" />

        {notifications.length === 0 ? (
          <EmptyState
            icon={<Bell className="w-8 h-8" />}
            title="لا توجد إشعارات"
            message="لم تستلم أي إشعارات بعد."
          />
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <div key={notif.id} className={`card ${!notif.read ? 'border-r-4 border-r-primary-400' : ''}`}>
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-neutral-800">{notif.title}</p>
                  {!notif.read && <Badge variant="primary">جديد</Badge>}
                </div>
                <p className="text-sm text-neutral-600 mb-2 leading-relaxed">{notif.content}</p>
                <p className="text-xs text-neutral-400">
                  {notif.senderName} — {new Date(notif.createdAt).toLocaleString('ar-SA')}
                </p>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
