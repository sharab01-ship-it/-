import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton, Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import type { BackupRecord } from '@/types';
import { DatabaseBackup, RotateCcw, Plus, HardDrive } from 'lucide-react';

export default function BackupPage() {
  const { data, isLoading, error, execute } = useAsync<{ backups: BackupRecord[] }>(
    () => api.getBackups(),
    [],
    { immediate: true }
  );
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [restoreTarget, setRestoreTarget] = useState<BackupRecord | null>(null);
  const [restoring, setRestoring] = useState(false);

  const backups = data?.backups || [];

  const handleBackup = async () => {
    setCreating(true);
    setActionError(null);
    try {
      await api.backupDatabase();
      await execute();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setCreating(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreTarget) return;
    setRestoring(true);
    try {
      await api.restoreBackup(restoreTarget.id);
      await execute();
    } catch (e) {
      setActionError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setRestoring(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="النسخ الاحتياطية"
          subtitle="إنشاء واستعادة نسخ احتياطية من قاعدة البيانات"
          action={
            <button onClick={handleBackup} disabled={creating} className="btn-filled">
              {creating ? <Spinner size="sm" /> : <><Plus className="w-5 h-5" /> إنشاء نسخة احتياطية</>}
            </button>
          }
        />

        {actionError && <div className="mb-4"><Alert type="error" message={actionError} onClose={() => setActionError(null)} /></div>}
        {error && !data && <ErrorState message={error} onRetry={execute} />}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {data && backups.length === 0 && (
          <EmptyState
            icon={<DatabaseBackup className="w-8 h-8" />}
            title="لا توجد نسخ احتياطية"
            message="لم يتم إنشاء أي نسخ احتياطية بعد."
            action={<button onClick={handleBackup} disabled={creating} className="btn-filled">{creating ? <Spinner size="sm" /> : <><Plus className="w-5 h-5" /> إنشاء نسخة احتياطية</>}</button>}
          />
        )}

        {data && backups.length > 0 && (
          <div className="space-y-3">
            {backups.map((backup) => (
              <div key={backup.id} className="card flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{backup.fileName}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span>الحجم: {backup.fileSize}</span>
                      <span>الأوراق: {backup.sheetsCount}</span>
                      <span>{new Date(backup.createdAt).toLocaleString('ar-SA')}</span>
                    </div>
                    <p className="text-xs text-neutral-300">أنشأها: {backup.createdBy}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setRestoreTarget(backup)}
                    disabled={restoring}
                    className="btn-tonal"
                  >
                    <RotateCcw className="w-4 h-4" />
                    استعادة
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      <ConfirmDialog
        open={Boolean(restoreTarget)}
        onClose={() => setRestoreTarget(null)}
        onConfirm={handleRestore}
        title="استعادة النسخة الاحتياطية"
        message={`هل أنت متأكد من استعادة النسخة "${restoreTarget?.fileName}"؟ سيتم استبدال البيانات الحالية.`}
        confirmLabel={restoring ? 'جاري الاستعادة...' : 'استعادة'}
      />
    </DashboardLayout>
  );
}
