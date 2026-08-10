/**
 * Messages.gs — الرسائل
 */

/**
 * يرسل رسالة
 */
function sendMessage(token, userId, receiverId, content) {
  var user = requireAuth(token, userId);

  if (!receiverId || !content || !content.trim()) {
    return errorResponse('يرجى تحديد المستلم ومحتوى الرسالة.', 'VALIDATION_ERROR');
  }

  var receiver = findById('Users', receiverId);
  if (!receiver) {
    return errorResponse('المستلم غير موجود.', 'NOT_FOUND');
  }

  var now = new Date().toISOString();
  var message = {
    id: generateUUID(),
    senderId: user.id,
    senderName: user.name,
    receiverId: receiverId,
    receiverName: receiver.name,
    content: sanitizeInput(content),
    read: false,
    createdAt: now
  };

  addRow('Messages', message);
  logOperation(user.id, user.name, 'sendMessage', 'إرسال رسالة', 'success', 'إلى: ' + receiver.name);

  return successResponse({ success: true }, 'تم إرسال الرسالة.');
}

/**
 * يحصل على الرسائل
 */
function getMessages(token, userId, contactId) {
  var user = requireAuth(token, userId);

  var allMessages = readAllObjects('Messages');
  var userMessages = allMessages.filter(function(m) {
    return m.senderId === user.id || m.receiverId === user.id;
  });

  var contacts = [];
  var contactMap = {};

  for (var i = 0; i < userMessages.length; i++) {
    var otherId = userMessages[i].senderId === user.id ? userMessages[i].receiverId : userMessages[i].senderId;
    var otherName = userMessages[i].senderId === user.id ? userMessages[i].receiverName : userMessages[i].senderName;

    if (otherId && !contactMap[otherId]) {
      var otherUser = findById('Users', otherId);
      contactMap[otherId] = {
        id: otherId,
        name: otherName,
        role: otherUser ? otherUser.role : 'student'
      };
      contacts.push(contactMap[otherId]);
    }
  }

  var messages;
  if (contactId) {
    messages = userMessages.filter(function(m) {
      return (m.senderId === user.id && m.receiverId === contactId) ||
             (m.senderId === contactId && m.receiverId === user.id);
    });
  } else {
    messages = userMessages;
  }

  messages.sort(function(a, b) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });

  return successResponse({ messages: messages, contacts: contacts });
}

/**
 * يعلّم رسالة كمقروءة
 */
function markMessageRead(token, userId, messageId) {
  var user = requireAuth(token, userId);

  var message = findById('Messages', messageId);
  if (!message) {
    return errorResponse('الرسالة غير موجودة.', 'NOT_FOUND');
  }

  if (message.receiverId !== user.id) {
    return errorResponse('لا يمكنك تعليم هذه الرسالة.', 'PERMISSION_DENIED');
  }

  updateRow('Messages', messageId, { read: true });
  return successResponse({ success: true }, 'تم تعليم الرسالة كمقروءة.');
}
