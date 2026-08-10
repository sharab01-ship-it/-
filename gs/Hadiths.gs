/**
 * Hadiths.gs — إدارة الأحاديث
 */

/**
 * يحصل على جميع الأحاديث
 */
function getHadiths(token, userId) {
  if (token && userId) {
    try { requireAuth(token, userId); } catch(e) {}
  }
  
  var hadiths = readAllObjects('Hadiths');
  hadiths.sort(function(a, b) {
    if (a.day !== b.day) return a.day - b.day;
    return a.orderInDay - b.orderInDay;
  });
  
  return successResponse({ hadiths: hadiths });
}

/**
 * يضيف حديث جديد
 */
function addHadith(token, userId, hadith) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  if (!hadith.text || !hadith.text.trim()) {
    return errorResponse('نص الحديث مطلوب.', 'VALIDATION_ERROR');
  }
  
  var now = new Date().toISOString();
  var newHadith = {
    id: generateUUID(),
    number: hadith.number || 1,
    text: sanitizeInput(hadith.text),
    explanation: sanitizeInput(hadith.explanation || ''),
    youtubeUrl: hadith.youtubeUrl || '',
    audioUrl: hadith.audioUrl || '',
    pdfUrl: hadith.pdfUrl || '',
    category: sanitizeInput(hadith.category || ''),
    day: hadith.day || 1,
    orderInDay: hadith.orderInDay || 1,
    createdAt: now
  };
  
  addRow('Hadiths', newHadith);
  logOperation(user.id, user.name, 'createHadith', 'إضافة حديث رقم ' + newHadith.number, 'success');
  
  return successResponse({ success: true }, 'تم إضافة الحديث بنجاح.');
}

/**
 * يحدّث حديث
 */
function updateHadith(token, userId, hadithId, hadith) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var existing = findById('Hadiths', hadithId);
  if (!existing) {
    return errorResponse('الحديث غير موجود.', 'NOT_FOUND');
  }
  
  var updates = {};
  if (hadith.text !== undefined) updates.text = sanitizeInput(hadith.text);
  if (hadith.explanation !== undefined) updates.explanation = sanitizeInput(hadith.explanation);
  if (hadith.youtubeUrl !== undefined) updates.youtubeUrl = hadith.youtubeUrl;
  if (hadith.audioUrl !== undefined) updates.audioUrl = hadith.audioUrl;
  if (hadith.pdfUrl !== undefined) updates.pdfUrl = hadith.pdfUrl;
  if (hadith.category !== undefined) updates.category = sanitizeInput(hadith.category);
  if (hadith.number !== undefined) updates.number = hadith.number;
  if (hadith.day !== undefined) updates.day = hadith.day;
  if (hadith.orderInDay !== undefined) updates.orderInDay = hadith.orderInDay;
  
  updateRow('Hadiths', hadithId, updates);
  logOperation(user.id, user.name, 'updateHadith', 'تعديل حديث', 'success', hadithId);
  
  return successResponse({ success: true }, 'تم تحديث الحديث بنجاح.');
}

/**
 * يحذف حديث
 */
function deleteHadith(token, userId, hadithId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  deleteRow('Hadiths', hadithId);
  logOperation(user.id, user.name, 'deleteHadith', 'حذف حديث', 'success', hadithId);
  
  return successResponse({ success: true }, 'تم حذف الحديث.');
}
