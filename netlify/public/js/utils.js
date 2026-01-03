import errorService from './error-service.js';

// التحقق من حالة المصادقة
function isAuthenticated() {
  const token = localStorage.getItem('auth_token');
  return !!token;
}

// استخراج معلومات المستخدم من التوكن
function getUserInfo() {
  const token = localStorage.getItem('auth_token');
  if (!token) return null;

  try {
    // تقسيم التوكن واستخراج البيانات منه
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(window.atob(base64));
    return payload;
  } catch (error) {
    console.error('خطأ في استخراج معلومات المستخدم:', error);
    return null;
  }
}

// إضافة رأس المصادقة للطلبات
function getAuthHeaders() {
  const token = localStorage.getItem('auth_token');
  return token ? {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  } : {
    'Content-Type': 'application/json'
  };
}

// التحقق من صلاحية التوكن
async function validateToken() {
  const token = localStorage.getItem('auth_token');
  if (!token) return false;

  try {
    const response = await fetch('/.netlify/functions/verify-token', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    return response.ok;
  } catch (error) {
    console.error('خطأ في التحقق من التوكن:', error);
    return false;
  }
}

// تنسيق التاريخ بالعربية
function formatDate(date) {
  if (!date) return '';

  const options = {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  };

  return new Date(date).toLocaleDateString('ar-SA', options);
}

// التحقق من صحة البريد الإلكتروني
export function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// التحقق من صحة رقم الهاتف
export function validatePhone(phone) {
  // يدعم الأرقام الدولية مع رمز الدولة
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// تنسيق رسائل الخطأ
export function formatErrorMessage(error) {
  const errorMap = {
    'auth/invalid-email': 'البريد الإلكتروني غير صالح',
    'auth/user-disabled': 'تم تعطيل هذا الحساب',
    'auth/user-not-found': 'لم يتم العثور على المستخدم',
    'auth/wrong-password': 'كلمة المرور غير صحيحة',
    'auth/email-already-in-use': 'البريد الإلكتروني مستخدم بالفعل',
    'auth/weak-password': 'كلمة المرور ضعيفة جداً',
    'auth/invalid-verification-code': 'رمز التحقق غير صالح',
    'auth/code-expired': 'انتهت صلاحية رمز التحقق',
    'auth/too-many-requests': 'تم تجاوز عدد المحاولات المسموح بها، يرجى المحاولة لاحقاً',
    'auth/network-request-failed': 'فشل الاتصال بالشبكة، يرجى التحقق من اتصالك بالإنترنت',
    'network-error': 'حدث خطأ في الاتصال بالخادم',
    'server-error': 'حدث خطأ في الخادم',
    'validation-error': 'البيانات المدخلة غير صالحة'
  };
  if (typeof error === 'string') {
    return errorMap[error] || error;
  }

  return error.message || 'حدث خطأ غير متوقع';
}

/**
 * تهيئة خدمات تحديد الموقع باستخدام Google Geocoding API
 */
export async function initializeLocationServices() {
  const locationButton = document.getElementById('get-location');
  const locationInput = document.getElementById('location');

  if (!locationButton || !locationInput) return;

  locationButton.addEventListener('click', async () => {
    try {
      if (!navigator.geolocation) {
        throw new Error('خدمة تحديد الموقع غير متوفرة في متصفحك');
      }

      locationButton.disabled = true;
      locationButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري تحديد موقعك...';

      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(pos => resolve(pos),
          err => {
            switch (err.code) {
              case err.PERMISSION_DENIED:
                reject(new Error("تم رفض إذن الوصول إلى الموقع."));
                break;
              case err.POSITION_UNAVAILABLE:
                reject(new Error("معلومات الموقع غير متاحة."));
                break;
              case err.TIMEOUT:
                reject(new Error("انتهت مهلة الحصول على الموقع."));
                break;
              default:
                reject(new Error("حدث خطأ غير معروف أثناء تحديد الموقع."));
            }
          },
          {
            // enableHighAccuracy: true,
            // timeout: 10000,
            // maximumAge: 0
          });
      });

      const { latitude, longitude } = position.coords;

      // استخدام Google Geocoding API
      // const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${config.GOOGLE_API_KEY}`;
      const geocodingUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=AIzaSyCVmRoMuxDyubg_VAiRCIIpWuZIcH-qzws`;
      console.log('Geocoding URL:', geocodingUrl);
      const response = await fetch(geocodingUrl);
      const data = await response.json();

      if (data.status !== 'OK') {
        throw new Error('لم نتمكن من تحديد عنوانك. يرجى إدخال العنوان يدوياً.');
      }

      // الحصول على العنوان المنسق
      const result = data.results[0];
      if (result) {
        locationInput.value = result.formatted_address;
      } else {
        throw new Error('لم نتمكن من تحديد عنوانك. يرجى إدخال العنوان يدوياً.');
      }

    } catch (error) {
      console.error('خطأ في تحديد الموقع:', error);
      errorService.showErrorMessage('تعذر تحديد موقعك. يرجى إدخال العنوان يدوياً.');
    } finally {
      locationButton.disabled = false;
      locationButton.innerHTML = '<i class="fas fa-map-marker-alt"></i> تحديد الموقع';
    }
  });
}

// جلب معلومات المستخدم من التوكن
export function getUserInfoFromToken(token) {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      userId: payload.userId,
      email: payload.email,
      name: payload.name,
      userType: payload.userType
    };
  } catch (error) {
    console.error('خطأ في استخراج معلومات المستخدم من التوكن:', error);
    return null;
  }
}

// إنشاء معرف فريد
export function generateUniqueId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// تأخير مؤقت
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// إرسال طلب مع محاولات إعادة في حالة الفشل
export async function fetchWithRetry(url, options, maxRetries = 3) {
  let lastError;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await fetch(url, options);
      if (!response.ok) {
        throw new Error(`فشل الطلب: ${response.status}`);
      }
      return response;
    } catch (error) {
      lastError = error;
      if (i < maxRetries - 1) {
        // انتظار قبل المحاولة التالية (مع زيادة وقت الانتظار مع كل محاولة)
        await delay(Math.pow(2, i) * 1000);
      }
    }
  }

  throw lastError;
}

// تحويل حجم الملف إلى صيغة مقروءة
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// التحقق من أن المستخدم متصل بالإنترنت
export function isOnline() {
  return navigator.onLine;
}

// الاستماع لتغييرات حالة الاتصال
export function listenToConnectionChanges(onOnline, onOffline) {
  window.addEventListener('online', onOnline);
  window.addEventListener('offline', onOffline);

  return () => {
    window.removeEventListener('online', onOnline);
    window.removeEventListener('offline', onOffline);
  };
}

// إنشاء نص عشوائي
export function generateRandomString(length = 10) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// التحقق من قوة كلمة المرور
export function validatePassword(password) {
  const minLength = 8;
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const errors = [];
  if (password.length < minLength) {
    errors.push('يجب أن تحتوي كلمة المرور على 8 أحرف على الأقل');
  }
  if (!hasUpperCase) {
    errors.push('يجب أن تحتوي على حرف كبير واحد على الأقل');
  }
  if (!hasLowerCase) {
    errors.push('يجب أن تحتوي على حرف صغير واحد على الأقل');
  }
  if (!hasNumbers) {
    errors.push('يجب أن تحتوي على رقم واحد على الأقل');
  }
  if (!hasSpecialChar) {
    errors.push('يجب أن تحتوي على رمز خاص واحد على الأقل');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

// معالجة الأخطاء بشكل موحد
export function handleError(error, defaultMessage = 'حدث خطأ غير متوقع') {
  console.error('Error:', error);

  if (error instanceof NetworkError) {
    return {
      type: 'network',
      message: 'حدث خطأ في الاتصال بالشبكة. يرجى التحقق من اتصالك بالإنترنت'
    };
  }

  if (error instanceof ValidationError) {
    return {
      type: 'validation',
      message: error.message,
      errors: error.errors
    };
  }

  if (error instanceof AuthError) {
    return {
      type: 'auth',
      message: formatErrorMessage(error)
    };
  }

  return {
    type: 'unknown',
    message: defaultMessage
  };
}

// فئات مخصصة للأخطاء
export class NetworkError extends Error {
  constructor (message) {
    super(message);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends Error {
  constructor (message, errors = []) {
    super(message);
    this.name = 'ValidationError';
    this.errors = errors;
  }
}

export class AuthError extends Error {
  constructor (message, code) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// التحقق من اتصال الإنترنت
export function checkInternetConnection() {
  return window.navigator.onLine;
}

// إعادة المحاولة عند فشل العملية
export async function retry(fn, retries = 3, delay = 1000) {
  try {
    return await fn();
  } catch (error) {
    if (retries === 0) throw error;
    await new Promise(resolve => setTimeout(resolve, delay));
    return retry(fn, retries - 1, delay * 2);
  }
}

// تنظيف وتحقق من المدخلات
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input.trim()
    .replace(/[<>]/g, '') // منع XSS البسيط
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"');
}

// تصدير الوظائف
export {
  isAuthenticated,
  getUserInfo,
  getAuthHeaders,
  validateToken,
  formatDate
};