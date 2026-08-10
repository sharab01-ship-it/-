import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination, useDebounce } from '@/components/ui/Pagination';
import { FormDialog } from '@/components/ui/ConfirmDialog';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import type { Certificate, User } from '@/types';
import { Search, Award, Download, Plus } from 'lucide-react';
import { generateCertificatePdf } from '@/services/certificate';

export default function CertificatesPage() {
  const { data: studentsData } = useAsync<{ students: User[] }>(() => api.getStudents(), [], { immediate: true });
  const { data, isLoading, error, execute } = useAsync<{ certificates: Certificate[] }>(
    () => api.getCertificates(),
    [],
    { immediate: true }
  );
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [issueDialog, setIssueDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');
  const [issueError, setIssueError] = useState<string | null>(null);
  const [issueLoading, setIssueLoading] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filtered = useMemo(() => {
    if (!data?.certificates) return [];
    return data.certificates.filter(
      (c) => !debouncedSearch || c.userName.includes(debouncedSearch) || c.certificateNumber.includes(debouncedSearch)
    );
  }, [data, debouncedSearch]);

  const approvedStudents = studentsData?.students.filter((s) => s.status === 'approved') || [];

  const handleIssue = async () => {
    if (!selectedStudent) {
      setIssueError('يرجى اختيار طالب.');
      return;
    }
    setIssueLoading(true);
    setIssueError(null);
    try {
      const student = approvedStudents.find((s) => s.id === selectedStudent);
      const activeCourse = student?.courseId || 'current';
      await api.issueCertificate(selectedStudent, activeCourse);
      setIssueDialog(false);
      setSelectedStudent('');
      await execute();
    } catch (e) {
      setIssueError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setIssueLoading(false);
    }
  };

  const handleDownload = async (cert: Certificate) => {
    setDownloadingId(cert.id);
    try {
      await generateCertificatePdf({
        studentName: cert.userName,
        certificateNumber: cert.certificateNumber,
        issueDate: cert.issueDate,
        completionPercentage: cert.completionPercentage,
        programName: cert.courseName || 'زاد الحلقات',
      });
    } catch {
      // ignore
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="إدارة الشهادات"
          subtitle="إصدار وتحميل شهادات الطلاب"
          action={
            <button onClick={() => { setIssueDialog(true); setIssueError(null); }} className="btn-filled">
              <Plus className="w-5 h-5" />
              إصدار شهادة
            </button>
          }
        />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث باسم الطالب أو رقم الشهادة..."
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
                icon={<Award className="w-8 h-8" />}
                title="لا توجد شهادات"
                message="لم يتم إصدار أي شهادات بعد."
                action={
                  <button onClick={() => { setIssueDialog(true); setIssueError(null); }} className="btn-filled">
                    <Plus className="w-5 h-5" />
                    إصدار شهادة
                  </button>
                }
              />
            }
            renderItem={(cert) => (
              <div key={cert.id} className="card mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-secondary-50 flex items-center justify-center text-secondary-600">
                    <Award className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{cert.userName}</p>
                    <p className="text-xs text-neutral-400">رقم الشهادة: {cert.certificateNumber}</p>
                    <p className="text-xs text-neutral-400">
                      تاريخ الإصدار: {new Date(cert.issueDate).toLocaleDateString('ar-SA')} — الإنجاز: {cert.completionPercentage}%
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleDownload(cert)}
                  disabled={downloadingId === cert.id}
                  className="btn-tonal"
                >
                  {downloadingId === cert.id ? <Spinner size="sm" /> : <Download className="w-4 h-4" />}
                  تحميل PDF
                </button>
              </div>
            )}
          />
        )}
      </PageContainer>

      <FormDialog
        open={issueDialog}
        onClose={() => { setIssueDialog(false); setSelectedStudent(''); setIssueError(null); }}
        onSubmit={handleIssue}
        title="إصدار شهادة"
        submitLabel={issueLoading ? 'جاري الإصدار...' : 'إصدار'}
      >
        <div>
          <p className="text-sm text-neutral-600 mb-4">اختر الطالب الذي تريد إصدار شهادة له:</p>
          {issueError && <div className="mb-4"><Alert type="error" message={issueError} /></div>}
          <select
            value={selectedStudent}
            onChange={(e) => setSelectedStudent(e.target.value)}
            className="input-field"
          >
            <option value="">-- اختر طالبًا --</option>
            {approvedStudents.map((s) => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          {approvedStudents.length === 0 && (
            <p className="text-sm text-neutral-400 mt-2">لا يوجد طلاب معتمدون حاليًا.</p>
          )}
        </div>
      </FormDialog>
    </DashboardLayout>
  );
}
