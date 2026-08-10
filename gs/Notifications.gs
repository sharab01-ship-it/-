/**
 * Notifications.gs — الإشعارات
 */

/**
 * يرسل إشعار
 */
function sendNotification(token, userId, targetRole, title, content, targetUserId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);

  if (!title || !content) {
    return errorResponse('يرجى إدخال عنوان ومحتوى الإشعار.', 'VALIDATION_ERROR');
  }

  var now = new Date().toISOString();
  var notification = {
    id: generateUUID(),
    senderId: user.id,
    senderName: user.name,
    targetRole: targetRole || 'all',
    targetUserId: targetUserId || '',
    title: sanitizeInput(title),
    content: sanitizeInput(content),
    read: false,
    createdAt: now
  };

  addRow('Notifications', notification);
  logOperation(user.id, user.name, 'sendNotification', 'إرسال إشعار: ' + title, 'success', 'إلى: ' + (targetRole || 'all'));

  return successResponse({ success: true }, 'تم إرسال الإشعار بنجاح.');
}

/**
 * يحصل على إشعارات المستخدم
 */
function getNotifications(token, userId) {
  var user = requireAuth(token, userId);

  var allNotifications = readAllObjects('Notifications');
  var userNotifications = allNotifications.filter(function(n) {
    return n.targetRole === 'all' ||
           n.targetRole === user.role ||
           (n.targetUserId && n.targetUserId === user.id);
  });

  userNotifications.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return successResponse({ notifications: userNotifications });
}

/**
 * يعلّم إشعار كمقروء
 */
function markNotificationRead(token, userId, notificationId) {
  var user = requireAuth(token, userId);

  var notification = findById('Notifications', notificationId);
  if (!notification) {
    return errorResponse('الإشعار غير موجود.', 'NOT_FOUND');
  }

  updateRow('Notifications', notificationId, { read: true });
  return successResponse({ success: true }, 'تم تعليم الإشعار كمقروء.');
}
