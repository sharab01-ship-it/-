export type UserRole = 'admin' | 'supervisor' | 'student';

export type StudentStatus = 'pending' | 'approved' | 'rejected' | 'suspended';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  status: StudentStatus;
  rejectionReason?: string;
  approvedDate?: string;
  courseId?: string;
  startDate?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Session {
  token: string;
  userId: string;
  role: UserRole;
  name: string;
  email: string;
  expiresAt: number;
}

export interface Hadith {
  id: string;
  number: number;
  text: string;
  explanation: string;
  youtubeUrl: string;
  audioUrl: string;
  pdfUrl: string;
  category: string;
  day: number;
  orderInDay: number;
}

export interface Progress {
  id: string;
  userId: string;
  hadithId: string;
  courseId: string;
  memorized: boolean;
  listened: boolean;
  read: boolean;
  completedDate?: string;
  updatedAt: string;
}

export interface Course {
  id: string;
  name: string;
  startDate: string;
  endDate?: string;
  isActive: boolean;
  totalHadiths: number;
  totalDays: number;
  createdAt: string;
}

export interface Certificate {
  id: string;
  certificateNumber: string;
  userId: string;
  userName: string;
  courseId: string;
  courseName: string;
  completionPercentage: number;
  issueDate: string;
  qrCode: string;
}

export interface Message {
  id: string;
  senderId: string;
  senderName: string;
  receiverId: string;
  receiverName: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface Notification {
  id: string;
  senderId: string;
  senderName: string;
  targetRole: UserRole | 'all' | 'group';
  targetUserId?: string;
  title: string;
  content: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  actionType: string;
  action: string;
  result: 'success' | 'failure';
  details?: string;
  errorDetails?: string;
  createdAt: string;
}

export interface SiteSettings {
  siteName: string;
  siteSubtitle: string;
  logoUrl: string;
  primaryColor: string;
  contactEmail: string;
  programName: string;
  totalHadiths: number;
  totalDays: number;
  hadithsPerDay: number;
}

export interface BackupRecord {
  id: string;
  fileName: string;
  fileSize: string;
  createdBy: string;
  createdAt: string;
  sheetsCount: number;
}

export interface FileItem {
  id: string;
  name: string;
  type: 'pdf' | 'audio' | 'image' | 'document';
  url: string;
  folder: string;
  uploadedBy: string;
  createdAt: string;
}

export interface RegistrationRequest {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: StudentStatus;
  rejectionReason?: string;
  createdAt: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface DashboardStats {
  totalStudents: number;
  pendingStudents: number;
  approvedStudents: number;
  rejectedStudents: number;
  suspendedStudents: number;
  totalSupervisors: number;
  totalAdmins: number;
  totalHadiths: number;
  activeCourses: number;
  issuedCertificates: number;
  unreadNotifications: number;
  unreadMessages: number;
}

export interface DailyLesson {
  day: number;
  date: string;
  hadiths: Hadith[];
  isCompleted: boolean;
  isCurrent: boolean;
}

export interface StudentProgressSummary {
  totalHadiths: number;
  memorizedCount: number;
  listenedCount: number;
  readCount: number;
  completionPercentage: number;
  memorizePercentage: number;
  listenPercentage: number;
  readPercentage: number;
  currentDay: number;
  daysRemaining: number;
  dailyProgress: DayProgress[];
}

export interface DayProgress {
  day: number;
  date: string;
  hadithsCompleted: number;
  totalHadiths: number;
  isCompleted: boolean;
}
