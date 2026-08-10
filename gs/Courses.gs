/**
 * Courses.gs — إدارة البرامج
 */

/**
 * يحصل على جميع البرامج
 */
function getCourses(token, userId) {
  requireAuth(token, userId);

  var courses = readAllObjects('Courses');
  courses.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return successResponse({ courses: courses });
}

/**
 * يبدأ برنامج جديد
 */
function startNewCourse(token, userId, name) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);

  if (!name || !name.trim()) {
    return errorResponse('يرجى إدخال اسم البرنامج.', 'VALIDATION_ERROR');
  }

  var courses = readAllObjects('Courses');
  for (var i = 0; i < courses.length; i++) {
    updateRow('Courses', courses[i].id, { isActive: false });
  }

  var now = new Date().toISOString();
  var newCourse = {
    id: generateUUID(),
    name: sanitizeInput(name),
    startDate: now,
    endDate: '',
    isActive: true,
    totalHadiths: TOTAL_HADITHS,
    totalDays: TOTAL_DAYS,
    createdAt: now
  };

  addRow('Courses', newCourse);
  logOperation(user.id, user.name, 'startNewCourse', 'بدء برنامج جديد: ' + name, 'success');

  return successResponse({ course: newCourse }, 'تم بدء البرنامج بنجاح.');
}
