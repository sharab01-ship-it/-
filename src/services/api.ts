import type {
  Session,
  User,
  UserRole,
} from '@/types';

/**
 * ==========================================================
 * زاد الحلقات - API Service
 * ==========================================================
 *
 * هذا الإصدار مخصص لتشخيص مشكلة الاتصال مع Google Apps Script.
 *
 * بما أن:
 *   GET  → يعمل
 *   POST → Failed to fetch
 *
 * يتم استخدام GET حاليًا لجميع العمليات.
 *
 * ملاحظة أمنية:
 * لا تعتمد هذا الإصدار كحل إنتاجي نهائي لأن بيانات تسجيل
 * الدخول ستكون ضمن Query String.
 *
 * بعد التأكد من نجاح الاتصال سنعيد تصميم POST بطريقة آمنة.
 */


/**
 * ==========================================================
 * Google Apps Script URL
 * ==========================================================
 */

const APPS_SCRIPT_URL =
  (
    import.meta.env.VITE_APPS_SCRIPT_URL as
      | string
      | undefined
  )?.trim() || '';


const REQUEST_TIMEOUT = 30000;


const SESSION_STORAGE_KEY =
  'zad_al_halaqat_session';


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

  } catch (error) {

    console.error(
      '[زاد الحلقات] قراءة الجلسة فشلت:',
      error
    );


    sessionStorage.removeItem(
      SESSION_STORAGE_KEY
    );


    return null;
  }
}


/**
 * ==========================================================
 * Store Session
 * ==========================================================
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
 * ==========================================================
 * Clear Session
 * ==========================================================
 */

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

    const url =
      new URL(
        APPS_SCRIPT_URL
      );


    return (
      url.protocol === 'https:' &&
      url.hostname ===
        'script.google.com' &&
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


/**
 * ==========================================================
 * Get Config URL
 * ==========================================================
 */

export function getConfigUrl(): string {

  return APPS_SCRIPT_URL;
}


/**
 * ==========================================================
 * Active Controllers
 * ==========================================================
 */

const activeControllers =
  new Map<
    string,
    AbortController
  >();


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


function createNetworkError(
  error?: unknown
): ApiError {

  let details = '';


  if (
    error instanceof Error
  ) {

    details =
      ` | ${error.name}: ${error.message}`;
  }


  console.error(
    '[زاد الحلقات] Network Error:',
    error
  );


  console.error(
    '[زاد الحلقات] Apps Script URL:',
    APPS_SCRIPT_URL
  );


  return new ApiError(
    `تعذر الاتصال بخادم Google Apps Script.${details}`,
    'NETWORK_ERROR'
  );
}


/**
 * ==========================================================
 * Parse Response
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


    console.error(
      '[زاد الحلقات] Invalid JSON:',
      text
    );


    throw new ApiError(
      `استجابة غير صالحة من Google Apps Script: ${preview}`,
      'INVALID_JSON'
    );
  }
}


/**
 * ==========================================================
 * Process Result
 * ==========================================================
 */

function processApiResult<T>(
  result: ApiResponse<T>
): T {

  /**
   * Session expired
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
   * Permission denied
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
   * Server failure
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
 *
 * في هذا الإصدار:
 *
 * GET فقط.
 *
 * السبب:
 * POST من المتصفح إلى Apps Script يعيد:
 *
 * TypeError: Failed to fetch
 *
 * بينما GET يعمل بنجاح.
 *
 * ==========================================================
 */

async function callApi<T>(
  action: string,
  params: Record<
    string,
    unknown
  > = {},
  method:
    | 'GET'
    | 'POST' = 'GET'
): Promise<T> {

  /**
   * --------------------------------------------------------
   * Configuration
   * --------------------------------------------------------
   */

  if (!isConfigured()) {

    console.error(
      '[زاد الحلقات] Apps Script غير مهيأ:',
      APPS_SCRIPT_URL
    );


    throw new ApiError(
      'لم يتم إعداد رابط Google Apps Script بشكل صحيح. تأكد من VITE_APPS_SCRIPT_URL.',
      'NOT_CONFIGURED'
    );
  }


  /**
   * --------------------------------------------------------
   * Request ID
   * --------------------------------------------------------
   */

  const requestId =
    generateRequestId();


  /**
   * --------------------------------------------------------
   * Controller
   * --------------------------------------------------------
   */

  const controller =
    new AbortController();


  activeControllers.set(
    requestId,
    controller
  );


  /**
   * --------------------------------------------------------
   * Timeout
   * --------------------------------------------------------
   */

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

    const payload:
      Record<
        string,
        unknown
      > = {

      action,

      ...params,
    };


    /**
     * ------------------------------------------------------
     * Session credentials
     * ------------------------------------------------------
     */

    if (session) {

      if (session.token) {

        payload.token =
          session.token;
      }


      if (session.userId) {

        payload.userId =
          session.userId;
      }
    }


    /**
     * ------------------------------------------------------
     * Debug payload
     * ------------------------------------------------------
     */

    const debugPayload = {
      ...payload,
    };


    /**
     * لا نطبع كلمات المرور في Console
     */

    if (
      'password' in
      debugPayload
    ) {

      debugPayload.password =
        '***';
    }


    if (
      'currentPassword' in
      debugPayload
    ) {

      debugPayload.currentPassword =
        '***';
    }


    if (
      'newPassword' in
      debugPayload
    ) {

      debugPayload.newPassword =
        '***';
    }


    console.debug(
      '[زاد الحلقات] API Request:',
      {
        action,
        method,
        payload:
          debugPayload,
      }
    );


    /**
     * ======================================================
     * GET
     * ======================================================
     */

    const url =
      new URL(
        APPS_SCRIPT_URL
      );


    Object.entries(
      payload
    ).forEach(
      ([key, value]) => {

        if (
          value ===
            undefined ||
          value === null
        ) {

          return;
        }


        /**
         * Objects / Arrays
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
    );


    console.debug(
      '[زاد الحلقات] GET URL:',
      url.toString()
    );


    /**
     * ======================================================
     * Fetch
     * ======================================================
     */

    const response =
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


    console.debug(
      '[زاد الحلقات] Response:',
      {
        status:
          response.status,

        statusText:
          response.statusText,

        redirected:
          response.redirected,

        url:
          response.url,
      }
    );


    /**
     * ======================================================
     * Parse
     * ======================================================
     */

    const result =
      await parseResponse<T>(
        response
      );


    console.debug(
      '[زاد الحلقات] Result:',
      result
    );


    /**
     * ======================================================
     * Process
     * ======================================================
     */

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

      console.error(
        '[زاد الحلقات] API Error:',
        {
          action,
          code:
            error.code,
          message:
            error.message,
          statusCode:
            error.statusCode,
        }
      );


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
     * Network
     * ------------------------------------------------------
     */

    if (
      error instanceof
      TypeError
    ) {

      throw createNetworkError(
        error
      );
    }


    /**
     * ------------------------------------------------------
     * Unknown
     * ------------------------------------------------------
     */

    console.error(
      '[زاد الحلقات] Unknown API Error:',
      error
    );


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
 * Cancel Requests
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
   * Connection Test
   * ========================================================
   */

  testConnection: () =>
    callApi<{
      status: string;
      service: string;
      method: string;
      timestamp: string;
    }>(
      'test',
      {},
      'GET'
    ),


  /**
   * ========================================================
   * Authentication
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
    ),


  getStudents: () =>
    callApi<{
      students: User[];
    }>(
      'getStudents',
      {},
      'GET'
    ),


  getUsers: () =>
    callApi<{
      users: User[];
    }>(
      'getUsers',
      {},
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
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
      'GET'
    ),
};
