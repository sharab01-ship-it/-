import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader } from '@/components/ui/ErrorState';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Badge, StatusBadge } from '@/components/ui/Badge';
import { UserCircle, Mail, Phone, Lock, Save } from 'lucide-react';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSuccess, setProfileSuccess] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || '');
    }
  }, [user]);

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    setProfileError(null);
    setProfileSuccess(false);
    try {
      await api.updateProfile({ name, phone });
      await refreshUser();
      setProfileSuccess(true);
    } catch (e) {
      setProfileError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async () => {
    setPasswordError(null);
    setPasswordSuccess(false);
    if (newPassword !== confirmNewPassword) {
      setPasswordError('كلمتا المرور الجديدتان غير متطابقتين.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
      return;
    }
    setSavingPassword(true);
    try {
      await api.changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      setPasswordSuccess(true);
    } catch (e) {
      setPasswordError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSavingPassword(false);
    }
  };

  const roleLabel = user?.role === 'admin' ? 'مدير عام' : user?.role === 'supervisor' ? 'مشرف' : 'طالب';

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="الملف الشخصي" subtitle="إدارة معلوماتك الشخصية" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
          {/* Profile Info */}
          <div className="card-elevated">
            <div className="flex items-center gap-2 mb-6">
              <UserCircle className="w-5 h-5 text-primary-500" />
              <h3 className="font-bold text-neutral-800">المعلومات الشخصية</h3>
            </div>

            {/* Avatar */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-20 h-20 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-2xl">
                {user?.name?.charAt(0) || 'م'}
              </div>
              <div>
                <p className="font-bold text-neutral-800">{user?.name}</p>
                <p className="text-sm text-neutral-400">{user?.email}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="primary">{roleLabel}</Badge>
                  {user?.status && <StatusBadge status={user.status} />}
                </div>
              </div>
            </div>

            {profileSuccess && <div className="mb-4"><Alert type="success" message="تم تحديث الملف الشخصي بنجاح." onClose={() => setProfileSuccess(false)} /></div>}
            {profileError && <div className="mb-4"><Alert type="error" message={profileError} onClose={() => setProfileError(null)} /></div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">الاسم الكامل</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">البريد الإلكتروني</label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="input-field pr-11 bg-neutral-50 text-neutral-400"
                    dir="ltr"
                  />
                </div>
                <p className="text-xs text-neutral-400 mt-1">لا يمكن تغيير البريد الإلكتروني</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">رقم الهاتف</label>
                <div className="relative">
                  <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="input-field pr-11"
                    dir="ltr"
                  />
                </div>
              </div>
              <button onClick={handleSaveProfile} disabled={savingProfile} className="btn-filled w-full">
                {savingProfile ? <Spinner size="sm" /> : <><Save className="w-5 h-5" /> حفظ التغييرات</>}
              </button>
            </div>
          </div>

          {/* Change Password */}
          <div className="card-elevated">
            <div className="flex items-center gap-2 mb-6">
              <Lock className="w-5 h-5 text-secondary-500" />
              <h3 className="font-bold text-neutral-800">تغيير كلمة المرور</h3>
            </div>

            {passwordSuccess && <div className="mb-4"><Alert type="success" message="تم تغيير كلمة المرور بنجاح." onClose={() => setPasswordSuccess(false)} /></div>}
            {passwordError && <div className="mb-4"><Alert type="error" message={passwordError} onClose={() => setPasswordError(null)} /></div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">كلمة المرور الحالية</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-neutral-700 mb-2">تأكيد كلمة المرور الجديدة</label>
                <input
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  className="input-field"
                  placeholder="••••••••"
                />
              </div>
              <button onClick={handleChangePassword} disabled={savingPassword} className="btn-filled w-full">
                {savingPassword ? <Spinner size="sm" /> : <><Lock className="w-5 h-5" /> تغيير كلمة المرور</>}
              </button>
            </div>
          </div>
        </div>
      </PageContainer>
    </DashboardLayout>
  );
}
