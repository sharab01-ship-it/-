import { useAsync } from '@/hooks/useAsync';
import { api } from '@/services/api';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { PageContainer, PageHeader, ErrorState } from '@/components/ui/ErrorState';
import { Spinner } from '@/components/ui/Spinner';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/Badge';
import type { FileItem } from '@/types';
import { FolderOpen, FileText, Headphones, FileImage, File } from 'lucide-react';

export default function FilesPage() {
  const { data, isLoading, error, execute } = useAsync<{ files: FileItem[] }>(
    () => api.getFiles(),
    [],
    { immediate: true }
  );

  const files = data?.files || [];

  const folderLabels: Record<string, string> = {
    pdf: 'الكتب PDF',
    audio: 'الصوتيات',
    certificates: 'الشهادات',
    photos: 'صور الطلاب',
    branding: 'الشعارات والهوية',
    documents: 'المستندات',
  };

  const iconForType = (type: string) => {
    switch (type) {
      case 'pdf': return <FileText className="w-5 h-5" />;
      case 'audio': return <Headphones className="w-5 h-5" />;
      case 'image': return <FileImage className="w-5 h-5" />;
      default: return <File className="w-5 h-5" />;
    }
  };

  const grouped = files.reduce((acc, file) => {
    if (!acc[file.folder]) acc[file.folder] = [];
    acc[file.folder].push(file);
    return acc;
  }, {} as Record<string, FileItem[]>);

  return (
    <DashboardLayout>
      <PageContainer>
        <PageHeader title="إدارة الملفات" subtitle="الملفات المخزنة في Google Drive" />

        {error && !data && <ErrorState message={error} onRetry={execute} />}

        {isLoading && <div className="flex justify-center py-12"><Spinner size="lg" /></div>}

        {data && files.length === 0 && (
          <EmptyState
            icon={<FolderOpen className="w-8 h-8" />}
            title="لا توجد ملفات"
            message="لم يتم رفع أي ملفات بعد. يتم تنظيم الملفات في مجلدات: الكتب PDF، الصوتيات، الشهادات، صور الطلاب، الشعارات والهوية، المستندات."
          />
        )}

        {data && files.length > 0 && (
          <div className="space-y-6">
            {Object.entries(grouped).map(([folder, folderFiles]) => (
              <div key={folder}>
                <div className="flex items-center gap-2 mb-3">
                  <FolderOpen className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-neutral-800">{folderLabels[folder] || folder}</h3>
                  <Badge variant="neutral">{folderFiles.length}</Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {folderFiles.map((file) => (
                    <div key={file.id} className="card flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-primary-50 flex items-center justify-center text-primary-500">
                        {iconForType(file.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-neutral-700 truncate">{file.name}</p>
                        <p className="text-xs text-neutral-400">{new Date(file.createdAt).toLocaleDateString('ar-SA')}</p>
                      </div>
                      <a
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 rounded-lg hover:bg-primary-50 text-primary-500 transition-colors"
                      >
                        <FileText className="w-4 h-4" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageContainer>
    </DashboardLayout>
  );
}
