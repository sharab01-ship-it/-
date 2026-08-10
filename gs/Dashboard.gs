/**
 * Dashboard.gs — لوحة التحكم
 */

/**
 * يحصل على بيانات لوحة التحكم
 */
function getDashboard(token, userId) {
  var user = requireAuth(token, userId);

  var users = readAllObjects('Users');
  var hadiths = readAllObjects('Hadiths');
  var courses = readAllObjects('Courses');
  var certificates = readAllObjects('Certificates');
  var notifications = readAllObjects('Notifications');
  var messages = readAllObjects('Messages');
  var logs = readAllObjects('Logs');

  var students = users.filter(function(u) { return u.role === 'student'; });
  var supervisors = users.filter(function(u) { return u.role === 'supervisor'; });
  var admins = users.filter(function(u) { return u.role === 'admin'; });
  var pendingStudents = students.filter(function(s) { return s.status === 'pending'; });
  var approvedStudents = students.filter(function(s) { return s.status === 'approved'; });
  var rejectedStudents = students.filter(function(s) { return s.status === 'rejected'; });
  var suspendedStudents = students.filter(function(s) { return s.status === 'suspended'; });
  var activeCourses = courses.filter(function(c) {
    return c.isActive === true || c.isActive === 'TRUE' || c.isActive === 'true';
  });

  var unreadNotifications = notifications.filter(function(n) {
    return n.targetUserId === user.id || n.targetRole === 'all' || n.targetRole === user.role;
  }).filter(function(n) { return !n.read || n.read === 'FALSE' || n.read === 'false'; });

  var unreadMessages = messages.filter(function(m) {
    return m.receiverId === user.id && (!m.read || m.read === 'FALSE' || m.read === 'false');
  });

  var recentActivity = logs.sort(function(a, b) {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  }).slice(0, 20);

  var stats = {
    totalStudents: students.length,
    pendingStudents: pendingStudents.length,
    approvedStudents: approvedStudents.length,
    rejectedStudents: rejectedStudents.length,
    suspendedStudents: suspendedStudents.length,
    totalSupervisors: supervisors.length,
    totalAdmins: admins.length,
    totalHadiths: hadiths.length,
    activeCourses: activeCourses.length,
    issuedCertificates: certificates.length,
    unreadNotifications: unreadNotifications.length,
    unreadMessages: unreadMessages.length
  };

  return successResponse({ stats: stats, recentActivity: recentActivity });
}
