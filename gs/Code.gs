/**
 * Code.gs — نقطة الدخول الرئيسية لـ Google Apps Script
 * يوجّه الطلبات القادمة من الواجهة إلى الدوال المناسبة
 */

/**
 * معالج طلبات GET
 */
function doGet(e) {
  return handleRequest(e, 'GET');
}

/**
 * معالج طلبات POST
 */
function doPost(e) {
  return handleRequest(e, 'POST');
}

/**
 * يوجّه الطلب إلى الدالة المناسبة حسب action
 */
function handleRequest(e, method) {
  var params;

  try {
    if (method === 'GET') {
      params = (e && e.parameter) ? e.parameter : {};
    } else {
      if (e && e.postData && e.postData.contents) {
        params = JSON.parse(e.postData.contents);
      } else {
        params = {};
      }
    }
  } catch (err) {
    return errorResponse('طلب غير صالح.', 'INVALID_REQUEST');
  }

  var action = params.action;
  if (!action) {
    return errorResponse('لم يتم تحديد الإجراء (action).', 'NO_ACTION');
  }

  // Public actions (no auth needed)
  if (action === 'login') {
    return login(params.email, params.password);
  }
  if (action === 'register') {
    return register(params.name, params.email, params.phone, params.password);
  }
  if (action === 'setupSheets') {
    return setupSheets(token, userId);
  }

  // All other actions require token + userId
  var token = params.token;
  var userId = params.userId;

  switch (action) {
    // Auth
    case 'verifySession':
      return handleAuthAction('verifySession', token, userId, params);
    case 'logout':
      return logout(token);

    // Users
    case 'getUsers':
      return getUsers(token, userId);
    case 'getStudents':
      return getStudents(token, userId);
    case 'getRegistrationRequests':
      return getRegistrationRequests(token, userId);
    case 'approveStudent':
      return approveStudent(token, userId, params.studentId);
    case 'rejectStudent':
      return rejectStudent(token, userId, params.studentId, params.reason);
    case 'suspendStudent':
      return suspendStudent(token, userId, params.studentId);
    case 'unsuspendStudent':
      return unsuspendStudent(token, userId, params.studentId);
    case 'deleteUser':
      return deleteUser(token, userId, params.userId || params.targetUserId);
    case 'updateProfile':
      return updateProfile(token, userId, params.updates);
    case 'changePassword':
      return changePassword(token, userId, params.currentPassword, params.newPassword);
    case 'resetPassword':
      return resetPassword(token, userId, params.userId || params.targetUserId);
    case 'addSupervisor':
      return addSupervisor(token, userId, params.name, params.email, params.phone, params.password);
    case 'addAdmin':
      return addAdmin(token, userId, params.name, params.email, params.phone, params.password);

    // Hadiths
    case 'getHadiths':
      return getHadiths(token, userId);
    case 'addHadith':
      return addHadith(token, userId, params.hadith);
    case 'updateHadith':
      return updateHadith(token, userId, params.hadithId, params.hadith);
    case 'deleteHadith':
      return deleteHadith(token, userId, params.hadithId);

    // Progress
    case 'getDailyLessons':
      return getDailyLessons(token, userId, params.courseId);
    case 'saveProgress':
      return saveProgress(token, userId, params.hadithId, params.field, params.value);
    case 'getProgressSummary':
      return getProgressSummary(token, userId);

    // Dashboard
    case 'getDashboard':
      return getDashboard(token, userId);

    // Messages
    case 'sendMessage':
      return sendMessage(token, userId, params.receiverId, params.content);
    case 'getMessages':
      return getMessages(token, userId, params.contactId);
    case 'markMessageRead':
      return markMessageRead(token, userId, params.messageId);

    // Notifications
    case 'sendNotification':
      return sendNotification(token, userId, params.targetRole, params.title, params.content, params.targetUserId);
    case 'getNotifications':
      return getNotifications(token, userId);
    case 'markNotificationRead':
      return markNotificationRead(token, userId, params.notificationId);

    // Certificates
    case 'issueCertificate':
      return issueCertificate(token, userId, params.userId || params.targetUserId, params.courseId);
    case 'getCertificates':
      return getCertificates(token, userId, params.userId);

    // Settings
    case 'getSettings':
      return getSettings(token, userId);
    case 'updateSettings':
      return updateSettings(token, userId, params.settings);

    // Courses
    case 'getCourses':
      return getCourses(token, userId);
    case 'startNewCourse':
      return startNewCourse(token, userId, params.name);

    // Activity Log
    case 'getActivityLog':
      return getActivityLog(token, userId);

    // Backup
    case 'backupDatabase':
      return backupDatabase(token, userId);
    case 'restoreBackup':
      return restoreBackup(token, userId, params.backupId);
    case 'getBackups':
      return getBackups(token, userId);

    // Files
    case 'getFiles':
      return getFiles(token, userId);

    // Setup
    // setupSheets handled above as public action

    default:
      return errorResponse('الإجراء غير معروف: ' + action, 'UNKNOWN_ACTION');
  }
}

/**
 * يتحقق من الجلسة ويعيد المستخدم
 */
function handleAuthAction(action, token, userId, params) {
  if (action === 'verifySession') {
    var user = verifySession(token, userId);
    if (!user) {
      return errorResponse('انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.', 'SESSION_EXPIRED');
    }
    return successResponse({ user: user }, 'تم التحقق من الجلسة.');
  }
  return errorResponse('إجراء غير معروف.', 'UNKNOWN_ACTION');
}
