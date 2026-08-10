import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination, useDebounce } from '@/components/ui/Pagination';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { RegistrationRequest } from '@/types';
import { Search, UserCog, Check, X, Phone, Mail } from 'lucide-react';

export default function RegistrationsPage() {
  const { data, isLoading, error, execute } = useAsync<{ requests: RegistrationRequest[] }>(
    () => api.getRegistrationRequests(),
    [],
    { immediate: true }
  );
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState<RegistrationRequest | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectError, setRejectError] = useState<string | null>(null);
  const [rejectLoading, setRejectLoading] = useState(false);
  const [approvingId, setApprovingId] = useState<string | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    if (!data?.requests) return [];
    return data.requests.filter(
      (r) =>
        !debouncedSearch ||
        r.name.includes(debouncedSearch) ||
        r.email.toLowerCase().includes(debouncedSearch.toLowerCase())
    );
  }, [data, debouncedSearch]);

  const handleApprove = async (id: string) => {
    setApprovingId(id);
    try {
      await api.approveStudent(id);
      await execute();
    } catch {
      // error is shown via re-fetch
    } finally {
      setApprovingId(null);
    }
  };

  const handleReject = async () => {
    if (!rejectTarget) return;
    if (!rejectReason.trim()) {
      setRejectError('يرجى كتابة سبب الرفض.');
      return;
    }
    setRejectLoading(true);
    setRejectError(null);
    try {
      await api.rejectStudent(rejectTarget.id, rejectReason);
      setRejectTarget(null);
      setRejectReason('');
      await execute();
    } catch (err) {
      setRejectError(err instanceof ApiError ? err.message : 'حدث خطأ غير متوقع');
    } finally {
      setRejectLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="طلبات التسجيل" subtitle="مراجعة واعتماد الطلاب الجدد" />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم أو البريد..."
            className="input-field pr-11"
          />
        </div>

        {isLoading && <TableSkeleton rows={5} />}

        {data && (
          <Pagination
            items={filtered}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<UserCog className="w-8 h-8" />}
                title="لا توجد طلبات"
                message="لا توجد طلبات تسجيل جديدة في الوقت الحالي."
              />
            }
            renderItem={(req) => (
              <div key={req.id} className="card mb-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-warning-50 flex items-center justify-center text-warning-500 font-bold">
                      {req.name.charAt(0)}
                    </div>
                    <div>
                      <p className="font-medium text-neutral-800">{req.name}</p>
                      <div className="flex items-center gap-3 text-xs text-neutral-400">
                        <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {req.email}</span>
                        {req.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {req.phone}</span>}
                      </div>
                      <p className="text-xs text-neutral-300 mt-1">{new Date(req.createdAt).toLocaleString('ar-SA')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={req.status} />
                    {req.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleApprove(req.id)}
                          disabled={approvingId === req.id}
                          className="btn-tonal text-success-600 bg-success-50 hover:bg-success-100"
                        >
                          {approvingId === req.id ? <Spinner size="sm" /> : <Check className="w-4 h-4" />}
                          اعتماد
                        </button>
                        <button
                          onClick={() => { setRejectTarget(req); setRejectError(null); }}
                          className="btn-tonal text-error-500 bg-error-50 hover:bg-error-100"
                        >
                          <X className="w-4 h-4" />
                          رفض
                        </button>
                      </>
                    )}
                    {req.status === 'rejected' && req.rejectionReason && (
                      <p className="text-xs text-error-500 max-w-xs">{req.rejectionReason}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </PageContainer>

      <Dialog
        open={Boolean(rejectTarget)}
        onClose={() => { setRejectTarget(null); setRejectReason(''); setRejectError(null); }}
        title="رفض الطالب"
        maxWidth="sm"
      >
        <p className="text-sm text-neutral-600 mb-4">
          سيتم رفض طلب الطالب «{rejectTarget?.name}». يرجى كتابة سبب الرفض.
        </p>
        {rejectError && <div className="mb-4"><Alert type="error" message={rejectError} /></div>}
        <textarea
          value={rejectReason}
          onChange={(e) => setRejectReason(e.target.value)}
          placeholder="سبب الرفض..."
          rows={3}
          className="input-field resize-none"
        />
        <div className="flex gap-3 justify-end mt-4">
          <button onClick={() => { setRejectTarget(null); setRejectReason(''); }} className="btn-text">
            إلغاء
          </button>
          <button onClick={handleReject} disabled={rejectLoading} className="btn-error">
            {rejectLoading ? <Spinner size="sm" /> : 'تأكيد الرفض'}
          </button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
