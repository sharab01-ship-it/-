/**
 * Progress.gs — تقدم الطلاب
 */

/**
 * يحصل على الدروس اليومية
 */
function getDailyLessons(token, userId, courseId) {
  var user = requireAuth(token, userId);

  var hadiths = readAllObjects('Hadiths');
  hadiths.sort(function(a, b) {
    if (a.day !== b.day) return a.day - b.day;
    return a.orderInDay - b.orderInDay;
  });

  var courses = readAllObjects('Courses');
  var activeCourse = null;

  if (courseId) {
    for (var i = 0; i < courses.length; i++) {
      if (courses[i].id === courseId) { activeCourse = courses[i]; break; }
    }
  } else {
    for (var j = 0; j < courses.length; j++) {
      if (courses[j].isActive === true || courses[j].isActive === 'TRUE' || courses[j].isActive === 'true') {
        activeCourse = courses[j]; break;
      }
    }
  }

  if (!activeCourse && courses.length > 0) {
    activeCourse = courses[courses.length - 1];
  }

  if (!activeCourse) {
    activeCourse = { id: '', name: 'البرنامج الافتراضي', startDate: new Date().toISOString(), isActive: true, totalHadiths: TOTAL_HADITHS, totalDays: TOTAL_DAYS, createdAt: new Date().toISOString() };
  }

  var totalDays = activeCourse.totalDays || TOTAL_DAYS;
  var startDate = activeCourse.startDate ? new Date(activeCourse.startDate) : new Date();
  var now = new Date();
  var daysPassed = Math.floor((now - startDate) / (24 * 60 * 60 * 1000)) + 1;
  var currentDay = Math.max(1, Math.min(daysPassed, totalDays));

  var progressRecords = findAllByField('Progress', 'userId', user.id);

  var lessons = [];
  for (var d = 1; d <= totalDays; d++) {
    var dayHadiths = hadiths.filter(function(h) { return Number(h.day) === d; });
    var dayProgress = progressRecords.filter(function(p) {
      return dayHadiths.some(function(h) { return h.id === p.hadithId; });
    });

    var allCompleted = dayHadiths.length > 0 && dayHadiths.every(function(h) {
      var prog = progressRecords.find(function(p) { return p.hadithId === h.id; });
      return prog && prog.memorized && prog.listened && prog.read;
    });

    var dayDate = new Date(startDate.getTime() + (d - 1) * 24 * 60 * 60 * 1000);

    lessons.push({
      day: d,
      date: dayDate.toISOString(),
      hadiths: dayHadiths,
      isCompleted: allCompleted,
      isCurrent: d === currentDay
    });
  }

  return successResponse({ lessons: lessons, currentDay: currentDay, course: activeCourse });
}

/**
 * يحفظ تقدم طالب
 */
function saveProgress(token, userId, hadithId, field, value) {
  var user = requireAuth(token, userId);

  var existing = readAllObjects('Progress');
  var record = null;
  for (var i = 0; i < existing.length; i++) {
    if (existing[i].userId === user.id && existing[i].hadithId === hadithId) {
      record = existing[i];
      break;
    }
  }

  var now = new Date().toISOString();

  if (record) {
    var updates = {};
    updates[field] = value;
    updates.updatedAt = now;

    var allDone = record.memorized && record.listened && record.read;
    if (field === 'memorized') allDone = value && record.listened && record.read;
    if (field === 'listened') allDone = record.memorized && value && record.read;
    if (field === 'read') allDone = record.memorized && record.listened && value;

    if (allDone) updates.completedDate = now;
    updateRow('Progress', record.id, updates);
  } else {
    var newRecord = {
      id: generateUUID(),
      userId: user.id,
      hadithId: hadithId,
      courseId: user.courseId || '',
      memorized: field === 'memorized' ? value : false,
      listened: field === 'listened' ? value : false,
      read: field === 'read' ? value : false,
      completedDate: '',
      updatedAt: now
    };
    if (newRecord.memorized && newRecord.listened && newRecord.read) {
      newRecord.completedDate = now;
    }
    addRow('Progress', newRecord);
  }

  return successResponse({ success: true }, 'تم حفظ التقدم.');
}

/**
 * يحصل على ملخص تقدم الطالب
 */
function getProgressSummary(token, userId) {
  var user = requireAuth(token, userId);

  var hadiths = readAllObjects('Hadiths');
  var totalHadiths = hadiths.length;

  var progressRecords = findAllByField('Progress', 'userId', user.id);

  var memorizedCount = 0;
  var listenedCount = 0;
  var readCount = 0;

  for (var i = 0; i < progressRecords.length; i++) {
    if (progressRecords[i].memorized) memorizedCount++;
    if (progressRecords[i].listened) listenedCount++;
    if (progressRecords[i].read) readCount++;
  }

  var completionPercentage = totalHadiths > 0 ? Math.round((memorizedCount / totalHadiths) * 100) : 0;
  var memorizePercentage = totalHadiths > 0 ? Math.round((memorizedCount / totalHadiths) * 100) : 0;
  var listenPercentage = totalHadiths > 0 ? Math.round((listenedCount / totalHadiths) * 100) : 0;
  var readPercentage = totalHadiths > 0 ? Math.round((readCount / totalHadiths) * 100) : 0;

  var courses = readAllObjects('Courses');
  var activeCourse = null;
  for (var c = 0; c < courses.length; c++) {
    if (courses[c].isActive === true || courses[c].isActive === 'TRUE' || courses[c].isActive === 'true') {
      activeCourse = courses[c]; break;
    }
  }

  var totalDays = (activeCourse && activeCourse.totalDays) ? activeCourse.totalDays : TOTAL_DAYS;
  var startDate = (activeCourse && activeCourse.startDate) ? new Date(activeCourse.startDate) : new Date();
  var now = new Date();
  var daysPassed = Math.floor((now - startDate) / (24 * 60 * 60 * 1000)) + 1;
  var currentDay = Math.max(1, Math.min(daysPassed, totalDays));
  var daysRemaining = Math.max(0, totalDays - currentDay);

  var dailyProgress = [];
  for (var d = 1; d <= totalDays; d++) {
    var dayHadiths = hadiths.filter(function(h) { return Number(h.day) === d; });
    var dayCompleted = 0;
    for (var p = 0; p < progressRecords.length; p++) {
      for (var h = 0; h < dayHadiths.length; h++) {
        if (progressRecords[p].hadithId === dayHadiths[h].id &&
            progressRecords[p].memorized && progressRecords[p].listened && progressRecords[p].read) {
          dayCompleted++;
        }
      }
    }
    var dayDate = new Date(startDate.getTime() + (d - 1) * 24 * 60 * 60 * 1000);
    dailyProgress.push({
      day: d,
      date: dayDate.toISOString(),
      hadithsCompleted: dayCompleted,
      totalHadiths: dayHadiths.length,
      isCompleted: dayHadiths.length > 0 && dayCompleted === dayHadiths.length
    });
  }

  return successResponse({
    summary: {
      totalHadiths: totalHadiths,
      memorizedCount: memorizedCount,
      listenedCount: listenedCount,
      readCount: readCount,
      completionPercentage: completionPercentage,
      memorizePercentage: memorizePercentage,
      listenPercentage: listenPercentage,
      readPercentage: readPercentage,
      currentDay: currentDay,
      daysRemaining: daysRemaining,
      dailyProgress: dailyProgress
    }
  });
}
