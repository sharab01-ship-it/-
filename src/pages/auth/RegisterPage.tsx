import { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, ApiError, isConfigured } from '@/services/api';
import { Alert } from '@/components/ui/Alert';
import { Spinner } from '@/components/ui/Spinner';
import { Mail, Lock, User, Phone, AlertTriangle, CheckCircle2 } from 'lucide-react';

export function RegisterPage() {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setError(null);

      if (password !== confirmPassword) {
        setError('كلمتا المرور غير متطابقتين.');
        return;
      }
      if (password.length < 6) {
        setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل.');
        return;
      }

      setLoading(true);
      try {
        await api.register(name, email, phone, password);
        setSuccess(true);
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
    [name, email, phone, password, confirmPassword]
  );

  if (success) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-4">
        <div className="w-full max-w-md text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-success-50 mb-4">
            <CheckCircle2 className="w-12 h-12 text-success-500" />
          </div>
          <h1 className="text-2xl font-bold text-neutral-800 mb-3">تم إرسال طلبك بنجاح</h1>
          <p className="text-neutral-500 mb-8 leading-relaxed">
            تم تسجيل طلبك بحالة «قيد المراجعة». سيتمكن فريق الإشراف من مراجعة طلبك واعتماده.
            ستتمكن من تسجيل الدخول بعد الاعتماد.
          </p>
          <button onClick={() => navigate('/login')} className="btn-filled">
            العودة لتسجيل الدخول
          </button>
        </div>
      </div>
    );
  }

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
          <p className="text-neutral-500">إنشاء حساب طالب جديد</p>
        </div>

        {!isConfigured() && (
          <div className="mb-6">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-warning-50 border border-warning-100 text-warning-600">
              <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-bold mb-1">النظام غير مهيأ</p>
                <p>لم يتم إعداد رابط Google Apps Script. يرجى إضافة VITE_APPS_SCRIPT_URL في ملف البيئة.</p>
              </div>
            </div>
          </div>
        )}

        <div className="card-elevated">
          {error && <div className="mb-4"><Alert type="error" message={error} onClose={() => setError(null)} /></div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">الاسم الكامل</label>
              <div className="relative">
                <User className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pr-11"
                  placeholder="الاسم الكامل"
                />
              </div>
            </div>

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
              <label className="block text-sm font-medium text-neutral-700 mb-2">رقم الهاتف</label>
              <div className="relative">
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pr-11"
                  placeholder="05xxxxxxxx"
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

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">تأكيد كلمة المرور</label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  disabled={loading}
                  className="input-field pr-11"
                  placeholder="••••••••"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn-filled w-full">
              {loading ? <Spinner size="sm" /> : 'إنشاء الحساب'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-neutral-500">
              لديك حساب بالفعل؟{' '}
              <Link to="/login" className="text-primary-600 font-semibold hover:text-primary-700">
                تسجيل الدخول
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
