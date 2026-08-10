import { useState, useEffect } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { Alert } from '@/components/ui/Alert';
import type { SiteSettings } from '@/types';
import { Settings, Save, Palette, BookOpen } from 'lucide-react';

export default function SettingsPage() {
  const { data, isLoading, error, execute } = useAsync<{ settings: SiteSettings }>(
    () => api.getSettings(),
    [],
    { immediate: true }
  );
  const [form, setForm] = useState<SiteSettings | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    if (data?.settings) {
      setForm(data.settings);
    }
  }, [data]);

  const handleSave = async () => {
    if (!form) return;
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);
    try {
      await api.updateSettings(form);
      setSaveSuccess(true);
      await execute();
    } catch (e) {
      setSaveError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading && !data) {
    return (
      <DashboardLayout>
        <PageContainer>
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        </PageContainer>
      </DashboardLayout>
    );
  }

  if (error && !data) {
    return (
      <DashboardLayout>
        <PageContainer>
          <ErrorState message={error} onRetry={execute} />
        </PageContainer>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="إعدادات النظام" subtitle="إدارة الإعدادات العامة والمظهر" />

        {saveSuccess && <div className="mb-4"><Alert type="success" message="تم حفظ الإعدادات بنجاح." onClose={() => setSaveSuccess(false)} /></div>}
        {saveError && <div className="mb-4"><Alert type="error" message={saveError} onClose={() => setSaveError(null)} /></div>}

        {form && (
          <div className="space-y-6 max-w-3xl">
            {/* General Settings */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Settings className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-neutral-800">الإعدادات العامة</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">اسم الموقع</label>
                  <input
                    type="text"
                    value={form.siteName}
                    onChange={(e) => setForm({ ...form, siteName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">العنوان الفرعي</label>
                  <input
                    type="text"
                    value={form.siteSubtitle}
                    onChange={(e) => setForm({ ...form, siteSubtitle: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">بريد التواصل</label>
                  <input
                    type="email"
                    value={form.contactEmail}
                    onChange={(e) => setForm({ ...form, contactEmail: e.target.value })}
                    className="input-field"
                    dir="ltr"
                  />
                </div>
              </div>
            </div>

            {/* Branding */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-secondary-500" />
                <h3 className="font-bold text-neutral-800">الهوية البصرية</h3>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">رابط الشعار</label>
                  <input
                    type="url"
                    value={form.logoUrl}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    className="input-field"
                    placeholder="https://..."
                    dir="ltr"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">اللون الأساسي</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="w-12 h-12 rounded-lg border border-neutral-200 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={form.primaryColor}
                      onChange={(e) => setForm({ ...form, primaryColor: e.target.value })}
                      className="input-field flex-1"
                      dir="ltr"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Program Settings */}
            <div className="card-elevated">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-accent-500" />
                <h3 className="font-bold text-neutral-800">إعدادات البرنامج</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">اسم البرنامج</label>
                  <input
                    type="text"
                    value={form.programName}
                    onChange={(e) => setForm({ ...form, programName: e.target.value })}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">عدد الأحاديث</label>
                  <input
                    type="number"
                    value={form.totalHadiths}
                    onChange={(e) => setForm({ ...form, totalHadiths: Number(e.target.value) })}
                    className="input-field"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">عدد الأيام</label>
                  <input
                    type="number"
                    value={form.totalDays}
                    onChange={(e) => setForm({ ...form, totalDays: Number(e.target.value) })}
                    className="input-field"
                    min={1}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-2">أحاديث يوميًا</label>
                  <input
                    type="number"
                    value={form.hadithsPerDay}
                    onChange={(e) => setForm({ ...form, hadithsPerDay: Number(e.target.value) })}
                    className="input-field"
                    min={1}
                  />
                </div>
              </div>
            </div>

            <button onClick={handleSave} disabled={saving} className="btn-filled">
              {saving ? <Spinner size="sm" /> : <><Save className="w-5 h-5" /> حفظ الإعدادات</>}
            </button>
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
