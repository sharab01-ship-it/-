import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { useAuth } from '@/contexts/AuthContext';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader } from '@/components/ui/ErrorState';
import { CardSkeleton } from '@/components/ui/Spinner';
import { ErrorState } from '@/components/ui/ErrorState';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import type { DashboardStats, ActivityLog, StudentProgressSummary } from '@/types';
import {
  Users,
  UserCog,
  BookOpen,
  Award,
  MessageSquare,
  GraduationCap,
  CalendarDays,
  TrendingUp,
  Clock,
} from 'lucide-react';

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === 'student') {
    return <StudentDashboard />;
  }

  return <AdminSupervisorDashboard />;
}

function AdminSupervisorDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, execute } = useAsync<{ stats: DashboardStats; recentActivity: ActivityLog[] }>(
    () => api.getDashboard(),
    [],
    { immediate: true }
  );

  const stats = data?.stats;
  const recentActivity = data?.recentActivity || [];

  const statCards = [
    { label: 'إجمالي الطلاب', value: stats?.totalStudents ?? 0, icon: Users, color: 'primary' },
    { label: 'طلبات قيد المراجعة', value: stats?.pendingStudents ?? 0, icon: UserCog, color: 'warning' },
    { label: 'طلاب معتمدون', value: stats?.approvedStudents ?? 0, icon: GraduationCap, color: 'success' },
    { label: 'إجمالي الأحاديث', value: stats?.totalHadiths ?? 0, icon: BookOpen, color: 'accent' },
    { label: 'الدورات النشطة', value: stats?.activeCourses ?? 0, icon: CalendarDays, color: 'primary' },
    { label: 'الشهادات المُصدرة', value: stats?.issuedCertificates ?? 0, icon: Award, color: 'secondary' },
  ];

  const colorMap: Record<string, string> = {
    primary: 'bg-primary-50 text-primary-600',
    warning: 'bg-warning-50 text-warning-600',
    success: 'bg-success-50 text-success-500',
    accent: 'bg-accent-50 text-accent-600',
    secondary: 'bg-secondary-50 text-secondary-600',
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="لوحة التحكم" subtitle={`مرحبًا، ${user?.name}`} />

        {error && <ErrorState message={error} onRetry={execute} />}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        )}

        {stats && (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {statCards.map((card) => {
                const Icon = card.icon;
                return (
                  <div key={card.label} className="card-elevated">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-neutral-500 mb-1">{card.label}</p>
                        <p className="text-3xl font-bold text-neutral-800">{card.value}</p>
                      </div>
                      <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${colorMap[card.color]}`}>
                        <Icon className="w-7 h-7" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="card-elevated">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-neutral-800">آخر النشاطات</h3>
                </div>
                {recentActivity.length === 0 ? (
                  <p className="text-sm text-neutral-400 py-8 text-center">لا توجد نشاطات حديثة</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto scrollbar-thin">
                    {recentActivity.slice(0, 10).map((log) => (
                      <div key={log.id} className="flex items-start gap-3 p-3 rounded-xl bg-surface-dim">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${log.result === 'success' ? 'bg-success-400' : 'bg-error-400'}`} />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-neutral-700">{log.action}</p>
                          <p className="text-xs text-neutral-400">
                            {log.userName} — {new Date(log.createdAt).toLocaleString('ar-SA')}
                          </p>
                        </div>
                        <StatusBadge status={log.result === 'success' ? 'active' : 'suspended'} />
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="card-elevated">
                <div className="flex items-center gap-2 mb-4">
                  <Clock className="w-5 h-5 text-accent-500" />
                  <h3 className="font-bold text-neutral-800">إحصائيات سريعة</h3>
                </div>
                <div className="space-y-4">
                  <StatRow label="المشرفون" value={stats.totalSupervisors} />
                  <StatRow label="المديرون" value={stats.totalAdmins} />
                  <StatRow label="طلاب مرفوضون" value={stats.rejectedStudents} />
                  <StatRow label="طلاب موقوفون" value={stats.suspendedStudents} />
                  <StatRow label="إشعارات غير مقروءة" value={stats.unreadNotifications} />
                  <StatRow label="رسائل غير مقروءة" value={stats.unreadMessages} />
                </div>
              </div>
            </div>
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

function StatRow({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 last:border-0">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="font-bold text-neutral-800">{value}</span>
    </div>
  );
}

function StudentDashboard() {
  const { user } = useAuth();
  const { data, isLoading, error, execute } = useAsync<{ summary: StudentProgressSummary }>(
    () => api.getProgressSummary(),
    [],
    { immediate: true }
  );

  const summary = data?.summary;

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="لوحة الطالب" subtitle={`مرحبًا، ${user?.name}`} />

        {error && <ErrorState message={error} onRetry={execute} />}

        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <CardSkeleton />
            <CardSkeleton />
          </div>
        )}

        {summary && (
          <>
            <div className="card-elevated mb-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-6 h-6 text-primary-500" />
                <h3 className="font-bold text-neutral-800 text-lg">تقدمك في البرنامج</h3>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-neutral-600">نسبة الإنجاز الكلية</span>
                  <span className="text-2xl font-bold text-primary-600">{summary.completionPercentage}%</span>
                </div>
                <div className="h-4 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-l from-primary-400 to-primary-600 rounded-full transition-all duration-500"
                    style={{ width: `${summary.completionPercentage}%` }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MiniStat label="الأيام المتبقية" value={summary.daysRemaining} icon={CalendarDays} color="text-accent-600 bg-accent-50" />
                <MiniStat label="أحاديث محفوظة" value={summary.memorizedCount} icon={BookOpen} color="text-primary-600 bg-primary-50" />
                <MiniStat label="أحاديث مُسموعة" value={summary.listenedCount} icon={MessageSquare} color="text-success-500 bg-success-50" />
                <MiniStat label="أحاديث مقروءة" value={summary.readCount} icon={Award} color="text-secondary-600 bg-secondary-50" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ProgressCard label="الحفظ" percentage={summary.memorizePercentage} color="primary" weight="50%" />
              <ProgressCard label="الاستماع" percentage={summary.listenPercentage} color="accent" weight="25%" />
              <ProgressCard label="القراءة" percentage={summary.readPercentage} color="secondary" weight="25%" />
            </div>

            <div className="card-elevated mt-6">
              <h3 className="font-bold text-neutral-800 mb-4">الإنجاز اليومي</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto scrollbar-thin">
                {summary.dailyProgress.map((day) => (
                  <div key={day.day} className="flex items-center gap-3 p-3 rounded-xl bg-surface-dim">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${day.isCompleted ? 'bg-success-100 text-success-600' : 'bg-neutral-100 text-neutral-500'}`}>
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
          </>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}

function MiniStat({ label, value, icon: Icon, color }: { label: string; value: number; icon: typeof Users; color: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6" />
      </div>
      <div>
        <p className="text-xs text-neutral-500">{label}</p>
        <p className="text-xl font-bold text-neutral-800">{value}</p>
      </div>
    </div>
  );
}

function ProgressCard({ label, percentage, color, weight }: { label: string; percentage: number; color: string; weight: string }) {
  const colorMap: Record<string, string> = {
    primary: 'from-primary-400 to-primary-600',
    accent: 'from-accent-400 to-accent-600',
    secondary: 'from-secondary-300 to-secondary-500',
  };
  return (
    <div className="card">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-neutral-700">{label}</span>
        <Badge variant="neutral">الوزن: {weight}</Badge>
      </div>
      <p className="text-3xl font-bold text-neutral-800 mb-2">{percentage}%</p>
      <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
        <div
          className={`h-full bg-gradient-to-l ${colorMap[color]} rounded-full transition-all duration-500`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
