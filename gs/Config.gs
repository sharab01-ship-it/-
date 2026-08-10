/**
 * Config.gs — إعدادات النظام
 * 
 * ضع SPREADSHEET_ID في Script Properties:
 * PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', 'your-spreadsheet-id');
 * 
 * أو ضعه مباشرة هنا (غير مستحب للإنتاج):
 * const SPREADSHEET_ID = 'your-spreadsheet-id';
 */

/** اسم قاعدة البيانات */
var SPREADSHEET_NAME = 'قاعدة بيانات زاد الحلقات';

/** مدة الجلسة بالساعات */
var SESSION_DURATION_HOURS = 24;

/** عدد الأحاديث في البرنامج */
var TOTAL_HADITHS = 40;

/** عدد أيام البرنامج */
var TOTAL_DAYS = 20;

/** عدد الأحاديث اليومية */
var HADITHS_PER_DAY = 2;

/** أسماء الأوراق الـ16 */
var SHEET_NAMES = {
  USERS: 'Users',
  REGISTRATIONS: 'Registrations',
  HADITHS: 'Hadiths',
  PROGRESS: 'Progress',
  COURSES: 'Courses',
  CERTIFICATES: 'Certificates',
  MESSAGES: 'Messages',
  NOTIFICATIONS: 'Notifications',
  LOGS: 'Logs',
  SETTINGS: 'Settings',
  FILES: 'Files',
  BACKUPS: 'Backups',
  SUPERVISORS: 'Supervisors',
  ADMINS: 'Admins',
  SESSIONS: 'Sessions',
  META: 'Meta'
};

/** أعمدة كل ورقة */
var SHEET_COLUMNS = {
  Users: ['id', 'email', 'name', 'role', 'phone', 'passwordHash', 'status', 'rejectionReason', 'approvedDate', 'courseId', 'startDate', 'photoUrl', 'createdAt', 'updatedAt'],
  Registrations: ['id', 'name', 'email', 'phone', 'passwordHash', 'status', 'rejectionReason', 'approvedBy', 'approvedDate', 'createdAt'],
  Hadiths: ['id', 'number', 'text', 'explanation', 'youtubeUrl', 'audioUrl', 'pdfUrl', 'category', 'day', 'orderInDay', 'createdAt'],
  Progress: ['id', 'userId', 'hadithId', 'courseId', 'memorized', 'listened', 'read', 'completedDate', 'updatedAt'],
  Courses: ['id', 'name', 'startDate', 'endDate', 'isActive', 'totalHadiths', 'totalDays', 'createdAt'],
  Certificates: ['id', 'certificateNumber', 'userId', 'userName', 'courseId', 'courseName', 'completionPercentage', 'issueDate', 'qrCode'],
  Messages: ['id', 'senderId', 'senderName', 'receiverId', 'receiverName', 'content', 'read', 'createdAt'],
  Notifications: ['id', 'senderId', 'senderName', 'targetRole', 'targetUserId', 'title', 'content', 'read', 'createdAt'],
  Logs: ['id', 'userId', 'userName', 'actionType', 'action', 'result', 'details', 'errorDetails', 'createdAt'],
  Settings: ['id', 'siteName', 'siteSubtitle', 'logoUrl', 'primaryColor', 'contactEmail', 'programName', 'totalHadiths', 'totalDays', 'hadithsPerDay'],
  Files: ['id', 'name', 'type', 'url', 'folder', 'uploadedBy', 'createdAt'],
  Backups: ['id', 'fileName', 'fileSize', 'createdBy', 'sheetsCount', 'createdAt'],
  Supervisors: ['id', 'userId', 'assignedAt'],
  Admins: ['id', 'userId', 'assignedAt'],
  Sessions: ['token', 'userId', 'role', 'name', 'email', 'expiresAt', 'createdAt'],
  Meta: ['key', 'value']
};

/**
 * يحصل على Spreadsheet بطريقة موحدة
 * يدعم Standalone Script و Bound Script
 */
function getSpreadsheet() {
  var id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  
  if (!id) {
    throw new Error('SPREADSHEET_ID غير مضبوط. يرجى ضبطه في Script Properties.');
  }
  
  return SpreadsheetApp.openById(id);
}

/**
 * يحصل على ورقة محددة بالاسم
 */
function getSheet(name) {
  var ss = getSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (!sheet) {
    throw new Error('الورقة "' + name + '" غير موجودة. شغّل setupSheets() أولاً.');
  }
  return sheet;
}

/**
 * يحصل على Script Properties بأمان
 */
function getProperty(key) {
  return PropertiesService.getScriptProperties().getProperty(key);
}

/**
 * يضبط Script Property
 */
function setProperty(key, value) {
  PropertiesService.getScriptProperties().setProperty(key, value);
}
