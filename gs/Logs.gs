/**
 * Logs.gs — سجل العمليات
 */

/**
 * يسجل عملية في جدول العمليات
 */
function logOperation(userId, userName, actionType, action, result, details) {
  try {
    var log = {
      id: generateUUID(),
      userId: userId || '',
      userName: userName || '',
      actionType: actionType || '',
      action: action || '',
      result: result || 'success',
      details: details || '',
      errorDetails: '',
      createdAt: new Date().toISOString()
    };
    addRow('Logs', log);
  } catch (e) {
    // تجاهل أخطاء التسجيل حتى لا تعطل العملية الأساسية
  }
}

/**
 * يحصل على سجل العمليات
 */
function getActivityLog(token, userId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);

  var logs = readAllObjects('Logs');
  logs.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return successResponse({ logs: logs });
}
