/**
 * Users.gs — إدارة المستخدمين
 */

/**
 * يحصل على جميع المستخدمين
 */
function getUsers(token, userId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var users = readAllObjects('Users');
  var safeUsers = users.map(function(u) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      status: u.status,
      rejectionReason: u.rejectionReason,
      approvedDate: u.approvedDate,
      courseId: u.courseId,
      startDate: u.startDate,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  });
  
  return successResponse({ users: safeUsers });
}

/**
 * يحصل على الطلاب فقط
 */
function getStudents(token, userId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var users = readAllObjects('Users');
  var students = users.filter(function(u) { return u.role === 'student'; }).map(function(u) {
    return {
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      phone: u.phone,
      status: u.status,
      rejectionReason: u.rejectionReason,
      approvedDate: u.approvedDate,
      courseId: u.courseId,
      startDate: u.startDate,
      photoUrl: u.photoUrl,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt
    };
  });
  
  return successResponse({ students: students });
}

/**
 * يحصل على طلبات التسجيل
 */
function getRegistrationRequests(token, userId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var regs = readAllObjects('Registrations');
  var safeRegs = regs.map(function(r) {
    return {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      status: r.status,
      rejectionReason: r.rejectionReason,
      approvedBy: r.approvedBy,
      approvedDate: r.approvedDate,
      createdAt: r.createdAt
    };
  });
  
  return successResponse({ requests: safeRegs });
}

/**
 * يعتمد طالب
 */
function approveStudent(token, userId, studentId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var reg = findById('Registrations', studentId);
  if (!reg) {
    return errorResponse('طلب التسجيل غير موجود.', 'NOT_FOUND');
  }
  
  if (reg.status !== 'pending') {
    return errorResponse('تم معالجة هذا الطلب مسبقًا.', 'ALREADY_PROCESSED');
  }
  
  var now = new Date().toISOString();
  
  // Get active course
  var courses = readAllObjects('Courses');
  var activeCourse = null;
  for (var i = 0; i < courses.length; i++) {
    if (courses[i].isActive === true || courses[i].isActive === 'TRUE' || courses[i].isActive === 'true') {
      activeCourse = courses[i];
      break;
    }
  }
  
  // Create user from registration
  var newUser = {
    id: generateUUID(),
    email: reg.email,
    name: reg.name,
    role: 'student',
    phone: reg.phone,
    passwordHash: reg.passwordHash,
    status: 'approved',
    rejectionReason: '',
    approvedDate: now,
    courseId: activeCourse ? activeCourse.id : '',
    startDate: now,
    photoUrl: '',
    createdAt: now,
    updatedAt: now
  };
  
  addRow('Users', newUser);
  
  // Update registration status
  updateRow('Registrations', studentId, {
    status: 'approved',
    approvedBy: user.id,
    approvedDate: now
  });
  
  logOperation(user.id, user.name, 'approve', 'اعتماد طالب: ' + reg.name, 'success');
  
  return successResponse({ success: true }, 'تم اعتماد الطالب بنجاح.');
}

/**
 * يرفض طالب
 */
function rejectStudent(token, userId, studentId, reason) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var reg = findById('Registrations', studentId);
  if (!reg) {
    return errorResponse('طلب التسجيل غير موجود.', 'NOT_FOUND');
  }
  
  if (reg.status !== 'pending') {
    return errorResponse('تم معالجة هذا الطلب مسبقًا.', 'ALREADY_PROCESSED');
  }
  
  updateRow('Registrations', studentId, {
    status: 'rejected',
    rejectionReason: reason || 'لم يتم تحديد سبب',
    approvedBy: user.id,
    approvedDate: new Date().toISOString()
  });
  
  logOperation(user.id, user.name, 'reject', 'رفض طالب: ' + reg.name, 'success', 'السبب: ' + reason);
  
  return successResponse({ success: true }, 'تم رفض الطالب.');
}

/**
 * يوقف طالب
 */
function suspendStudent(token, userId, studentId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var result = updateRow('Users', studentId, { status: 'suspended', updatedAt: new Date().toISOString() });
  if (!result) {
    return errorResponse('المستخدم غير موجود.', 'NOT_FOUND');
  }
  
  logOperation(user.id, user.name, 'suspend', 'إيقاف طالب', 'success', studentId);
  return successResponse({ success: true }, 'تم إيقاف الطالب.');
}

/**
 * يفعّل طالب موقوف
 */
function unsuspendStudent(token, userId, studentId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var result = updateRow('Users', studentId, { status: 'approved', updatedAt: new Date().toISOString() });
  if (!result) {
    return errorResponse('المستخدم غير موجود.', 'NOT_FOUND');
  }
  
  logOperation(user.id, user.name, 'unsuspend', 'تفعيل طالب', 'success', studentId);
  return successResponse({ success: true }, 'تم تفعيل الطالب.');
}

/**
 * يحذف مستخدم
 */
function deleteUser(token, userId, targetUserId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  // Supervisors can only delete students
  if (user.role === 'supervisor') {
    var target = findById('Users', targetUserId);
    if (target && target.role !== 'student') {
      return errorResponse('لا يمكن للمشرف حذف مستخدم غير طالب.', 'PERMISSION_DENIED');
    }
  }
  
  deleteRow('Users', targetUserId);
  logOperation(user.id, user.name, 'delete', 'حذف مستخدم', 'success', targetUserId);
  
  return successResponse({ success: true }, 'تم حذف المستخدم.');
}

/**
 * يحدّث الملف الشخصي
 */
function updateProfile(token, userId, updates) {
  var user = requireAuth(token, userId);
  
  var allowed = { name: updates.name, phone: updates.phone, photoUrl: updates.photoUrl };
  allowed.updatedAt = new Date().toISOString();
  
  var updated = updateRow('Users', user.id, allowed);
  logOperation(user.id, user.name, 'updateProfile', 'تحديث الملف الشخصي', 'success');
  
  return successResponse({ user: {
    id: updated.id,
    email: updated.email,
    name: updated.name,
    role: updated.role,
    phone: updated.phone,
    status: updated.status,
    photoUrl: updated.photoUrl
  }}, 'تم تحديث الملف الشخصي.');
}

/**
 * يضيف مشرف
 */
function addSupervisor(token, userId, name, email, phone, password) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);
  
  email = email.toLowerCase().trim();
  
  var existing = findByField('Users', 'email', email);
  if (existing) {
    return errorResponse('البريد الإلكتروني مستخدم بالفعل.', 'EMAIL_EXISTS');
  }
  
  var now = new Date().toISOString();
  var newUser = {
    id: generateUUID(),
    email: email,
    name: sanitizeInput(name),
    role: 'supervisor',
    phone: sanitizeInput(phone || ''),
    passwordHash: hashPassword(password),
    status: 'approved',
    rejectionReason: '',
    approvedDate: now,
    courseId: '',
    startDate: '',
    photoUrl: '',
    createdAt: now,
    updatedAt: now
  };
  
  addRow('Users', newUser);
  logOperation(user.id, user.name, 'createSupervisor', 'إضافة مشرف: ' + name, 'success');
  
  return successResponse({ success: true }, 'تم إضافة المشرف بنجاح.');
}

/**
 * يضيف مدير
 */
function addAdmin(token, userId, name, email, phone, password) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin']);
  
  email = email.toLowerCase().trim();
  
  var existing = findByField('Users', 'email', email);
  if (existing) {
    return errorResponse('البريد الإلكتروني مستخدم بالفعل.', 'EMAIL_EXISTS');
  }
  
  var now = new Date().toISOString();
  var newUser = {
    id: generateUUID(),
    email: email,
    name: sanitizeInput(name),
    role: 'admin',
    phone: sanitizeInput(phone || ''),
    passwordHash: hashPassword(password),
    status: 'approved',
    rejectionReason: '',
    approvedDate: now,
    courseId: '',
    startDate: '',
    photoUrl: '',
    createdAt: now,
    updatedAt: now
  };
  
  addRow('Users', newUser);
  logOperation(user.id, user.name, 'createAdmin', 'إضافة مدير: ' + name, 'success');
  
  return successResponse({ success: true }, 'تم إضافة المدير بنجاح.');
}
