import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import type { StudentProgressSummary } from '@/types';
import { GraduationCap, CheckSquare, Headphones, FileText, CalendarDays } from 'lucide-react';

export default function ProgressPage() {
  const { data, isLoading, error, execute } = useAsync<{ summary: StudentProgressSummary }>(
    () => api.getProgressSummary(),
    [],
    { immediate: true }
  );

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

  const summary = data?.summary;

  if (!summary) {
    return (
      <DashboardLayout>
        <PageContainer>
          <p className="text-neutral-500 text-center py-8">لا توجد بيانات إنجاز.</p>
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="الإنجاز" subtitle="متابعة تقدمك في برنامج زاد الحلقات" />

        {/* Overall Progress */}
        <div className="card-elevated mb-6">
          <div className="flex items-center gap-2 mb-4">
            <GraduationCap className="w-6 h-6 text-primary-500" />
            <h3 className="font-bold text-neutral-800 text-lg">نسبة الإنجاز الكلية</h3>
          </div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-neutral-600">التقدم</span>
            <span className="text-3xl font-bold text-primary-600">{summary.completionPercentage}%</span>
          </div>
          <div className="h-6 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-gradient-to-l from-primary-400 to-primary-600 rounded-full transition-all duration-500"
              style={{ width: `${summary.completionPercentage}%` }}
            />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
            <StatBox label="إجمالي الأحاديث" value={summary.totalHadiths} icon={<GraduationCap className="w-5 h-5" />} color="text-primary-600 bg-primary-50" />
            <StatBox label="محفوظة" value={summary.memorizedCount} icon={<CheckSquare className="w-5 h-5" />} color="text-success-500 bg-success-50" />
            <StatBox label="مُسموعة" value={summary.listenedCount} icon={<Headphones className="w-5 h-5" />} color="text-accent-600 bg-accent-50" />
            <StatBox label="مقروءة" value={summary.readCount} icon={<FileText className="w-5 h-5" />} color="text-secondary-600 bg-secondary-50" />
          </div>
        </div>

        {/* Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <ProgressCard label="الحفظ" percentage={summary.memorizePercentage} weight="50%" color="from-primary-400 to-primary-600" />
          <ProgressCard label="الاستماع" percentage={summary.listenPercentage} weight="25%" color="from-accent-400 to-accent-600" />
          <ProgressCard label="القراءة" percentage={summary.readPercentage} weight="25%" color="from-secondary-300 to-secondary-500" />
        </div>

        {/* Day Progress */}
        <div className="card-elevated mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-accent-500" />
              <h3 className="font-bold text-neutral-800">الإنجاز اليومي</h3>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="primary">اليوم {summary.currentDay}</Badge>
              <Badge variant="neutral">متبقي {summary.daysRemaining} يوم</Badge>
            </div>
          </div>
          <div className="space-y-2 max-h-96 overflow-y-auto scrollbar-thin">
            {summary.dailyProgress.map((day) => (
              <div key={day.day} className="flex items-center gap-3 p-3 rounded-xl bg-surface-dim">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                  day.isCompleted ? 'bg-success-100 text-success-600' :
                  day.day === summary.currentDay ? 'bg-primary-100 text-primary-700' :
                  'bg-neutral-100 text-neutral-500'
                }`}>
                  {day.day}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-neutral-700">اليوم {day.day}</p>
                  <p className="text-xs text-neutral-400">{new Date(day.date).toLocaleDateString('ar-SA')}</p>
                </div>
                <Badge variant={day.isCompleted ? 'success' : 'neutral'}>
                  {day.hadithsCompleted}/{day.totalHadiths}
                </Badge>
              </div>
            ))}
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="card-elevated">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="w-5 h-5 text-secondary-500" />
            <h3 className="font-bold text-neutral-800">الإنجاز الشهري</h3>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 20 }).map((_, i) => {
              const day = summary.dailyProgress[i];
              const completed = day?.isCompleted || false;
              return (
                <div
                  key={i}
                  className={`aspect-square rounded-lg flex items-center justify-center text-xs font-bold ${
                    completed ? 'bg-success-100 text-success-600' :
                    day && day.day === summary.currentDay ? 'bg-primary-100 text-primary-700 border-2 border-primary-300' :
                    day ? 'bg-neutral-100 text-neutral-400' :
                    'bg-neutral-50 text-neutral-300'
                  }`}
                >
                  {i + 1}
                </div>
              );
            })}
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}

function StatBox({ label, value, icon, color }: { label: string; value: number; icon: React.ReactNode; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-lg font-bold text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

function ProgressCard({ label, percentage, weight, color }: { label: string; percentage: number; weight: string; color: string }) {
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-neutral-700">{label}</span>
        <Badge variant="neutral">الوزن: {weight}</Badge>
      </div>
      <p className="text-2xl font-bold text-neutral-800 mb-2">{percentage}%</p>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div className={`h-full bg-gradient-to-l ${color} rounded-full transition-all duration-500`} style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}
