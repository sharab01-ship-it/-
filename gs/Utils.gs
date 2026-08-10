/**
 * Utils.gs — دوال مساعدة عامة
 */

/**
 * يولّد UUID فريد
 */
function generateUUID() {
  return Utilities.getUuid();
}

/**
 * يحوّل التاريخ إلى ISO string
 */
function toISOString(date) {
  if (!date) return new Date().toISOString();
  if (date instanceof Date) return date.toISOString();
  return new Date(date).toISOString();
}

/**
 * يحوّل صف من Google Sheets إلى كائن
 */
function rowToObject(row, columns) {
  if (!row || row.length === 0) return null;
  var obj = {};
  for (var i = 0; i < columns.length; i++) {
    obj[columns[i]] = row[i];
  }
  return obj;
}

/**
 * يحوّل كائن إلى صف للكتابة في Google Sheets
 */
function objectToRow(obj, columns) {
  return columns.map(function(col) {
    return obj[col] !== undefined && obj[col] !== null ? obj[col] : '';
  });
}

/**
 * يقرأ جميع الصفوف من ورقة ككائنات
 */
function readAllObjects(sheetName) {
  var sheet = getSheet(sheetName);
  var columns = SHEET_COLUMNS[sheetName];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var objects = [];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(data[i], columns);
    if (obj && obj.id) objects.push(obj);
  }
  return objects;
}

/**
 * يقرأ جميع الصفوف بدون شرط id
 */
function readAllRows(sheetName) {
  var sheet = getSheet(sheetName);
  var columns = SHEET_COLUMNS[sheetName];
  var data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  var objects = [];
  for (var i = 1; i < data.length; i++) {
    var obj = rowToObject(data[i], columns);
    if (obj) objects.push(obj);
  }
  return objects;
}

/**
 * يبحث عن صف بـ ID
 */
function findById(sheetName, id) {
  var objects = readAllObjects(sheetName);
  for (var i = 0; i < objects.length; i++) {
    if (objects[i].id === id) return objects[i];
  }
  return null;
}

/**
 * يبحث عن صف بحقل محدد
 */
function findByField(sheetName, field, value) {
  var objects = readAllObjects(sheetName);
  for (var i = 0; i < objects.length; i++) {
    if (objects[i][field] === value) return objects[i];
  }
  return null;
}

/**
 * يبحث عن جميع الصفوف بحقل محدد
 */
function findAllByField(sheetName, field, value) {
  var objects = readAllObjects(sheetName);
  return objects.filter(function(obj) { return obj[field] === value; });
}

/**
 * يضيف صف جديد
 */
function addRow(sheetName, obj) {
  var sheet = getSheet(sheetName);
  var columns = SHEET_COLUMNS[sheetName];
  if (!obj.id) obj.id = generateUUID();
  
  var row = objectToRow(obj, columns);
  sheet.appendRow(row);
  return obj;
}

/**
 * يحدّث صف موجود
 */
function updateRow(sheetName, id, updates) {
  var sheet = getSheet(sheetName);
  var columns = SHEET_COLUMNS[sheetName];
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      var currentObj = rowToObject(data[i], columns);
      var updated = mergeObjects(currentObj, updates);
      var newRow = objectToRow(updated, columns);
      sheet.getRange(i + 1, 1, 1, columns.length).setValues([newRow]);
      return updated;
    }
  }
  return null;
}

/**
 * يحذف صف بـ ID
 */
function deleteRow(sheetName, id) {
  var sheet = getSheet(sheetName);
  var data = sheet.getDataRange().getValues();
  
  for (var i = 1; i < data.length; i++) {
    if (data[i][0] === id) {
      sheet.deleteRow(i + 1);
      return true;
    }
  }
  return false;
}

/**
 * يدمج كائنين
 */
function mergeObjects(base, updates) {
  var result = {};
  for (var key in base) {
    result[key] = base[key];
  }
  for (var key in updates) {
    result[key] = updates[key];
  }
  return result;
}

/**
 * يهرّش كلمة المرور باستخدام SHA-256
 */
function hashPassword(password) {
  var raw = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password + 'zad_al_halaqat_salt',
    Utilities.Charset.UTF_8
  );
  return raw.map(function(b) {
    var h = (b < 0 ? b + 256 : b).toString(16);
    return h.length === 1 ? '0' + h : h;
  }).join('');
}

/**
 * يتحقق من كلمة المرور
 */
function verifyPassword(password, hash) {
  return hashPassword(password) === hash;
}

/**
 * يولّد Token عشوائي
 */
function generateToken() {
  return Utilities.getUuid() + Utilities.getUuid().replace(/-/g, '');
}

/**
 * ينشئ استجابة JSON موحدة
 */
function jsonResponse(success, data, message, code) {
  var response = {
    success: success,
    data: data || null,
    message: message || (success ? 'تمت العملية بنجاح' : 'حدث خطأ'),
    code: code || (success ? 'OK' : 'ERROR')
  };
  return ContentService.createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * ينشئ استجابة خطأ
 */
function errorResponse(message, code) {
  return jsonResponse(false, null, message, code);
}

/**
 * ينشئ استجابة نجاح
 */
function successResponse(data, message) {
  return jsonResponse(true, data, message);
}

/**
 * ينظف النص من المدخلات الضارة
 */
function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/&/g, '&amp;');
}

/**
 * ينظح كائن كامل
 */
function sanitizeObject(obj) {
  if (obj === null || obj === undefined) return obj;
  if (typeof obj === 'string') return sanitizeInput(obj);
  if (Array.isArray(obj)) return obj.map(sanitizeObject);
  if (typeof obj === 'object') {
    var result = {};
    for (var key in obj) {
      result[key] = sanitizeObject(obj[key]);
    }
    return result;
  }
  return obj;
}
