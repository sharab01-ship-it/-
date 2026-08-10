import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { DailyLesson } from '@/types';
import { CalendarDays, CheckCircle2, Lock, BookOpen } from 'lucide-react';

export default function DailyLessonPage() {
  const { data, isLoading, error, execute } = useAsync<{
    lessons: DailyLesson[];
    currentDay: number;
    course: { id: string; name: string; startDate: string; totalDays: number };
  }>(() => api.getDailyLessons(), [], { immediate: true });

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

  const lessons = data?.lessons || [];
  const currentDay = data?.currentDay || 1;
  const course = data?.course;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="المقرر اليومي" subtitle={course ? `دورة: ${course.name}` : 'حديثان يوميًا لمدة 20 يومًا'} />

        {course && (
          <div className="card-elevated mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500">
                <CalendarDays className="w-7 h-7" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-neutral-800">{course.name}</p>
                <p className="text-sm text-neutral-500">
                  بدأت في: {new Date(course.startDate).toLocaleDateString('ar-SA')} — اليوم الحالي: {currentDay} من {course.totalDays}
                </p>
              </div>
              <Badge variant="primary">اليوم {currentDay}</Badge>
            </div>
          </div>
        )}

        {lessons.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="w-8 h-8" />}
            title="لا توجد دروس"
            message="لم يتم تفعيل أي دورة بعد. يرجى التواصل مع المشرف."
          />
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const isLocked = lesson.day > currentDay;
              const isCompleted = lesson.isCompleted;
              const isCurrent = lesson.isCurrent;

              return (
                <div
                  key={lesson.day}
                  className={`card transition-all ${
                    isCurrent ? 'border-2 border-primary-400 shadow-md3-2' : isLocked ? 'opacity-50' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                        isCompleted ? 'bg-success-100 text-success-600' :
                        isCurrent ? 'bg-primary-100 text-primary-700' :
                        isLocked ? 'bg-neutral-100 text-neutral-400' :
                        'bg-neutral-100 text-neutral-500'
                      }`}>
                        {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : isLocked ? <Lock className="w-5 h-5" /> : lesson.day}
                      </div>
                      <div>
                        <p className="font-bold text-neutral-800">اليوم {lesson.day}</p>
                        <p className="text-xs text-neutral-400">{new Date(lesson.date).toLocaleDateString('ar-SA')}</p>
                      </div>
                    </div>
                    {isCurrent && <Badge variant="primary">اليوم الحالي</Badge>}
                    {isCompleted && <Badge variant="success">مكتمل</Badge>}
                  </div>

                  {!isLocked && lesson.hadiths.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {lesson.hadiths.map((h) => (
                        <div key={h.id} className="p-3 rounded-xl bg-surface-dim">
                          <div className="flex items-center gap-2 mb-1">
                            <BookOpen className="w-4 h-4 text-primary-400" />
                            <Badge variant="neutral">حديث {h.number}</Badge>
                            {h.category && <Badge variant="neutral">{h.category}</Badge>}
                          </div>
                          <p className="font-serif text-sm text-neutral-700 leading-relaxed">{h.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
