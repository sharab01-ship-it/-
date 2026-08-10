/**
 * Setup.gs — إعداد جداول Google Sheets والحساب الافتراضي
 */

var DEFAULT_ADMIN_EMAIL = 'amkh1409@gmail.com';
var DEFAULT_ADMIN_PASSWORD = '123456';

/**
 * الإعداد الأولي — ينشئ الجداول والحساب الافتراضي للمدير
 * لا يتطلب تسجيل دخول لأنه ينشئ أول حساب مدير
 */
function setupSheets(token, userId) {
  var ss = getSpreadsheet();
  var sheetsCreated = [];

  for (var name in SHEET_NAMES) {
    if (SHEET_NAMES.hasOwnProperty(name)) {
      var sheetName = SHEET_NAMES[name];
      var sheet = ss.getSheetByName(sheetName);

      if (!sheet) {
        sheet = ss.insertSheet(sheetName);
        sheetsCreated.push(sheetName);
      }

      var columns = SHEET_COLUMNS[sheetName];
      if (columns && sheet.getLastRow() === 0) {
        sheet.getRange(1, 1, 1, columns.length).setValues([columns]);
        sheet.setFrozenRows(1);
      }
    }
  }

  var settings = findById('Settings', 'site_settings');
  if (!settings) {
    addRow('Settings', {
      id: 'site_settings',
      siteName: 'زاد الحلقات',
      siteSubtitle: 'برنامج حفظ الأربعين النووية',
      logoUrl: '',
      primaryColor: '#0d9488',
      contactEmail: 'admin@zad.com',
      programName: 'الأربعون النووية',
      totalHadiths: TOTAL_HADITHS,
      totalDays: TOTAL_DAYS,
      hadithsPerDay: HADITHS_PER_DAY
    });
  }

  var courses = readAllObjects('Courses');
  if (courses.length === 0) {
    var now = new Date().toISOString();
    addRow('Courses', {
      id: generateUUID(),
      name: 'البرنامج الأول',
      startDate: now,
      endDate: '',
      isActive: true,
      totalHadiths: TOTAL_HADITHS,
      totalDays: TOTAL_DAYS,
      createdAt: now
    });
  }

  var users = readAllObjects('Users');
  if (users.length === 0) {
    var adminNow = new Date().toISOString();
    addRow('Users', {
      id: generateUUID(),
      email: DEFAULT_ADMIN_EMAIL,
      name: 'المدير العام',
      role: 'admin',
      phone: '',
      passwordHash: hashPassword(DEFAULT_ADMIN_PASSWORD),
      status: 'approved',
      rejectionReason: '',
      approvedDate: adminNow,
      courseId: '',
      startDate: '',
      photoUrl: '',
      createdAt: adminNow,
      updatedAt: adminNow
    });
  }

  var actorName = (token && userId) ? 'مدير' : 'النظام';
  logOperation(userId || '', actorName, 'setupSheets', 'إعداد الجداول والحساب الافتراضي', 'success', 'أوراق: ' + sheetsCreated.join(', '));

  return successResponse({ success: true, sheetsCreated: sheetsCreated }, 'تم إعداد الجداول بنجاح.');
}
