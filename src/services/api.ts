import type { Session, User, UserRole } from '@/types';

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
const REQUEST_TIMEOUT = 30000;

export class ApiError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message: string;
  error?: string;
  code?: string;
}

const SESSION_STORAGE_KEY = 'zad_al_halaqat_session';

export function getStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as Session;

    if (Date.now() > session.expiresAt) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      return null;
    }

    return session;
  } catch {
    return null;
  }
}

export function storeSession(session: Session): void {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );
}

export function clearStoredSession(): void {
  sessionStorage.removeItem(SESSION_STORAGE_KEY);
}

export function isConfigured(): boolean {
  return Boolean(
    APPS_SCRIPT_URL &&
    APPS_SCRIPT_URL.startsWith('https://')
  );
}

export function getConfigUrl(): string {
  return APPS_SCRIPT_URL || '';
}

const activeControllers = new Map<string, AbortController>();

function generateRequestId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

async function callApi<T>(
  action: string,
  params: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {
  if (!isConfigured()) {
    throw new ApiError(
      'لم يتم إعداد رابط Google Apps Script. يرجى إضافة VITE_APPS_SCRIPT_URL في إعدادات البيئة.',
      'NOT_CONFIGURED'
    );
  }

  const requestId = generateRequestId();
  const controller = new AbortController();

  activeControllers.set(requestId, controller);

  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT
  );

  try {
    const session = getStoredSession();

    const payload: Record<string, unknown> = {
      ...params,
    };

    if (session) {
      payload.token = session.token;
      payload.userId = session.userId;
    }

    let response: Response;

    if (method === 'GET') {
      const url = new URL(APPS_SCRIPT_URL);

      url.searchParams.set('action', action);

      Object.entries(payload).forEach(([key, value]) => {
        if (
          value !== undefined &&
          value !== null
        ) {
          url.searchParams.set(key, String(value));
        }
      });

      response = await fetch(url.toString(), {
        method: 'GET',
        signal: controller.signal,
        redirect: 'follow',
      });
    } else {
      response = await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
        },
        body: JSON.stringify({
          action,
          ...payload,
        }),
        signal: controller.signal,
        redirect: 'follow',
      });
    }

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new ApiError(
        `خطأ في الخادم (${response.status})`,
        'HTTP_ERROR',
        response.status
      );
    }

    const text = await response.text();

    let result: ApiResponse<T>;

    try {
      result = JSON.parse(text) as ApiResponse<T>;
    } catch {
      throw new ApiError(
        'استجابة غير صالحة من الخادم. تأكد من نشر Google Apps Script بشكل صحيح.',
        'INVALID_JSON'
      );
    }

    if (
      result.code === 'SESSION_EXPIRED' ||
      result.code === 'INVALID_SESSION'
    ) {
      clearStoredSession();

      throw new ApiError(
        'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
        'SESSION_EXPIRED'
      );
    }

    if (result.code === 'PERMISSION_DENIED') {
      throw new ApiError(
        'ليس لديك صلاحية لتنفيذ هذه العملية.',
        'PERMISSION_DENIED'
      );
    }

    if (!result.success) {
      throw new ApiError(
        result.message ||
          result.error ||
          'حدث خطأ غير متوقع',
        result.code || 'UNKNOWN_ERROR'
      );
    }

    return result.data as T;

  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new ApiError(
        'انتهت مهلة الطلب. يرجى المحاولة مرة أخرى.',
        'TIMEOUT'
      );
    }

    if (
      error instanceof TypeError &&
      error.message.includes('Failed to fetch')
    ) {
      throw new ApiError(
        'تعذر الاتصال بالخادم. تحقق من اتصال الإنترنت وإعداد رابط Google Apps Script.',
        'NETWORK_ERROR'
      );
    }

    throw new ApiError(
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع',
      'UNKNOWN_ERROR'
    );

  } finally {
    clearTimeout(timeoutId);
    activeControllers.delete(requestId);
  }
}

export function cancelAllRequests(): void {
  activeControllers.forEach((controller) => {
    controller.abort();
  });

  activeControllers.clear();
}

export const api = {
  // Auth

  login: (email: string, password: string) =>
    callApi<{
      session: Session;
      user: User;
    }>('login', {
      email,
      password,
    }),

  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) =>
    callApi<{
      success: boolean;
    }>('register', {
      name,
      email,
      phone,
      password,
    }),

  verifySession: () =>
    callApi<{
      user: User;
    }>('verifySession', {}, 'GET'),

  logout: () =>
    callApi<{
      success: boolean;
    }>('logout'),

  // Students / Registration

  getRegistrationRequests: () =>
    callApi<{
      requests: import('@/types').RegistrationRequest[];
    }>('getRegistrationRequests'),

  approveStudent: (studentId: string) =>
    callApi<{
      success: boolean;
    }>('approveStudent', {
      studentId,
    }),

  rejectStudent: (
    studentId: string,
    reason: string
  ) =>
    callApi<{
      success: boolean;
    }>('rejectStudent', {
      studentId,
      reason,
    }),

  suspendStudent: (studentId: string) =>
    callApi<{
      success: boolean;
    }>('suspendStudent', {
      studentId,
    }),

  unsuspendStudent: (studentId: string) =>
    callApi<{
      success: boolean;
    }>('unsuspendStudent', {
      studentId,
    }),

  getStudents: () =>
    callApi<{
      students: User[];
    }>('getStudents'),

  getUsers: () =>
    callApi<{
      users: User[];
    }>('getUsers'),

  deleteUser: (userId: string) =>
    callApi<{
      success: boolean;
    }>('deleteUser', {
      userId,
    }),

  // Hadiths

  getHadiths: () =>
    callApi<{
      hadiths: import('@/types').Hadith[];
    }>('getHadiths', {}, 'GET'),

  addHadith: (
    hadith: Partial<import('@/types').Hadith>
  ) =>
    callApi<{
      success: boolean;
    }>('addHadith', {
      hadith,
    }),

  updateHadith: (
    hadithId: string,
    hadith: Partial<import('@/types').Hadith>
  ) =>
    callApi<{
      success: boolean;
    }>('updateHadith', {
      hadithId,
      hadith,
    }),

  deleteHadith: (hadithId: string) =>
    callApi<{
      success: boolean;
    }>('deleteHadith', {
      hadithId,
    }),

  // Progress

  getDailyLessons: (courseId?: string) =>
    callApi<{
      lessons: import('@/types').DailyLesson[];
      currentDay: number;
      course: import('@/types').Course;
    }>(
      'getDailyLessons',
      { courseId },
      'GET'
    ),

  saveProgress: (
    hadithId: string,
    field: 'memorized' | 'listened' | 'read',
    value: boolean
  ) =>
    callApi<{
      success: boolean;
    }>('saveProgress', {
      hadithId,
      field,
      value,
    }),

  getProgressSummary: () =>
    callApi<{
      summary: import('@/types').StudentProgressSummary;
    }>('getProgressSummary', {}, 'GET'),

  // Dashboard

  getDashboard: () =>
    callApi<{
      stats: import('@/types').DashboardStats;
      recentActivity: import('@/types').ActivityLog[];
    }>(
      'getDashboard',
      {},
      'GET'
    ),

  // Profile

  updateProfile: (updates: Partial<User>) =>
    callApi<{
      user: User;
    }>('updateProfile', {
      updates,
    }),

  changePassword: (
    currentPassword: string,
    newPassword: string
  ) =>
    callApi<{
      success: boolean;
    }>('changePassword', {
      currentPassword,
      newPassword,
    }),

  resetPassword: (userId: string) =>
    callApi<{
      success: boolean;
    }>('resetPassword', {
      userId,
    }),

  // Messages

  sendMessage: (
    receiverId: string,
    content: string
  ) =>
    callApi<{
      success: boolean;
    }>('sendMessage', {
      receiverId,
      content,
    }),

  getMessages: (contactId?: string) =>
    callApi<{
      messages: import('@/types').Message[];
      contacts: {
        id: string;
        name: string;
        role: UserRole;
      }[];
    }>(
      'getMessages',
      { contactId },
      'GET'
    ),

  markMessageRead: (messageId: string) =>
    callApi<{
      success: boolean;
    }>('markMessageRead', {
      messageId,
    }),

  // Notifications

  sendNotification: (
    targetRole: UserRole | 'all' | 'group',
    title: string,
    content: string,
    targetUserId?: string
  ) =>
    callApi<{
      success: boolean;
    }>('sendNotification', {
      targetRole,
      title,
      content,
      targetUserId,
    }),

  getNotifications: () =>
    callApi<{
      notifications: import('@/types').Notification[];
    }>(
      'getNotifications',
      {},
      'GET'
    ),

  markNotificationRead: (
    notificationId: string
  ) =>
    callApi<{
      success: boolean;
    }>('markNotificationRead', {
      notificationId,
    }),

  // Certificates

  issueCertificate: (
    userId: string,
    courseId: string
  ) =>
    callApi<{
      certificate: import('@/types').Certificate;
    }>('issueCertificate', {
      userId,
      courseId,
    }),

  getCertificates: (userId?: string) =>
    callApi<{
      certificates: import('@/types').Certificate[];
    }>(
      'getCertificates',
      { userId },
      'GET'
    ),

  // Settings

  getSettings: () =>
    callApi<{
      settings: import('@/types').SiteSettings;
    }>(
      'getSettings',
      {},
      'GET'
    ),

  updateSettings: (
    settings: Partial<import('@/types').SiteSettings>
  ) =>
    callApi<{
      success: boolean;
    }>('updateSettings', {
      settings,
    }),

  // Courses

  getCourses: () =>
    callApi<{
      courses: import('@/types').Course[];
    }>(
      'getCourses',
      {},
      'GET'
    ),

  startNewCourse: (name: string) =>
    callApi<{
      course: import('@/types').Course;
    }>('startNewCourse', {
      name,
    }),

  // Activity Log

  getActivityLog: () =>
    callApi<{
      logs: import('@/types').ActivityLog[];
    }>('getActivityLog'),

  // Backup

  backupDatabase: () =>
    callApi<{
      backup: import('@/types').BackupRecord;
    }>('backupDatabase'),

  restoreBackup: (backupId: string) =>
    callApi<{
      success: boolean;
    }>('restoreBackup', {
      backupId,
    }),

  getBackups: () =>
    callApi<{
      backups: import('@/types').BackupRecord[];
    }>(
      'getBackups',
      {},
      'GET'
    ),

  // Files

  getFiles: () =>
    callApi<{
      files: import('@/types').FileItem[];
    }>('getFiles'),

  // Admin management

  addSupervisor: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) =>
    callApi<{
      success: boolean;
    }>('addSupervisor', {
      name,
      email,
      phone,
      password,
    }),

  addAdmin: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) =>
    callApi<{
      success: boolean;
    }>('addAdmin', {
      name,
      email,
      phone,
      password,
    }),

  // Setup

  setupSheets: () =>
    callApi<{
      success: boolean;
      sheetsCreated: string[];
    }>('setupSheets'),
};
