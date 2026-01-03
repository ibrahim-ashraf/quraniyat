import networkService from './network-service.js';
import { saveToken, removeToken } from './token-service.js';
import { validateEmail, validatePhone, formatErrorMessage } from './utils.js';
import sessionManager from './session-manager.js';

// تكوين CSRF token
function generateCSRFToken() {
  if (window.crypto && window.crypto.getRandomValues) {
    const token = new Uint8Array(32);
    window.crypto.getRandomValues(token);
    return Array.from(token, byte => byte.toString(16).padStart(2, '0')).join('');
  } else {
    // fallback لمتصفحات قديمة
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }
}

// التحقق من CSRF token
function verifyCSRFToken() {
  const storedToken = sessionStorage.getItem('csrf_token');
  const headerToken = document.querySelector('meta[name="csrf-token"]')?.content;
  return storedToken === headerToken;
}

// حماية ضد محاولات تسجيل الدخول المتكررة
const loginAttempts = {
  count: 0,
  lastAttempt: null,
  lockoutUntil: null
};

function checkLoginAttempts() {
  const now = Date.now();

  // إعادة تعيين العداد بعد ساعة
  if (loginAttempts.lastAttempt && (now - loginAttempts.lastAttempt) > 3600000) {
    loginAttempts.count = 0;
  }

  // التحقق من فترة الحظر
  if (loginAttempts.lockoutUntil && now < loginAttempts.lockoutUntil) {
    const remainingTime = Math.ceil((loginAttempts.lockoutUntil - now) / 60000);
    throw new Error(`تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد ${remainingTime} دقيقة`);
  }

  loginAttempts.count++;
  loginAttempts.lastAttempt = now;

  // تفعيل الحظر بعد 5 محاولات
  if (loginAttempts.count >= 5) {
    loginAttempts.lockoutUntil = now + 900000; // 15 دقيقة
    throw new Error('تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد 15 دقيقة');
  }
}

// إظهار رسالة خطأ
function showError(message) {
  const errorDiv = document.getElementById('error-message');
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hide');
    errorDiv.style.display = 'block';

    setTimeout(() => {
      errorDiv.classList.add('hide');
      setTimeout(() => {
        errorDiv.style.display = 'none';
        errorDiv.classList.remove('hide');
      }, 300);
    }, 5000);
  } else {
    alert(message);
  }
}

// إظهار رسالة معلوماتية
function showInfo(message) {
  const infoDiv = document.getElementById('info-message');
  if (infoDiv) {
    infoDiv.textContent = message;
    infoDiv.classList.remove('hide');
    infoDiv.style.display = 'block';

    setTimeout(() => {
      infoDiv.classList.add('hide');
      setTimeout(() => {
        infoDiv.style.display = 'none';
        infoDiv.classList.remove('hide');
      }, 300);
    }, 5000);
  }
}

// إظهار مؤشر التحميل
function showLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'flex';
  }
}

// إخفاء مؤشر التحميل
function hideLoader() {
  const loader = document.getElementById('loader');
  if (loader) {
    loader.style.display = 'none';
  }
}

// التعامل مع تسجيل الدخول بواسطة Google
async function handleGoogleSignIn(response) {
  try {
    showLoader();
    checkLoginAttempts();

    // التحقق من صحة توكن Google
    if (!response.credential) {
      throw new Error('فشل في الحصول على بيانات المصادقة من Google');
    }
    const result = await networkService.post('auth', {
      credential: response.credential
    }, false);

    // إعادة تعيين عداد محاولات تسجيل الدخول
    loginAttempts.count = 0;
    loginAttempts.lockoutUntil = null;

    if (!result.isProfileComplete) {
      // تخزين التوكن المؤقت للمستخدمين الذين لم يكملوا ملفهم الشخصي
      saveToken(result.token, true);
      // حفظ حالة المستخدم في sessionStorage
      sessionStorage.setItem('isNewUser', result.isNewUser);
      window.location.href = '/complete-profile.html';
    } else {
      // تخزين التوكن للمستخدمين الذين أكملوا ملفهم الشخصي
      saveToken(result.token);
      sessionManager.initializeSession();

      // التحقق من وجود رسالة معلوماتية في عنوان URL
      const urlParams = new URLSearchParams(window.location.search);
      const message = urlParams.get('message');
      if (message) {
        showInfo(decodeURIComponent(message));
      }

      // التوجيه إلى الصفحة المطلوبة أو الرئيسية
      const redirectUrl = sessionStorage.getItem('redirectUrl');
      window.location.href = redirectUrl || '/';
      if (redirectUrl) {
        sessionStorage.removeItem('redirectUrl');
      }
    }
  } catch (error) {
    console.error('خطأ في المصادقة:', error);
    if (error.message.includes('انتهت صلاحية التوكن المؤقت')) {
      sessionStorage.setItem('login_message', 'انتهت صلاحية الجلسة المؤقتة. يرجى تسجيل الدخول مرة أخرى لإكمال ملفك الشخصي.');
      window.location.href = '/login.html';
      return;
    }
    showError(formatErrorMessage(error));
  } finally {
    hideLoader();
  }
}

// تسجيل الخروج
async function logout() {
  try {
    showLoader();

    // إرسال طلب تسجيل الخروج للخادم
    await networkService.post('logout', {});

    // إنهاء الجلسة الحالية
    await sessionManager.endSession();

    // حذف التوكن من التخزين المحلي
    removeToken();

    // تخزين رسالة تسجيل الخروج
    sessionStorage.setItem('login_message', 'تم تسجيل الخروج بنجاح');
    // إعادة التوجيه إلى صفحة تسجيل الدخول
    window.location.href = '/login.html';
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    showError(formatErrorMessage(error));
  } finally {
    hideLoader();
  }
}

// إكمال الملف الشخصي
async function completeProfile(profileData) {
  try {
    showLoader();

    // التحقق من صحة البيانات
    if (!profileData.fullName?.trim()) {
      throw new Error('الاسم الكامل مطلوب');
    }
    if (!validatePhone(profileData.phone)) {
      throw new Error('رقم الهاتف غير صالح');
    }
    if (!['student', 'teacher'].includes(profileData.userType)) {
      throw new Error('نوع المستخدم غير صالح');
    }

    const result = await networkService.post('complete-profile', profileData);

    // تخزين التوكن الدائم
    saveToken(result.token);
    removeToken(true); // حذف التوكن المؤقت

    // بدء إدارة الجلسة
    sessionManager.initializeSession();

    return result;
  } catch (error) {
    console.error('خطأ في إكمال الملف الشخصي:', error);
    throw new Error(formatErrorMessage(error));
  } finally {
    hideLoader();
  }
}

// تحديث الملف الشخصي للمستخدم
async function updateUserProfile(profileData) {
  try {
    showLoader();

    // التحقق من صحة البيانات الأساسية
    if (!profileData.fullName?.trim()) {
      throw new Error('الاسم الكامل مطلوب');
    }
    if (!['student', 'teacher'].includes(profileData.userType)) {
      throw new Error('نوع المستخدم غير صالح');
    }

    const response = await fetch('/.netlify/functions/update-profile', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      throw new Error('فشل تحديث البيانات');
    }

    const result = await response.json();

    // تحديث التوكن إذا تم إرجاعه
    if (result.token) {
      saveToken(result.token);
      sessionManager.updateSessionMetadata();
    }

    return result;
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    throw new Error(formatErrorMessage(error));
  } finally {
    hideLoader();
  }
}

// الحصول على بيانات المستخدم الحالي
async function getCurrentUser() {
  const token = localStorage.getItem('auth_token');
  if (!token) {
    return null;
  }

  try {
    const response = await fetch('/.netlify/functions/get-profile', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      throw new Error('فشل جلب بيانات المستخدم');
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error('خطأ في جلب بيانات المستخدم:', error);
    return null;
  }
}

export {
  handleGoogleSignIn,
  logout,
  completeProfile,
  updateUserProfile,
  getCurrentUser,
  showError,
  showInfo,
  showLoader,
  hideLoader
};

// جعل handleGoogleSignIn متاحة عالمياً
window.handleGoogleSignIn = handleGoogleSignIn;