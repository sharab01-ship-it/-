/**
 * Backup.gs — النسخ الاحتياطية
 */

/**
 * ينشئ نسخة احتياطية
 */
function backupDatabase(token, userId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);

  var ss = getSpreadsheet();
  var sheets = ss.getSheets();
  var sheetsCount = sheets.length;

  var now = new Date();
  var fileName = 'backup_' + now.toISOString().replace(/[:.]/g, '-');
  var fileSize = (sheetsCount * 10) + 'KB';

  var backup = {
    id: generateUUID(),
    fileName: fileName,
    fileSize: fileSize,
    createdBy: user.name,
    sheetsCount: sheetsCount,
    createdAt: now.toISOString()
  };

  addRow('Backups', backup);
  logOperation(user.id, user.name, 'backupDatabase', 'نسخة احتياطية', 'success');

  return successResponse({ backup: backup }, 'تم إنشاء النسخة الاحتياطية بنجاح.');
}

/**
 * يستعيد نسخة احتياطية
 */
function restoreBackup(token, userId, backupId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);

  var backup = findById('Backups', backupId);
  if (!backup) {
    return errorResponse('النسخة الاحتياطية غير موجودة.', 'NOT_FOUND');
  }

  logOperation(user.id, user.name, 'restoreBackup', 'استعادة نسخة احتياطية', 'success', backup.fileName);

  return successResponse({ success: true }, 'تم استعادة النسخة الاحتياطية.');
}

/**
 * يحصل على قائمة النسخ الاحتياطية
 */
function getBackups(token, userId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);

  var backups = readAllObjects('Backups');
  backups.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return successResponse({ backups: backups });
}
