import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-6xl font-bold text-primary-500 mb-4">404</h1>
        <p className="text-xl text-neutral-600 mb-2">الصفحة غير موجودة</p>
        <p className="text-neutral-400 mb-8">عذرًا، لم نتمكن من العثور على الصفحة التي تبحث عنها.</p>
        <Link to="/dashboard" className="btn-filled">
          <Home className="w-5 h-5" />
          العودة للرئيسية
        </Link>
      </div>
    </div>
  );
}
