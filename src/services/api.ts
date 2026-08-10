import type { Session, User, UserRole } from '@/types';

/**
 * ============================================================
 * Google Apps Script URL
 * ============================================================
 *
 * في Vercel يجب أن يكون:
 *
 * VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/XXXXX/exec
 *
 * بدون:
 *
 * ?action=test
 *
 * ============================================================
 */

const APPS_SCRIPT_URL =
  (import.meta.env.VITE_APPS_SCRIPT_URL as string | undefined)?.trim() || '';

const REQUEST_TIMEOUT = 30000;

const SESSION_STORAGE_KEY =
  'zad_al_halaqat_session';


/**
 * ============================================================
 * ApiError
 * ============================================================
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
 * ============================================================
 * ApiResponse
 * ============================================================
 */

export interface ApiResponse<T> {

  success: boolean;

  data?: T | null;

  message?: string;

  error?: string;

  code?: string;

}


/**
 * ============================================================
 * Session
 * ============================================================
 */

export function getStoredSession(): Session | null {

  try {

    const raw =
      sessionStorage.getItem(
        SESSION_STORAGE_KEY
      );

    if (!raw) {
      return null;
    }

    const session =
      JSON.parse(raw) as Session;

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


/**
 * ============================================================
 * Store Session
 * ============================================================
 */

export function storeSession(
  session: Session
): void {

  sessionStorage.setItem(
    SESSION_STORAGE_KEY,
    JSON.stringify(session)
  );

}


/**
 * ============================================================
 * Clear Session
 * ============================================================
 */

export function clearStoredSession(): void {

  sessionStorage.removeItem(
    SESSION_STORAGE_KEY
  );

}


/**
 * ============================================================
 * Configuration
 * ============================================================
 */

export function isConfigured(): boolean {

  if (!APPS_SCRIPT_URL) {
    return false;
  }

  try {

    const url =
      new URL(APPS_SCRIPT_URL);

    return (
      url.protocol === 'https:' &&
      url.hostname === 'script.google.com' &&
      url.pathname.includes('/macros/s/')
    );

  } catch {

    return false;

  }

}


/**
 * ============================================================
 * Get Config URL
 * ============================================================
 */

export function getConfigUrl(): string {

  return APPS_SCRIPT_URL;

}


/**
 * ============================================================
 * Active Requests
 * ============================================================
 */

const activeControllers =
  new Map<string, AbortController>();


/**
 * ============================================================
 * Request ID
 * ============================================================
 */

function generateRequestId(): string {

  return (
    Date.now().toString() +
    '-' +
    Math.random()
      .toString(36)
      .substring(2, 9)
  );

}


/**
 * ============================================================
 * Timeout Error
 * ============================================================
 */

function createTimeoutError(): ApiError {

  return new ApiError(
    'انتهت مهلة الاتصال بالخادم. يرجى المحاولة مرة أخرى.',
    'TIMEOUT'
  );

}


/**
 * ============================================================
 * Network Error
 * ============================================================
 */

function createNetworkError(
  originalError?: unknown
): ApiError {

  const detail =
    originalError instanceof Error
      ? originalError.message
      : '';

  return new ApiError(
    detail
      ? `تعذر الاتصال بخادم Google Apps Script. ${detail}`
      : 'تعذر الاتصال بخادم Google Apps Script. تحقق من رابط Google Apps Script ومن نشره كتطبيق ويب.',
    'NETWORK_ERROR'
  );

}


/**
 * ============================================================
 * Parse JSON
 * ============================================================
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
      'الخادم أعاد استجابة فارغة.',
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
 * ============================================================
 * Handle Server Response
 * ============================================================
 */

function handleApiResponse<T>(
  result: ApiResponse<T>
): T {

  /**
   * ----------------------------------------------------------
   * Session expired
   * ----------------------------------------------------------
   */

  if (
    result.code ===
      'SESSION_EXPIRED' ||
    result.code ===
      'INVALID_SESSION'
  ) {

    clearStoredSession();

    throw new ApiError(
      result.message ||
        'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.',
      'SESSION_EXPIRED'
    );

  }


  /**
   * ----------------------------------------------------------
   * Permission
   * ----------------------------------------------------------
   */

  if (
    result.code ===
    'PERMISSION_DENIED'
  ) {

    throw new ApiError(
      result.message ||
        'ليس لديك صلاحية لتنفيذ هذه العملية.',
      'PERMISSION_DENIED'
    );

  }


  /**
   * ----------------------------------------------------------
   * Failed operation
   * ----------------------------------------------------------
   */

  if (
    result.success !== true
  ) {

    throw new ApiError(
      result.message ||
        result.error ||
        'حدث خطأ غير متوقع في الخادم.',
      result.code ||
        'UNKNOWN_ERROR'
    );

  }


  /**
   * ----------------------------------------------------------
   * Successful response
   * ----------------------------------------------------------
   */

  return result.data as T;

}


/**
 * ============================================================
 * Main API Request
 * ============================================================
 */

async function callApi<T>(
  action: string,
  params: Record<string, unknown> = {},
  method: 'GET' | 'POST' = 'POST'
): Promise<T> {

  /**
   * ----------------------------------------------------------
   * Configuration check
   * ----------------------------------------------------------
   */

  if (!isConfigured()) {

    throw new ApiError(
      'لم يتم إعداد رابط Google Apps Script بشكل صحيح. تحقق من VITE_APPS_SCRIPT_URL في Vercel.',
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
     * --------------------------------------------------------
     * Current session
     * --------------------------------------------------------
     */

    const session =
      getStoredSession();


    /**
     * --------------------------------------------------------
     * Payload
     * --------------------------------------------------------
     */

    const payload:
      Record<string, unknown> = {

      action,

      ...params,

    };


    /**
     * --------------------------------------------------------
     * Add session
     * --------------------------------------------------------
     */

    if (session) {

      payload.token =
        session.token;

      payload.userId =
        session.userId;

    }


    let response: Response;


    /**
     * ========================================================
     * GET
     * ========================================================
     */

    if (
      method === 'GET'
    ) {

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
             * التعامل مع القيم البسيطة
             */

            if (
              typeof value === 'object'
            ) {

              url.searchParams.set(
                key,
                JSON.stringify(value)
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


      response =
        await fetch(
          url.toString(),
          {
            method: 'GET',

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

    }


    /**
     * ========================================================
     * POST
     * ========================================================
     */

    else {

      /**
       * مهم:
       *
       * نستخدم text/plain
       * حتى لا يطلب المتصفح
       * CORS preflight OPTIONS.
       */

      response =
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

    }


    /**
     * --------------------------------------------------------
     * Parse response
     * --------------------------------------------------------
     */

    const result =
      await parseResponse<T>(
        response
      );


    /**
     * --------------------------------------------------------
     * Handle response
     * --------------------------------------------------------
     */

    return handleApiResponse<T>(
      result
    );

  }


  /**
   * ==========================================================
   * Errors
   * ==========================================================
   */

  catch (error) {

    /**
     * --------------------------------------------------------
     * ApiError
     * --------------------------------------------------------
     */

    if (
      error instanceof ApiError
    ) {

      throw error;

    }


    /**
     * --------------------------------------------------------
     * Timeout
     * --------------------------------------------------------
     */

    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {

      throw createTimeoutError();

    }


    /**
     * --------------------------------------------------------
     * Failed fetch
     * --------------------------------------------------------
     */

    if (
      error instanceof TypeError
    ) {

      throw createNetworkError(
        error
      );

    }


    /**
     * --------------------------------------------------------
     * Unknown error
     * --------------------------------------------------------
     */

    throw new ApiError(
      error instanceof Error
        ? error.message
        : 'حدث خطأ غير متوقع.',
      'UNKNOWN_ERROR'
    );

  }


  /**
   * ==========================================================
   * Finally
   * ==========================================================
   */

  finally {

    window.clearTimeout(
      timeoutId
    );

    activeControllers.delete(
      requestId
    );

  }

}


/**
 * ============================================================
 * Cancel Requests
 * ============================================================
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
 * ============================================================
 * API
 * ============================================================
 */

export const api = {

  // ==========================================================
  // TEST
  // ==========================================================

  testConnection: () =>
    callApi<{
      status: string;
    }>(
      'test',
      {},
      'GET'
    ),


  // ==========================================================
  // AUTH
  // ==========================================================

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


  // ==========================================================
  // STUDENTS
  // ==========================================================

  getRegistrationRequests: () =>
    callApi<{
      requests:
        import('@/types').RegistrationRequest[];
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


  // ==========================================================
  // HADITHS
  // ==========================================================

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


  // ==========================================================
  // PROGRESS
  // ==========================================================

  getDailyLessons: (
    courseId?: string
  ) =>
    callApi<{
      lessons:
        import('@/types').DailyLesson[];

      currentDay:
        number;

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
        import('@/types').StudentProgressSummary;
    }>(
      'getProgressSummary',
      {},
      'GET'
    ),


  // ==========================================================
  // DASHBOARD
  // ==========================================================

  getDashboard: () =>
    callApi<{
      stats:
        import('@/types').DashboardStats;

      recentActivity:
        import('@/types').ActivityLog[];

    }>(
      'getDashboard',
      {},
      'GET'
    ),


  // ==========================================================
  // PROFILE
  // ==========================================================

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


  // ==========================================================
  // MESSAGES
  // ==========================================================

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


  // ==========================================================
  // NOTIFICATIONS
  // ==========================================================

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


  // ==========================================================
  // CERTIFICATES
  // ==========================================================

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


  // ==========================================================
  // SETTINGS
  // ==========================================================

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


  // ==========================================================
  // COURSES
  // ==========================================================

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


  // ==========================================================
  // ACTIVITY LOG
  // ==========================================================

  getActivityLog: () =>
    callApi<{
      logs:
        import('@/types').ActivityLog[];
    }>(
      'getActivityLog',
      {},
      'GET'
    ),


  // ==========================================================
  // BACKUP
  // ==========================================================

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


  // ==========================================================
  // FILES
  // ==========================================================

  getFiles: () =>
    callApi<{
      files:
        import('@/types').FileItem[];
    }>(
      'getFiles',
      {},
      'POST'
    ),


  // ==========================================================
  // ADMIN
  // ==========================================================

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


  // ==========================================================
  // SETUP
  // ==========================================================

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
