import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton, Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { Hadith } from '@/types';
import { CheckSquare, Check, X } from 'lucide-react';

export default function MemorizePage() {
  const { data: hadithsData, isLoading: hadithsLoading, error: hadithsError, execute: reloadHadiths } = useAsync<{ hadiths: Hadith[] }>(
    () => api.getHadiths(),
    [],
    { immediate: true }
  );
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);

  const hadiths = useMemo(() => hadithsData?.hadiths || [], [hadithsData]);

  const handleToggle = async (hadithId: string) => {
    setTogglingId(hadithId);
    const currentValue = progress[hadithId] || false;
    const newValue = !currentValue;
    setProgress((prev) => ({ ...prev, [hadithId]: newValue }));
    try {
      await api.saveProgress(hadithId, 'memorized', newValue);
    } catch {
      setProgress((prev) => ({ ...prev, [hadithId]: currentValue }));
    } finally {
      setTogglingId(null);
    }
  };

  if (hadithsError && !hadithsData) {
    return (
      <DashboardLayout>
        <PageContainer>
          <ErrorState message={hadithsError} onRetry={reloadHadiths} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (hadithsLoading) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="grid grid-cols-1 gap-4">
            <CardSkeleton />
            <CardSkeleton />
            <CardSkeleton />
          </div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="الحفظ" subtitle="متابعة حفظ الأحاديث — الوزن 50% من الإنجاز" />

        {hadiths.length === 0 ? (
          <EmptyState
            icon={<CheckSquare className="w-8 h-8" />}
            title="لا توجد أحاديث"
            message="لم يتم إضافة أحاديث بعد."
          />
        ) : (
          <div className="space-y-3">
            {hadiths.map((h) => {
              const isMemorized = progress[h.id] || false;
              return (
                <div key={h.id} className={`card transition-all ${isMemorized ? 'border-r-4 border-r-success-400' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary">حديث {h.number}</Badge>
                        <Badge variant="neutral">اليوم {h.day}</Badge>
                        {h.category && <Badge variant="neutral">{h.category}</Badge>}
                        {isMemorized && <Badge variant="success"><Check className="w-3 h-3" /> محفوظ</Badge>}
                      </div>
                      <p className="font-serif text-base text-neutral-800 leading-relaxed mb-2">{h.text}</p>
                      {h.explanation && (
                        <p className="text-sm text-neutral-500 leading-relaxed">{h.explanation}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggle(h.id)}
                      disabled={togglingId === h.id}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isMemorized
                          ? 'bg-success-100 text-success-600 hover:bg-success-200'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                      title={isMemorized ? 'تم الحفظ' : 'تحديد كمحفوظ'}
                    >
                      {togglingId === h.id ? <Spinner size="sm" /> : isMemorized ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
