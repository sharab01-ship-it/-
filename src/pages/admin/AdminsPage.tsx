import { useState } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { FormDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import type { User } from '@/types';
import { Plus, Trash2, Mail, Phone, Shield } from 'lucide-react';

export default function AdminsPage() {
  const { data, isLoading, error, execute } = useAsync<{ users: User[] }>(() => api.getUsers(), [], {
    immediate: true,
  });
  const [addDialog, setAddDialog] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null);
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const admins = data?.users.filter((u) => u.role === 'admin') || [];

  const handleAdd = async () => {
    setFormError(null);
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError('يرجى ملء جميع الحقول المطلوبة.');
      return;
    }
    await api.addAdmin(form.name, form.email, form.phone, form.password);
    setForm({ name: '', email: '', phone: '', password: '' });
    await execute();
  };

  const handleDelete = async () => {
    if (deleteTarget) await api.deleteUser(deleteTarget.id);
    await execute();
  };

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="إدارة المديرين"
          subtitle="إضافة وحذف المديرين — فقط المدير يستطيع إضافة مدير آخر"
          action={
            <button onClick={() => setAddDialog(true)} className="btn-filled">
              <Plus className="w-5 h-5" />
              إضافة مدير
            </button>
          }
        />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        {isLoading && <TableSkeleton rows={3} />}

        {data && admins.length === 0 && (
          <EmptyState
            icon={<Shield className="w-8 h-8" />}
            title="لا يوجد مديرون"
            message="لم يتم إضافة أي مديرين بعد."
            action={<button onClick={() => setAddDialog(true)} className="btn-filled"><Plus className="w-5 h-5" /> إضافة مدير</button>}
          />
        )}

        {data && admins.length > 0 && (
          <div className="space-y-3">
            {admins.map((adm) => (
              <div key={adm.id} className="card flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-primary-50 flex items-center justify-center text-primary-700 font-bold">
                    {adm.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-medium text-neutral-800">{adm.name}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {adm.email}</span>
                      {adm.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {adm.phone}</span>}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setDeleteTarget(adm)}
                  className="p-2 rounded-lg hover:bg-error-50 text-error-500 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </PageContainer>

      <FormDialog
        open={addDialog}
        onClose={() => { setAddDialog(false); setFormError(null); }}
        title="إضافة مدير جديد"
        onSubmit={handleAdd}
      >
        {formError && <Alert type="error" message={formError} />}
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">الاسم الكامل</label>
          <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="الاسم" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">البريد الإلكتروني</label>
          <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input-field" placeholder="example@email.com" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">رقم الهاتف</label>
          <input type="tel" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input-field" placeholder="05xxxxxxxx" dir="ltr" />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">كلمة المرور</label>
          <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input-field" placeholder="••••••••" />
        </div>
      </FormDialog>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="حذف المدير"
        message={`هل أنت متأكد من حذف المدير "${deleteTarget?.name}"؟ لا يمكن التراجع عن هذا الإجراء.`}
        confirmLabel="حذف"
        variant="error"
      />
    </DashboardLayout>
  );
}
