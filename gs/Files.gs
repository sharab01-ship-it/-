/**
 * Files.gs — إدارة الملفات
 */

/**
 * يحصل على جميع الملفات
 */
function getFiles(token, userId) {
  requireAuth(token, userId);

  var files = readAllObjects('Files');
  files.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return successResponse({ files: files });
}
