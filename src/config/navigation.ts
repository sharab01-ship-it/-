import type { UserRole } from '@/types';
import {
  LayoutDashboard,
  Users,
  UserCog,
  BookOpen,
  Settings,
  Award,
  Bell,
  MessageSquare,
  FolderOpen,
  DatabaseBackup,
  ScrollText,
  GraduationCap,
  CheckSquare,
  Headphones,
  FileText,
  CalendarDays,
  UserCircle,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

export interface NavItem {
  label: string;
  path: string;
  icon: LucideIcon;
  roles: UserRole[];
}

export const navItems: NavItem[] = [
  // Admin items
  { label: 'لوحة التحكم', path: '/dashboard', icon: LayoutDashboard, roles: ['admin', 'supervisor', 'student'] },

  // Admin & Supervisor shared
  { label: 'الطلاب', path: '/admin/students', icon: Users, roles: ['admin', 'supervisor'] },
  { label: 'طلبات التسجيل', path: '/admin/registrations', icon: UserCog, roles: ['admin', 'supervisor'] },
  { label: 'الأحاديث', path: '/admin/hadiths', icon: BookOpen, roles: ['admin', 'supervisor'] },
  { label: 'البرنامج', path: '/admin/program', icon: CalendarDays, roles: ['admin', 'supervisor'] },
  { label: 'الشهادات', path: '/admin/certificates', icon: Award, roles: ['admin', 'supervisor'] },
  { label: 'الرسائل', path: '/admin/messages', icon: MessageSquare, roles: ['admin', 'supervisor'] },
  { label: 'الإشعارات', path: '/admin/notifications', icon: Bell, roles: ['admin', 'supervisor'] },

  // Admin only
  { label: 'المشرفون', path: '/admin/supervisors', icon: UserCog, roles: ['admin'] },
  { label: 'المديرون', path: '/admin/admins', icon: Users, roles: ['admin'] },
  { label: 'سجل العمليات', path: '/admin/logs', icon: ScrollText, roles: ['admin'] },
  { label: 'النسخ الاحتياطية', path: '/admin/backup', icon: DatabaseBackup, roles: ['admin'] },
  { label: 'إدارة الملفات', path: '/admin/files', icon: FolderOpen, roles: ['admin'] },
  { label: 'الإعدادات', path: '/admin/settings', icon: Settings, roles: ['admin'] },

  // Student items
  { label: 'الحفظ', path: '/student/memorize', icon: CheckSquare, roles: ['student'] },
  { label: 'السماع', path: '/student/listen', icon: Headphones, roles: ['student'] },
  { label: 'القراءة', path: '/student/read', icon: FileText, roles: ['student'] },
  { label: 'المقرر اليومي', path: '/student/daily', icon: CalendarDays, roles: ['student'] },
  { label: 'الإنجاز', path: '/student/progress', icon: GraduationCap, roles: ['student'] },
  { label: 'شهاداتي', path: '/student/certificates', icon: Award, roles: ['student'] },
  { label: 'مراسلتنا', path: '/student/messages', icon: MessageSquare, roles: ['student'] },
  { label: 'إشعاراتي', path: '/student/notifications', icon: Bell, roles: ['student'] },

  // Shared
  { label: 'الملف الشخصي', path: '/profile', icon: UserCircle, roles: ['admin', 'supervisor', 'student'] },
];
