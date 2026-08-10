/**
 * Certificates.gs — الشهادات
 */

/**
 * يصدر شهادة
 */
function issueCertificate(token, userId, targetUserId, courseId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);

  var targetUser = findById('Users', targetUserId);
  if (!targetUser) {
    return errorResponse('المستخدم غير موجود.', 'NOT_FOUND');
  }

  var courses = readAllObjects('Courses');
  var course = null;
  for (var i = 0; i < courses.length; i++) {
    if (courses[i].id === courseId) { course = courses[i]; break; }
  }
  if (!course) {
    for (var j = 0; j < courses.length; j++) {
      if (courses[j].isActive === true || courses[j].isActive === 'TRUE' || courses[j].isActive === 'true') {
        course = courses[j]; break;
      }
    }
  }
  if (!course) {
    course = { id: '', name: 'برنامج زاد الحلقات', totalHadiths: TOTAL_HADITHS };
  }

  var progressRecords = findAllByField('Progress', 'userId', targetUserId);
  var memorizedCount = 0;
  for (var p = 0; p < progressRecords.length; p++) {
    if (progressRecords[p].memorized) memorizedCount++;
  }

  var totalHadiths = course.totalHadiths || TOTAL_HADITHS;
  var completionPercentage = totalHadiths > 0 ? Math.round((memorizedCount / totalHadiths) * 100) : 0;

  var existingCerts = readAllObjects('Certificates');
  for (var e = 0; e < existingCerts.length; e++) {
    if (existingCerts[e].userId === targetUserId && existingCerts[e].courseId === course.id) {
      return errorResponse('تم إصدار شهادة لهذا الطالب في هذا البرنامج مسبقًا.', 'ALREADY_ISSUED');
    }
  }

  var now = new Date().toISOString();
  var certNumber = 'ZAD-' + new Date().getFullYear() + '-' + Math.floor(Math.random() * 100000).toString().padStart(5, '0');
  var qrCode = 'https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=' + encodeURIComponent(certNumber);

  var certificate = {
    id: generateUUID(),
    certificateNumber: certNumber,
    userId: targetUserId,
    userName: targetUser.name,
    courseId: course.id,
    courseName: course.name,
    completionPercentage: completionPercentage,
    issueDate: now,
    qrCode: qrCode
  };

  addRow('Certificates', certificate);
  logOperation(user.id, user.name, 'issueCertificate', 'إصدار شهادة: ' + targetUser.name, 'success');

  return successResponse({ certificate: certificate }, 'تم إصدار الشهادة بنجاح.');
}

/**
 * يحصل على الشهادات
 */
function getCertificates(token, userId, targetUserId) {
  var user = requireAuth(token, userId);

  var certificates = readAllObjects('Certificates');

  if (targetUserId) {
    if (targetUserId !== user.id && user.role === 'student') {
      return errorResponse('ليس لديك صلاحية.', 'PERMISSION_DENIED');
    }
    certificates = certificates.filter(function(c) { return c.userId === targetUserId; });
  } else if (user.role === 'student') {
    certificates = certificates.filter(function(c) { return c.userId === user.id; });
  }

  certificates.sort(function(a, b) {
    return new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime();
  });

  return successResponse({ certificates: certificates });
}
