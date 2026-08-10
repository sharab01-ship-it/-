import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ApiError, isConfigured } from '@/services/api';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Mail, Lock, AlertTriangle } from 'lucide-react';

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);
      setLoading(true);
      try {
        await login(email, password);
        navigate('/dashboard');
      } catch (err) {
        if (err instanceof ApiError) {
          setError(err.message);
        } else {
          setError('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.');
        }
      } finally {
        setLoading(false);
      }
    },
    [email, password, login, navigate]
  );

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-50 opacity-50 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary-50 opacity-30 blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-white shadow-md3-3 mb-4 overflow-hidden">
            <img src="/images/photo_2026-08-03_18-02-01.jpg" alt="شعار زاد الحلقات" className="w-full h-full object-cover" />
          </div>
          <h1 className="text-3xl font-bold text-neutral-800 mb-2">زاد الحلقات</h1>
          <p className="text-neutral-500">منصة حفظ الأحاديث النبوية</p>
        </div>

        {!isConfigured() && (
          <div className="mb-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-100 text-warning-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold mb-1">النظام غير مهيأ</p>
                <p>لم يتم إعداد رابط Google Apps Script. يرجى إضافة VITE_APPS_SCRIPT_URL في ملف البيئة لتفعيل الاتصال بقاعدة البيانات.</p>
              </div>
            </div>
          </div>
        )}

        <div className="card-elevated">
          <h2 className="text-xl font-bold text-neutral-800 mb-6">تسجيل الدخول</h2>

          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">البريد الإلكتروني</label>
              <div className="relative">
                <Mail className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pr-11"
                  placeholder="example@email.com"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pr-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-filled w-full">
              {loading ? <Spinner size="sm" /> : 'تسجيل الدخول'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              ليس لديك حساب؟{' '}
              <Link to="/register" className="text-primary-600 font-semibold hover:text-primary-700">
                إنشاء حساب جديد
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
