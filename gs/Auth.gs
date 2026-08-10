/**
 * Auth.gs — نظام المصادقة والجلسات
 */

/**
 * تسجيل الدخول
 */
function login(email, password) {
  if (!email || !password) {
    return errorResponse('يرجى إدخال البريد الإلكتروني وكلمة المرور.', 'AUTH_MISSING_FIELDS');
  }
  
  email = email.toLowerCase().trim();
  
  var user = findByField('Users', 'email', email);
  
  if (!user) {
    logOperation('', '', 'login', 'تسجيل الدخول', 'failure', 'بريد غير موجود: ' + email);
    return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'AUTH_INVALID');
  }
  
  if (!verifyPassword(password, user.passwordHash)) {
    logOperation(user.id, user.name, 'login', 'تسجيل الدخول', 'failure', 'كلمة مرور خاطئة');
    return errorResponse('البريد الإلكتروني أو كلمة المرور غير صحيحة.', 'AUTH_INVALID');
  }
  
  // Check status
  if (user.status === 'pending') {
    return errorResponse('حسابك قيد المراجعة. يرجى الانتظار حتى يتم اعتماده.', 'AUTH_PENDING');
  }
  
  if (user.status === 'rejected') {
    return errorResponse('تم رفض حسابك. سبب الرفض: ' + (user.rejectionReason || 'لم يتم تحديد سبب.'), 'AUTH_REJECTED');
  }
  
  if (user.status === 'suspended') {
    return errorResponse('تم إيقاف حسابك. يرجى التواصل مع الإدارة.', 'AUTH_SUSPENDED');
  }
  
  if (user.status !== 'approved') {
    return errorResponse('حالة الحساب غير معروفة. يرجى التواصل مع الإدارة.', 'AUTH_UNKNOWN_STATUS');
  }
  
  // Create session
  var token = generateToken();
  var now = new Date();
  var expiresAt = new Date(now.getTime() + SESSION_DURATION_HOURS * 60 * 60 * 1000);
  
  var session = {
    token: token,
    userId: user.id,
    role: user.role,
    name: user.name,
    email: user.email,
    expiresAt: expiresAt.getTime(),
    createdAt: now.toISOString()
  };
  
  addRow('Sessions', session);
  
  // Remove password hash from user object
  var safeUser = {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    status: user.status,
    courseId: user.courseId,
    startDate: user.startDate,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
  
  logOperation(user.id, user.name, 'login', 'تسجيل الدخول', 'success');
  
  return successResponse({ session: session, user: safeUser }, 'تم تسجيل الدخول بنجاح.');
}

/**
 * تسجيل حساب طالب جديد
 */
function register(name, email, phone, password) {
  if (!name || !email || !password) {
    return errorResponse('يرجى ملء جميع الحقول المطلوبة.', 'REG_MISSING_FIELDS');
  }
  
  if (password.length < 6) {
    return errorResponse('كلمة المرور يجب أن تكون 6 أحرف على الأقل.', 'REG_SHORT_PASSWORD');
  }
  
  email = email.toLowerCase().trim();
  
  // Check if email already exists
  var existing = findByField('Users', 'email', email);
  if (existing) {
    return errorResponse('البريد الإلكتروني مستخدم بالفعل.', 'REG_EMAIL_EXISTS');
  }
  
  var existingReg = findByField('Registrations', 'email', email);
  if (existingReg) {
    return errorResponse('تم التسجيل مسبقًا بهذا البريد وهو قيد المراجعة.', 'REG_PENDING');
  }
  
  var now = new Date().toISOString();
  var passwordHash = hashPassword(password);
  
  // Create registration record
  var registration = {
    id: generateUUID(),
    name: sanitizeInput(name),
    email: email,
    phone: sanitizeInput(phone || ''),
    passwordHash: passwordHash,
    status: 'pending',
    rejectionReason: '',
    approvedBy: '',
    approvedDate: '',
    createdAt: now
  };
  
  addRow('Registrations', registration);
  
  logOperation('', sanitizeInput(name), 'register', 'تسجيل حساب جديد', 'success', email);
  
  return successResponse({ success: true }, 'تم إرسال طلبك بنجاح. سيتم مراجعته من قبل الإدارة.');
}

/**
 * يتحقق من الجلسة
 */
function verifySession(token, userId) {
  if (!token || !userId) return null;
  
  var session = findByField('Sessions', 'token', token);
  if (!session) return null;
  if (session.userId !== userId) return null;
  
  var now = Date.now();
  if (now > session.expiresAt) {
    deleteRow('Sessions', session.id || session.token);
    return null;
  }
  
  var user = findById('Users', userId);
  if (!user) return null;
  if (user.status !== 'approved' && user.role !== 'admin') return null;
  
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    status: user.status,
    courseId: user.courseId,
    startDate: user.startDate,
    photoUrl: user.photoUrl,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

/**
 * يتحقق من الجلسة ويعيد المستخدم
 */
function requireAuth(token, userId) {
  var user = verifySession(token, userId);
  if (!user) {
    throw { code: 'SESSION_EXPIRED', message: 'انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.' };
  }
  return user;
}

/**
 * يتحقق من الصلاحية
 */
function requireRole(user, roles) {
  if (!user) throw { code: 'PERMISSION_DENIED', message: 'ليس لديك صلاحية.' };
  if (roles.indexOf(user.role) === -1) {
    throw { code: 'PERMISSION_DENIED', message: 'ليس لديك صلاحية لتنفيذ هذه العملية.' };
  }
  return user;
}

/**
 * تسجيل الخروج
 */
function logout(token) {
  if (token) {
    var session = findByField('Sessions', 'token', token);
    if (session) {
      deleteRow('Sessions', session.id || session.token);
    }
  }
  return successResponse({ success: true }, 'تم تسجيل الخروج بنجاح.');
}

/**
 * تغيير كلمة المرور
 */
function changePassword(token, userId, currentPassword, newPassword) {
  var user = requireAuth(token, userId);
  
  var fullUser = findById('Users', userId);
  if (!fullUser || !verifyPassword(currentPassword, fullUser.passwordHash)) {
    return errorResponse('كلمة المرور الحالية غير صحيحة.', 'AUTH_INVALID');
  }
  
  if (newPassword.length < 6) {
    return errorResponse('كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل.', 'VALIDATION_ERROR');
  }
  
  updateRow('Users', userId, { passwordHash: hashPassword(newPassword), updatedAt: new Date().toISOString() });
  logOperation(user.id, user.name, 'changePassword', 'تغيير كلمة المرور', 'success');
  
  return successResponse({ success: true }, 'تم تغيير كلمة المرور بنجاح.');
}

/**
 * إعادة تعيين كلمة المرور (للمدير/المشرف)
 */
function resetPassword(token, userId, targetUserId) {
  var user = requireAuth(token, userId);
  requireRole(user, ['admin', 'supervisor']);
  
  var tempPassword = 'zad' + Math.floor(Math.random() * 1000000);
  updateRow('Users', targetUserId, { passwordHash: hashPassword(tempPassword), updatedAt: new Date().toISOString() });
  logOperation(user.id, user.name, 'resetPassword', 'إعادة تعيين كلمة المرور', 'success', 'للمستخدم: ' + targetUserId);
  
  return successResponse({ success: true, tempPassword: tempPassword }, 'تم إعادة تعيين كلمة المرور. كلمة المرور المؤقتة: ' + tempPassword);
}
