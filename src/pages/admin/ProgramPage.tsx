import { useAsync } from '@/hooks/useAsync';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { Dialog } from '@/components/ui/Dialog';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import type { Course } from '@/types';
import { CalendarDays, Plus, CheckCircle2, Play } from 'lucide-react';
import { useState } from 'react';

export default function ProgramPage() {
  const { data, isLoading, error, execute } = useAsync<{ courses: Course[] }>(() => api.getCourses(), [], {
    immediate: true,
  });
  const [newCourseDialog, setNewCourseDialog] = useState(false);
  const [courseName, setCourseName] = useState('');
  const [courseError, setCourseError] = useState<string | null>(null);
  const [courseLoading, setCourseLoading] = useState(false);

  const handleStartCourse = async () => {
    if (!courseName.trim()) {
      setCourseError('يرجى إدخال اسم الدورة.');
      return;
    }
    setCourseLoading(true);
    setCourseError(null);
    try {
      await api.startNewCourse(courseName);
      setCourseName('');
      setNewCourseDialog(false);
      await execute();
    } catch (e) {
      setCourseError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setCourseLoading(false);
    }
  };

  const courses = data?.courses || [];

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="إدارة البرنامج"
          subtitle="برنامج زاد الحلقات — 40 حديثًا في 20 يومًا"
          action={
            <button onClick={() => setNewCourseDialog(true)} className="btn-filled">
              <Plus className="w-5 h-5" />
              بدء دورة جديدة
            </button>
          }
        />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {data && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {courses.map((course) => (
              <div key={course.id} className="card-elevated">
                <div className="flex items-center justify-between mb-3">
                  <div className="w-12 h-12 rounded-2xl bg-primary-50 flex items-center justify-center text-primary-500">
                    <CalendarDays className="w-6 h-6" />
                  </div>
                  {course.isActive ? (
                    <Badge variant="success"><Play className="w-3 h-3" /> نشطة</Badge>
                  ) : (
                    <Badge variant="neutral"><CheckCircle2 className="w-3 h-3" /> منتهية</Badge>
                  )}
                </div>
                <h3 className="font-bold text-neutral-800 mb-2">{course.name}</h3>
                <div className="space-y-1 text-sm text-neutral-500">
                  <p>تاريخ البداية: {new Date(course.startDate).toLocaleDateString('ar-SA')}</p>
                  {course.endDate && <p>تاريخ النهاية: {new Date(course.endDate).toLocaleDateString('ar-SA')}</p>}
                  <p>عدد الأحاديث: {course.totalHadiths}</p>
                  <p>المدة: {course.totalDays} يومًا</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {data && courses.length === 0 && (
          <div className="card text-center py-12">
            <CalendarDays className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
            <p className="text-neutral-500 mb-4">لا توجد دورات بعد. ابدأ دورة جديدة.</p>
          </div>
        )}
      </PageContainer>

      <Dialog
        open={newCourseDialog}
        onClose={() => { setNewCourseDialog(false); setCourseName(''); setCourseError(null); }}
        title="بدء دورة جديدة"
        maxWidth="sm"
      >
        <p className="text-sm text-neutral-600 mb-4">
          سيتم بدء دورة جديدة من برنامج زاد الحلقات. ستكون مدتها 20 يومًا بمعدل حديثين يوميًا.
        </p>
        {courseError && <div className="mb-4"><Alert type="error" message={courseError} /></div>}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">اسم الدورة</label>
          <input
            type="text"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className="input-field"
            placeholder="مثال: دورة رجب 1446هـ"
          />
        </div>
        <div className="flex gap-3 justify-end mt-6">
          <button onClick={() => { setNewCourseDialog(false); setCourseName(''); }} className="btn-text">
            إلغاء
          </button>
          <button onClick={handleStartCourse} disabled={courseLoading} className="btn-filled">
            {courseLoading ? <Spinner size="sm" /> : 'بدء الدورة'}
          </button>
        </div>
      </Dialog>
    </DashboardLayout>
  );
}
