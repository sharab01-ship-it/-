import { useState, useMemo } from 'react';
import { useAsync } from '@/hooks/useAsync';
import { api, ApiError } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { TableSkeleton } from '@/components/ui/Spinner';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';
import { Pagination, useDebounce } from '@/components/ui/Pagination';
import { FormDialog, ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { Alert } from '@/components/ui/Alert';
import type { Hadith } from '@/types';
import { Search, BookOpen, Plus, Pencil, Trash2, Youtube, Headphones, FileText } from 'lucide-react';

export default function HadithsPage() {
  const { data, isLoading, error, execute } = useAsync<{ hadiths: Hadith[] }>(() => api.getHadiths(), [], {
    immediate: true,
  });
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [editDialog, setEditDialog] = useState<{ open: boolean; hadith: Hadith | null }>({ open: false, hadith: null });
  const [deleteTarget, setDeleteTarget] = useState<Hadith | null>(null);

  const filtered = useMemo(() => {
    if (!data?.hadiths) return [];
    return data.hadiths.filter(
      (h) => !debouncedSearch || h.text.includes(debouncedSearch) || h.category.includes(debouncedSearch)
    );
  }, [data, debouncedSearch]);

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader
          title="إدارة الأحاديث"
          subtitle="إضافة وتعديل وحذف الأحاديث"
          action={
            <button onClick={() => setEditDialog({ open: true, hadith: null })} className="btn-filled">
              <Plus className="w-5 h-5" />
              إضافة حديث
            </button>
          }
        />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        <div className="relative mb-6">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث في الأحاديث..."
            className="input-field pr-11"
          />
        </div>

        {isLoading && <TableSkeleton rows={5} />}

        {data && (
          <Pagination
            items={filtered}
            pageSize={10}
            emptyState={
              <EmptyState
                icon={<BookOpen className="w-8 h-8" />}
                title="لا توجد أحاديث"
                message="لم يتم إضافة أي أحاديث بعد."
                action={
                  <button onClick={() => setEditDialog({ open: true, hadith: null })} className="btn-filled">
                    <Plus className="w-5 h-5" />
                    إضافة حديث
                  </button>
                }
              />
            }
            renderItem={(h) => (
              <div key={h.id} className="card mb-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="primary">حديث {h.number}</Badge>
                      <Badge variant="neutral">اليوم {h.day}</Badge>
                      {h.category && <Badge variant="neutral">{h.category}</Badge>}
                    </div>
                    <p className="font-serif text-base text-neutral-800 leading-relaxed mb-2 line-clamp-2">{h.text}</p>
                    <div className="flex items-center gap-3 text-xs text-neutral-400">
                      {h.youtubeUrl && <span className="flex items-center gap-1"><Youtube className="w-3 h-3" /> يوتيوب</span>}
                      {h.audioUrl && <span className="flex items-center gap-1"><Headphones className="w-3 h-3" /> صوت</span>}
                      {h.pdfUrl && <span className="flex items-center gap-1"><FileText className="w-3 h-3" /> PDF</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <button
                      onClick={() => setEditDialog({ open: true, hadith: h })}
                      className="p-2 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(h)}
                      className="p-2 rounded-lg hover:bg-error-50 text-error-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            )}
          />
        )}
      </PageContainer>

      <HadithEditDialog
        open={editDialog.open}
        hadith={editDialog.hadith}
        onClose={() => setEditDialog({ open: false, hadith: null })}
        onSaved={async () => { await execute(); }}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) await api.deleteHadith(deleteTarget.id);
          await execute();
        }}
        title="حذف الحديث"
        message={`هل أنت متأكد من حذف الحديث رقم ${deleteTarget?.number}؟`}
        confirmLabel="حذف"
        variant="error"
      />
    </DashboardLayout>
  );
}

function HadithEditDialog({
  open,
  hadith,
  onClose,
  onSaved,
}: {
  open: boolean;
  hadith: Hadith | null;
  onClose: () => void;
  onSaved: () => Promise<unknown>;
}) {
  const [form, setForm] = useState<Partial<Hadith>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when dialog opens
  useMemo(() => {
    if (open) {
      setForm(hadith || { number: 1, day: 1, orderInDay: 1, text: '', explanation: '', youtubeUrl: '', audioUrl: '', pdfUrl: '', category: '' });
      setError(null);
    }
  }, [open, hadith]);

  const handleSubmit = async () => {
    setError(null);
    if (!form.text?.trim()) {
      setError('نص الحديث مطلوب.');
      return;
    }
    setLoading(true);
    try {
      if (hadith) {
        await api.updateHadith(hadith.id, form);
      } else {
        await api.addHadith(form);
      }
      await onSaved();
      onClose();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'حدث خطأ غير متوقع');
    } finally {
      setLoading(false);
    }
  };

  return (
    <FormDialog
      open={open}
      onClose={onClose}
      title={hadith ? 'تعديل الحديث' : 'إضافة حديث جديد'}
      onSubmit={handleSubmit}
      submitLabel={loading ? 'جاري الحفظ...' : 'حفظ'}
    >
      {error && <Alert type="error" message={error} />}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">رقم الحديث</label>
          <input
            type="number"
            value={form.number || ''}
            onChange={(e) => setForm({ ...form, number: Number(e.target.value) })}
            className="input-field"
            min={1}
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-neutral-700 mb-2">اليوم</label>
          <input
            type="number"
            value={form.day || ''}
            onChange={(e) => setForm({ ...form, day: Number(e.target.value) })}
            className="input-field"
            min={1}
            max={20}
          />
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">نص الحديث</label>
        <textarea
          value={form.text || ''}
          onChange={(e) => setForm({ ...form, text: e.target.value })}
          className="input-field resize-none"
          rows={3}
          placeholder="نص الحديث الشريف"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">الشرح</label>
        <textarea
          value={form.explanation || ''}
          onChange={(e) => setForm({ ...form, explanation: e.target.value })}
          className="input-field resize-none"
          rows={3}
          placeholder="شرح الحديث"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">التصنيف</label>
        <input
          type="text"
          value={form.category || ''}
          onChange={(e) => setForm({ ...form, category: e.target.value })}
          className="input-field"
          placeholder="مثال: الإيمان، العبادة، الأخلاق"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">رابط يوتيوب</label>
        <input
          type="url"
          value={form.youtubeUrl || ''}
          onChange={(e) => setForm({ ...form, youtubeUrl: e.target.value })}
          className="input-field"
          placeholder="https://youtube.com/watch?v=..."
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">رابط الملف الصوتي</label>
        <input
          type="url"
          value={form.audioUrl || ''}
          onChange={(e) => setForm({ ...form, audioUrl: e.target.value })}
          className="input-field"
          placeholder="https://..."
          dir="ltr"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-neutral-700 mb-2">رابط صفحة PDF</label>
        <input
          type="url"
          value={form.pdfUrl || ''}
          onChange={(e) => setForm({ ...form, pdfUrl: e.target.value })}
          className="input-field"
          placeholder="https://..."
          dir="ltr"
        />
      </div>
    </FormDialog>
  );
}
