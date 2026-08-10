import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Spinner';
import { StatusBadge } from '@/components/ui/Badge';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination, useDebounce } from '@/components/ui/Pagination';
import type { User } from '@/types';
import { Search, Users, Pause, Play, Trash2, Phone, Mail } from 'lucide-react';

export default function StudentsPage() {
  const { data, isLoading, error, execute } = useAsync<{ students: User[] }>(() => api.getStudents(), [], {
    immediate: true,
  });
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionTarget, setActionTarget] = useState<{ user: User; type: 'suspend' | 'unsuspend' | 'delete' } | null>(null);

  const debouncedSearch = useDebounce(search, 300);

  const filtered = useMemo(() => {
    if (!data?.students) return [];
    return data.students.filter((s) => {
      const matchesSearch =
        !debouncedSearch ||
        s.name.includes(debouncedSearch) ||
        s.email.toLowerCase().includes(debouncedSearch.toLowerCase());
      const matchesStatus = statusFilter === 'all' || s.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [data, debouncedSearch, statusFilter]);

  const handleAction = async () => {
    if (!actionTarget) return;
    if (actionTarget.type === 'suspend') await api.suspendStudent(actionTarget.user.id);
    if (actionTarget.type === 'unsuspend') await api.unsuspendStudent(actionTarget.user.id);
    if (actionTarget.type === 'delete') await api.deleteUser(actionTarget.user.id);
    await execute();
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="إدارة الطلاب" subtitle="عرض وإدارة جميع الطلاب المسجلين" />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="بحث بالاسم أو البريد..."
              className="input-field pr-11"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input-field sm:w-48"
          >
            <option value="all">كل الحالات</option>
            <option value="approved">معتمد</option>
            <option value="pending">قيد المراجعة</option>
            <option value="rejected">مرفوض</option>
            <option value="suspended">موقوف</option>
          </select>
        </div>

        {isLoading && <TableSkeleton rows={5} />}

        {data && (
          <Pagination
            items={filtered}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<Users className="w-8 h-8" />}
                title="لا يوجد طلاب"
                message="لم يتم العثور على طلاب مطابقين للبحث."
              />
            }
            renderItem={(student) => (
              <div key={student.id} className="card mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold">
                    {student.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{student.name}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {student.email}</span>
                      {student.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {student.phone}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={student.status} />
                  {student.status === 'approved' && (
                    <button
                      onClick={() => setActionTarget({ user: student, type: 'suspend' })}
                      className="p-2 rounded-lg hover:bg-warning-50 text-warning-500 transition-colors"
                      title="إيقاف"
                    >
                      <Pause className="w-4 h-4" />
                    </button>
                  )}
                  {student.status === 'suspended' && (
                    <button
                      onClick={() => setActionTarget({ user: student, type: 'unsuspend' })}
                      className="p-2 rounded-lg hover:bg-success-50 text-success-500 transition-colors"
                      title="تفعيل"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => setActionTarget({ user: student, type: 'delete' })}
                    className="p-2 rounded-lg hover:bg-error-50 text-error-500 transition-colors"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          />
        )}
      </PageContainer>

      <ConfirmDialog
        open={Boolean(actionTarget)}
        onClose={() => setActionTarget(null)}
        onConfirm={handleAction}
        title={
          actionTarget?.type === 'delete' ? 'حذف الطالب' :
          actionTarget?.type === 'suspend' ? 'إيقاف الطالب' :
          'تفعيل الطالب'
        }
        message={
          actionTarget?.type === 'delete'
            ? `هل أنت متأكد من حذف الطالب "${actionTarget?.user.name}"؟ لا يمكن التراجع عن هذا الإجراء.`
            : actionTarget?.type === 'suspend'
            ? `سيتم إيقاف الطالب "${actionTarget?.user.name}". لن يتمكن من تسجيل الدخول.`
            : `سيتم تفعيل الطالب "${actionTarget?.user.name}".`
        }
        confirmLabel={actionTarget?.type === 'delete' ? 'حذف' : actionTarget?.type === 'suspend' ? 'إيقاف' : 'تفعيل'}
        variant={actionTarget?.type === 'delete' ? 'error' : 'default'}
      />
    </DashboardLayout>
  );
}
