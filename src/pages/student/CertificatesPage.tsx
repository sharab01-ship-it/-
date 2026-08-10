import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { generateCertificatePdf } from '@/services/certificate';
import type { Certificate } from '@/types';
import { Award, Download } from 'lucide-react';

export default function StudentCertificatesPage() {
  const { data, isLoading, error, execute } = useAsync<{ certificates: Certificate[] }>(
    () => api.getCertificates(),
    [],
    { immediate: true }
  );
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const certificates = data?.certificates || [];

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
        <PageHeader title="شهاداتي" subtitle="شهادات إتمام البرنامج" />

        {certificates.length === 0 ? (
          <EmptyState
            icon={<Award className="w-8 h-8" />}
            title="لا توجد شهادات"
            message="لم يتم إصدار أي شهادات لك بعد. أكمل البرنامج للحصول على شهادة إتمام."
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {certificates.map((cert) => (
              <div key={cert.id} className="card-elevated">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-14 h-14 rounded-2xl bg-secondary-50 flex items-center justify-center text-secondary-600">
                    <Award className="w-7 h-7" />
                  </div>
                  <div>
                    <p className="font-bold text-neutral-800">{cert.courseName || 'زاد الحلقات'}</p>
                    <p className="text-xs text-neutral-400">رقم: {cert.certificateNumber}</p>
                  </div>
                </div>
                <div className="space-y-1 text-sm text-neutral-500 mb-4">
                  <p>تاريخ الإصدار: {new Date(cert.issueDate).toLocaleDateString('ar-SA')}</p>
                  <p>نسبة الإنجاز: <span className="font-bold text-primary-600">{cert.completionPercentage}%</span></p>
                </div>
                <button
                  onClick={() => handleDownload(cert)}
                  disabled={downloadingId === cert.id}
                  className="btn-filled w-full"
                >
                  {downloadingId === cert.id ? <Spinner size="sm" /> : <><Download className="w-5 h-5" /> تحميل الشهادة PDF</>}
                </button>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
