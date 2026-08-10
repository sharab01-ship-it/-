import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton, Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { Hadith } from '@/types';
import { Headphones, Check, Youtube, Play, Pause } from 'lucide-react';

export default function ListenPage() {
  const { data, isLoading, error, execute } = useAsync<{ hadiths: Hadith[] }>(() => api.getHadiths(), [], {
    immediate: true,
  });
  const [progress, setProgress] = useState<Record<string, boolean>>({});
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);

  const hadiths = useMemo(() => data?.hadiths || [], [data]);

  const handleToggle = async (hadithId: string) => {
    setTogglingId(hadithId);
    const currentValue = progress[hadithId] || false;
    const newValue = !currentValue;
    setProgress((prev) => ({ ...prev, [hadithId]: newValue }));
    try {
      await api.saveProgress(hadithId, 'listened', newValue);
    } catch {
      setProgress((prev) => ({ ...prev, [hadithId]: currentValue }));
    } finally {
      setTogglingId(null);
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
        <PageContainer>
          <div className="space-y-4"><CardSkeleton /><CardSkeleton /><CardSkeleton /></div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="السماع" subtitle="الاستماع للأحاديث — الوزن 25% من الإنجاز" />

        {hadiths.length === 0 ? (
          <EmptyState icon={<Headphones className="w-8 h-8" />} title="لا توجد أحاديث" message="لم يتم إضافة أحاديث بعد." />
        ) : (
          <div className="space-y-3">
            {hadiths.map((h) => {
              const isListened = progress[h.id] || false;
              return (
                <div key={h.id} className={`card transition-all ${isListened ? 'border-r-4 border-r-accent-400' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="primary">حديث {h.number}</Badge>
                        <Badge variant="neutral">اليوم {h.day}</Badge>
                        {isListened && <Badge variant="success"><Check className="w-3 h-3" /> مُستمع</Badge>}
                      </div>
                      <p className="font-serif text-base text-neutral-800 leading-relaxed mb-3">{h.text}</p>

                      <div className="flex items-center gap-3 flex-wrap">
                        {h.audioUrl && (
                          <button
                            onClick={() => setPlayingId(playingId === h.id ? null : h.id)}
                            className="btn-tonal"
                          >
                            {playingId === h.id ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            {playingId === h.id ? 'إيقاف' : 'استماع'}
                          </button>
                        )}
                        {h.youtubeUrl && (
                          <a href={h.youtubeUrl} target="_blank" rel="noopener noreferrer" className="btn-outlined">
                            <Youtube className="w-4 h-4" />
                            يوتيوب
                          </a>
                        )}
                      </div>

                      {playingId === h.id && h.audioUrl && (
                        <audio controls autoPlay className="w-full mt-3" src={h.audioUrl}>
                          متصفحك لا يدعم تشغيل الصوت.
                        </audio>
                      )}
                    </div>
                    <button
                      onClick={() => handleToggle(h.id)}
                      disabled={togglingId === h.id}
                      className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                        isListened
                          ? 'bg-accent-100 text-accent-600 hover:bg-accent-200'
                          : 'bg-neutral-100 text-neutral-400 hover:bg-neutral-200'
                      }`}
                      title={isListened ? 'تم الاستماع' : 'تحديد كمُستمع'}
                    >
                      {togglingId === h.id ? <Spinner size="sm" /> : isListened ? <Check className="w-6 h-6" /> : <Headphones className="w-6 h-6" />}
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
