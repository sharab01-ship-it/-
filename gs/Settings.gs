/**
 * Settings.gs — إعدادات الموقع
 */

var DEFAULT_SETTINGS = {
  siteName: 'زاد الحلقات',
  siteSubtitle: 'برنامج حفظ الأربعين النووية',
  logoUrl: '',
  primaryColor: '#0d9488',
  contactEmail: 'admin@zad.com',
  programName: 'الأربعون النووية',
  totalHadiths: TOTAL_HADITHS,
  totalDays: TOTAL_DAYS,
  hadithsPerDay: HADITHS_PER_DAY
};

/**
 * يحصل على الإعدادات
 */
function getSettings(token, userId) {
  requireAuth(token, userId);

  var settings = findById('Settings', 'site_settings');
  if (!settings) {
    settings = {
      id: 'site_settings',
      siteName: DEFAULT_SETTINGS.siteName,
      siteSubtitle: DEFAULT_SETTINGS.siteSubtitle,
      logoUrl: DEFAULT_SETTINGS.logoUrl,
      primaryColor: DEFAULT_SETTINGS.primaryColor,
      contactEmail: DEFAULT_SETTINGS.contactEmail,
      programName: DEFAULT_SETTINGS.programName,
      totalHadiths: DEFAULT_SETTINGS.totalHadiths,
      totalDays: DEFAULT_SETTINGS.totalDays,
      hadithsPerDay: DEFAULT_SETTINGS.hadithsPerDay
    };
  }

  return successResponse({ settings: settings });
}

/**
 * يحدّث الإعدادات
 */
function updateSettings(token, userId, settings) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);

  var existing = findById('Settings', 'site_settings');
  var updated = existing ? mergeObjects(existing, settings) : mergeObjects(DEFAULT_SETTINGS, settings);
  updated.id = 'site_settings';

  if (existing) {
    updateRow('Settings', 'site_settings', settings);
  } else {
    addRow('Settings', updated);
  }

  logOperation(user.id, user.name, 'updateSettings', 'تحديث الإعدادات', 'success');

  return successResponse({ success: true }, 'تم تحديث الإعدادات بنجاح.');
}
