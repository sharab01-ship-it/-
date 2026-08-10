import type { Session, User, UserRole } from '@/types';

/**
 * ==========================================================
 * Google Apps Script URL
 * ==========================================================
 */

const APPS_SCRIPT_URL =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim() || '';

const REQUEST_TIMEOUT = 30000;

const SESSION_STORAGE_KEY = 'zad_al_halaqat_session';

const activeControllers = new Map<string, AbortController>();


/**
 * ==========================================================
 * ApiError
 * ==========================================================
 */

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


/**
 * ==========================================================
 * ApiResponse
 * ==========================================================
 */

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
}


/**
 * ==========================================================
 * Session
 * ==========================================================
 */

export function getStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(
      SESSION_STORAGE_KEY
    );

    if (!raw) {
      return null;
    }

    const session = JSON.parse(raw) as Session;

    if (
      !session ||
      !session.expiresAt
    ) {
      sessionStorage.removeItem(
        SESSION_STORAGE_KEY
      );

      return null;
    }

    if (
      Date.now() >
      session.expiresAt
    ) {
      sessionStorage.removeItem(
        SESSION_STORAGE_KEY
      );

      return null;
    }

    return session;

  } catch {
    sessionStorage.removeItem(
      SESSION_STORAGE_KEY
    );

    return null;
  }
}


export function storeSession(
  session: Session
): void {
  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );
}


export function clearStoredSession(): void {
  sessionStorage.removeItem(
    SESSION_STORAGE_KEY
  );
}


/**
 * ==========================================================
 * Configuration
 * ==========================================================
 */

export function isConfigured(): boolean {
  if (!APPS_SCRIPT_URL) {
    return false;
  }

  try {
    const url = new URL(
      APPS_SCRIPT_URL
    );

    return (
      url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      url.pathname.startsWith(
        '/macros/s/'
      ) &&
      url.pathname.endsWith(
        '/exec'
      )
    );

  } catch {
    return false;
  }
}


export function getConfigUrl(): string {
  return APPS_SCRIPT_URL;
}


/**
 * ==========================================================
 * Request ID
 * ==========================================================
 */

function generateRequestId(): string {
  return `${Date.now()}-${Math.random()
    .toString(36)
    .substring(2, 9)}`;
}


/**
 * ==========================================================
 * Errors
 * ==========================================================
 */

function createTimeoutError(): ApiError {
  return new ApiError(
    'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
    'TIMEOUT'
  );
}


function createNetworkError(): ApiError {
  return new ApiError(
    'تعذر الاتصال بخادم Google Apps Script. تحقق من رابط Google Apps Script ومن نشره كتطبيق ويب.',
    'NETWORK_ERROR'
  );
}


/**
 * ==========================================================
 * قراءة JSON من الاستجابة
 * ==========================================================
 */

async function parseResponse<T>(
  response: Response
): Promise<ApiResponse<T>> {

  if (!response.ok) {
    throw new ApiError(
      `خطأ في خادم Google Apps Script (${response.status}).`,
      'HTTP_ERROR',
      response.status
    );
  }

  const text =
    await response.text();

  if (
    !text ||
    !text.trim()
  ) {
    throw new ApiError(
      'الخادم أعاد استجابة فارغة. تحقق من Google Apps Script.',
      'EMPTY_RESPONSE'
    );
  }

  try {

    return JSON.parse(
      text
    ) as ApiResponse<T>;

  } catch {

    const preview =
      text
        .replace(/\s+/g, ' ')
        .trim()
        .substring(0, 300);

    throw new ApiError(
      `استجابة غير صالحة من Google Apps Script: ${preview}`,
      'INVALID_JSON'
    );
  }
}


/**
 * ==========================================================
 * معالجة نتيجة API
 * ==========================================================
 */

function processApiResult<T>(
  result: ApiResponse<T>
): T {

  /**
   * انتهاء الجلسة
   */
  if (
    result.code ===
      'SESSION_EXPIRED' ||
    result.code ===
      'INVALID_SESSION'
  ) {

    clearStoredSession();

    throw new ApiError(
      'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      'SESSION_EXPIRED'
    );
  }


  /**
   * عدم وجود صلاحية
   */
  if (
    result.code ===
    'PERMISSION_DENIED'
  ) {

    throw new ApiError(
      'ليس لديك صلاحية لتنفيذ هذه العملية.',
      'PERMISSION_DENIED'
    );
  }


  /**
   * فشل العملية
   */
  if (!result.success) {

    throw new ApiError(
      result.message ||
        result.error ||
        'حدث خطأ غير متوقع في الخادم.',
      result.code ||
        'UNKNOWN_ERROR'
    );
  }


  return result.data as T;
}


/**
 * ==========================================================
 * callApi
 * ==========================================================
 */

async function callApi<T>(
  action: string,
  params: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {

  /**
   * --------------------------------------------------------
   * التحقق من الرابط
   * --------------------------------------------------------
   */

  if (!isConfigured()) {

    throw new ApiError(
      'لم يتم إعداد رابط Google Apps Script بشكل صحيح. تأكد من VITE_APPS_SCRIPT_URL.',
      'NOT_CONFIGURED'
    );
  }


  const requestId =
    generateRequestId();

  const controller =
    new AbortController();

  activeControllers.set(
    requestId,
    controller
  );


  const timeoutId =
    window.setTimeout(
      () => {
        controller.abort();
      },
      REQUEST_TIMEOUT
    );


  try {

    /**
     * ------------------------------------------------------
     * Session
     * ------------------------------------------------------
     */

    const session =
      getStoredSession();


    /**
     * ------------------------------------------------------
     * Payload
     * ------------------------------------------------------
     */

    const payload: Record<
      string,
      unknown
    > = {
      action,
      ...params,
    };


    /**
     * إضافة بيانات الجلسة
     */

    if (session) {

      payload.token =
        session.token;

      payload.userId =
        session.userId;
    }


    /**
     * ======================================================
     * GET
     * ======================================================
     */

    if (method === 'GET') {

      const url =
        new URL(
          APPS_SCRIPT_URL
        );


      Object.entries(
        payload
      ).forEach(
        ([key, value]) => {

          if (
            value !== undefined &&
            value !== null
          ) {

            /**
             * JSON للقيم المركبة
             */
            if (
              typeof value ===
                'object'
            ) {

              url.searchParams.set(
                key,
                JSON.stringify(
                  value
                )
              );

            } else {

              url.searchParams.set(
                key,
                String(value)
              );
            }
          }
        }
      );


      const response =
        await fetch(
          url.toString(),
          {
            method: 'GET',

            signal:
              controller.signal,

            redirect: 'follow',

            credentials: 'omit',

            cache: 'no-store',
          }
        );


      const result =
        await parseResponse<T>(
          response
        );


      return processApiResult(
        result
      );
    }


    /**
     * ======================================================
     * POST
     * ======================================================
     *
     * Google Apps Script Web App
     *
     * نستخدم text/plain حتى لا نطلب
     * CORS preflight OPTIONS.
     * ======================================================
     */

    const response =
      await fetch(
        APPS_SCRIPT_URL,
        {
          method: 'POST',

          headers: {
            'Content-Type':
              'text/plain;charset=utf-8',
          },

          body:
            JSON.stringify(
              payload
            ),

          signal:
            controller.signal,

          redirect:
            'follow',

          credentials:
            'omit',

          cache:
            'no-store',
        }
      );


    const result =
      await parseResponse<T>(
        response
      );


    return processApiResult(
      result
    );


  } catch (error) {

    /**
     * ------------------------------------------------------
     * ApiError
     * ------------------------------------------------------
     */

    if (
      error instanceof ApiError
    ) {

      throw error;
    }


    /**
     * ------------------------------------------------------
     * Timeout
     * ------------------------------------------------------
     */

    if (
      error instanceof
        DOMException &&
      error.name ===
        'AbortError'
    ) {

      throw createTimeoutError();
    }


    /**
     * ------------------------------------------------------
     * Network / CORS / Fetch
     * ------------------------------------------------------
     */

    if (
      error instanceof
      TypeError
    ) {

      throw createNetworkError();
    }


    /**
     * ------------------------------------------------------
     * Unknown
     * ------------------------------------------------------
     */

    throw new ApiError(
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع.',
      'UNKNOWN_ERROR'
    );


  } finally {

    window.clearTimeout(
      timeoutId
    );

    activeControllers.delete(
      requestId
    );
  }
}


/**
 * ==========================================================
 * إلغاء جميع الطلبات
 * ==========================================================
 */

export function cancelAllRequests(): void {

  activeControllers.forEach(
    (controller) => {
      controller.abort();
    }
  );

  activeControllers.clear();
}


/**
 * ==========================================================
 * API
 * ==========================================================
 */

export const api = {

  /**
   * ========================================================
   * اختبار الاتصال
   * ========================================================
   */

  testConnection: () =>
    callApi<{
      status: string;
      service: string;
      method: string;
      timestamp: string;
      message: string;
    }>(
      'test',
      {},
      'GET'
    ),


  /**
   * ========================================================
   * Auth
   * ========================================================
   */

  login: (
    email: string,
    password: string
  ) =>
    callApi<{
      session: Session;
      user: User;
    }>(
      'login',
      {
        email,
        password,
      },
      'POST'
    ),


  register: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'register',
      {
        name,
        email,
        phone,
        password,
      },
      'POST'
    ),


  verifySession: () =>
    callApi<{
      user: User;
    }>(
      'verifySession',
      {},
      'GET'
    ),


  logout: () =>
    callApi<{
      success: boolean;
    }>(
      'logout',
      {},
      'POST'
    ),


  /**
   * ========================================================
   * Students / Registration
   * ========================================================
   */

  getRegistrationRequests: () =>
    callApi<{
      requests:
        import('@/types')
          .RegistrationRequest[];
    }>(
      'getRegistrationRequests',
      {},
      'POST'
    ),


  approveStudent: (
    studentId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'approveStudent',
      {
        studentId,
      },
      'POST'
    ),


  rejectStudent: (
    studentId: string,
    reason: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'rejectStudent',
      {
        studentId,
        reason,
      },
      'POST'
    ),


  suspendStudent: (
    studentId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'suspendStudent',
      {
        studentId,
      },
      'POST'
    ),


  unsuspendStudent: (
    studentId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'unsuspendStudent',
      {
        studentId,
      },
      'POST'
    ),


  getStudents: () =>
    callApi<{
      students: User[];
    }>(
      'getStudents',
      {},
      'POST'
    ),


  getUsers: () =>
    callApi<{
      users: User[];
    }>(
      'getUsers',
      {},
      'POST'
    ),


  deleteUser: (
    userId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'deleteUser',
      {
        userId,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Hadiths
   * ========================================================
   */

  getHadiths: () =>
    callApi<{
      hadiths:
        import('@/types').Hadith[];
    }>(
      'getHadiths',
      {},
      'GET'
    ),


  addHadith: (
    hadith:
      Partial<
        import('@/types').Hadith
      >
  ) =>
    callApi<{
      success: boolean;
    }>(
      'addHadith',
      {
        hadith,
      },
      'POST'
    ),


  updateHadith: (
    hadithId: string,
    hadith:
      Partial<
        import('@/types').Hadith
      >
  ) =>
    callApi<{
      success: boolean;
    }>(
      'updateHadith',
      {
        hadithId,
        hadith,
      },
      'POST'
    ),


  deleteHadith: (
    hadithId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'deleteHadith',
      {
        hadithId,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Progress
   * ========================================================
   */

  getDailyLessons: (
    courseId?: string
  ) =>
    callApi<{
      lessons:
        import('@/types').DailyLesson[];

      currentDay: number;

      course:
        import('@/types').Course;
    }>(
      'getDailyLessons',
      {
        courseId,
      },
      'GET'
    ),


  saveProgress: (
    hadithId: string,
    field:
      | 'memorized'
      | 'listened'
      | 'read',
    value: boolean
  ) =>
    callApi<{
      success: boolean;
    }>(
      'saveProgress',
      {
        hadithId,
        field,
        value,
      },
      'POST'
    ),


  getProgressSummary: () =>
    callApi<{
      summary:
        import('@/types')
          .StudentProgressSummary;
    }>(
      'getProgressSummary',
      {},
      'GET'
    ),


  /**
   * ========================================================
   * Dashboard
   * ========================================================
   */

  getDashboard: () =>
    callApi<{
      stats:
        import('@/types')
          .DashboardStats;

      recentActivity:
        import('@/types')
          .ActivityLog[];
    }>(
      'getDashboard',
      {},
      'GET'
    ),


  /**
   * ========================================================
   * Profile
   * ========================================================
   */

  updateProfile: (
    updates: Partial<User>
  ) =>
    callApi<{
      user: User;
    }>(
      'updateProfile',
      {
        updates,
      },
      'POST'
    ),


  changePassword: (
    currentPassword: string,
    newPassword: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'changePassword',
      {
        currentPassword,
        newPassword,
      },
      'POST'
    ),


  resetPassword: (
    userId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'resetPassword',
      {
        userId,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Messages
   * ========================================================
   */

  sendMessage: (
    receiverId: string,
    content: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'sendMessage',
      {
        receiverId,
        content,
      },
      'POST'
    ),


  getMessages: (
    contactId?: string
  ) =>
    callApi<{
      messages:
        import('@/types').Message[];

      contacts: {
        id: string;
        name: string;
        role: UserRole;
      }[];
    }>(
      'getMessages',
      {
        contactId,
      },
      'GET'
    ),


  markMessageRead: (
    messageId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'markMessageRead',
      {
        messageId,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Notifications
   * ========================================================
   */

  sendNotification: (
    targetRole:
      | UserRole
      | 'all'
      | 'group',

    title: string,

    content: string,

    targetUserId?: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'sendNotification',
      {
        targetRole,
        title,
        content,
        targetUserId,
      },
      'POST'
    ),


  getNotifications: () =>
    callApi<{
      notifications:
        import('@/types').Notification[];
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
    }>(
      'markNotificationRead',
      {
        notificationId,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Certificates
   * ========================================================
   */

  issueCertificate: (
    userId: string,
    courseId: string
  ) =>
    callApi<{
      certificate:
        import('@/types').Certificate;
    }>(
      'issueCertificate',
      {
        userId,
        courseId,
      },
      'POST'
    ),


  getCertificates: (
    userId?: string
  ) =>
    callApi<{
      certificates:
        import('@/types').Certificate[];
    }>(
      'getCertificates',
      {
        userId,
      },
      'GET'
    ),


  /**
   * ========================================================
   * Settings
   * ========================================================
   */

  getSettings: () =>
    callApi<{
      settings:
        import('@/types').SiteSettings;
    }>(
      'getSettings',
      {},
      'GET'
    ),


  updateSettings: (
    settings:
      Partial<
        import('@/types').SiteSettings
      >
  ) =>
    callApi<{
      success: boolean;
    }>(
      'updateSettings',
      {
        settings,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Courses
   * ========================================================
   */

  getCourses: () =>
    callApi<{
      courses:
        import('@/types').Course[];
    }>(
      'getCourses',
      {},
      'GET'
    ),


  startNewCourse: (
    name: string
  ) =>
    callApi<{
      course:
        import('@/types').Course;
    }>(
      'startNewCourse',
      {
        name,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Activity Log
   * ========================================================
   */

  getActivityLog: () =>
    callApi<{
      logs:
        import('@/types').ActivityLog[];
    }>(
      'getActivityLog',
      {},
      'GET'
    ),


  /**
   * ========================================================
   * Backup
   * ========================================================
   */

  backupDatabase: () =>
    callApi<{
      backup:
        import('@/types').BackupRecord;
    }>(
      'backupDatabase',
      {},
      'POST'
    ),


  restoreBackup: (
    backupId: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'restoreBackup',
      {
        backupId,
      },
      'POST'
    ),


  getBackups: () =>
    callApi<{
      backups:
        import('@/types').BackupRecord[];
    }>(
      'getBackups',
      {},
      'GET'
    ),


  /**
   * ========================================================
   * Files
   * ========================================================
   */

  getFiles: () =>
    callApi<{
      files:
        import('@/types').FileItem[];
    }>(
      'getFiles',
      {},
      'POST'
    ),


  /**
   * ========================================================
   * Admin
   * ========================================================
   */

  addSupervisor: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'addSupervisor',
      {
        name,
        email,
        phone,
        password,
      },
      'POST'
    ),


  addAdmin: (
    name: string,
    email: string,
    phone: string,
    password: string
  ) =>
    callApi<{
      success: boolean;
    }>(
      'addAdmin',
      {
        name,
        email,
        phone,
        password,
      },
      'POST'
    ),


  /**
   * ========================================================
   * Setup
   * ========================================================
   */

  setupSheets: () =>
    callApi<{
      success: boolean;
      sheetsCreated: string[];
    }>(
      'setupSheets',
      {},
      'POST'
    ),
};
