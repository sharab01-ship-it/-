import { useState } from 'react';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader } from '@/components/ui/ErrorState';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { useAsync } from '@/hooks/useAsync';
import type { Notification } from '@/types';
import { Bell, Send } from 'lucide-react';

export default function NotificationsPage() {
  const { data, isLoading, error, execute } = useAsync<{ notifications: Notification[] }>(
    () => api.getNotifications(),
    [],
    { immediate: true }
  );
  const [targetRole, setTargetRole] = useState<string>('all');
  const [targetUserId, setTargetUserId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSend = async () => {
    if (!title.trim() || !content.trim()) {
      setSendError('يرجى إدخال العنوان والمحتوى.');
      return;
    }
    setSending(true);
    setSendError(null);
    setSuccess(false);
    try {
      await api.sendNotification(
        targetRole as 'all' | 'group' | 'admin' | 'supervisor' | 'student',
        title,
        content,
        targetUserId || undefined
      );
      setTitle('');
      setContent('');
      setTargetUserId('');
      setSuccess(true);
      await execute();
    } catch (e) {
      setSendError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSending(false);
    }
  };

  const notifications = data?.notifications || [];

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="الإشعارات" subtitle="إرسال وإدارة الإشعارات" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Send form */}
          <div className="card-elevated">
            <div className="flex items-center gap-2 mb-4">
              <Send className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-neutral-800">إرسال إشعار جديد</h3>
            </div>

            {sendError && <div className="mb-4"><Alert type="error" message={sendError} /></div>}
            {success && <div className="mb-4"><Alert type="success" message="تم إرسال الإشعار بنجاح." onClose={() => setSuccess(false)} /></div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">المستهدفون</label>
                <select value={targetRole} onChange={(e) => setTargetRole(e.target.value)} className="input-field">
                  <option value="all">الجميع</option>
                  <option value="student">الطلاب</option>
                  <option value="supervisor">المشرفون</option>
                  <option value="admin">المديرون</option>
                  <option value="group">مجموعة محددة</option>
                </select>
              </div>

              {targetRole === 'group' && (
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">معرف المستخدم (اختياري)</label>
                  <input
                    type="text"
                    value={targetUserId}
                    onChange={(e) => setTargetUserId(e.target.value)}
                    className="input-field"
                    placeholder="معرف طالب محدد (اتركه فارغًا للجميع)"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">العنوان</label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="input-field"
                  placeholder="عنوان الإشعار"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">المحتوى</label>
                <textarea
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="input-field resize-none"
                  rows={4}
                  placeholder="نص الإشعار..."
                />
              </div>

              <button onClick={handleSend} disabled={sending} className="btn-filled w-full">
                {sending ? <Spinner size="sm" /> : <><Send className="w-5 h-5" /> إرسال</>}
              </button>
            </div>
          </div>

          {/* Notifications list */}
          <div className="card-elevated">
            <div className="flex items-center gap-2 mb-4">
              <Bell className="w-5 h-5 text-accent-500" />
              <h3 className="font-bold text-neutral-800">الإشعارات المُرسلة</h3>
            </div>

            {isLoading && <div className="flex justify-center py-8"><Spinner /></div>}

            {error && <Alert type="error" message={error} />}

            {!isLoading && notifications.length === 0 && (
              <p className="text-sm text-neutral-400 text-center py-8">لا توجد إشعارات</p>
            )}

            <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin">
              {notifications.map((notif) => (
                <div key={notif.id} className="p-4 rounded-xl bg-surface-dim">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-neutral-800 text-sm">{notif.title}</p>
                    <Badge variant={notif.targetRole === 'all' ? 'primary' : 'neutral'}>
                      {notif.targetRole === 'all' ? 'الجميع' :
                       notif.targetRole === 'student' ? 'الطلاب' :
                       notif.targetRole === 'supervisor' ? 'المشرفون' :
                       notif.targetRole === 'admin' ? 'المديرون' : 'مجموعة'}
                    </Badge>
                  </div>
                  <p className="text-sm text-neutral-600 mb-2">{notif.content}</p>
                  <p className="text-xs text-neutral-400">
                    {notif.senderName} — {new Date(notif.createdAt).toLocaleString('ar-SA')}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
