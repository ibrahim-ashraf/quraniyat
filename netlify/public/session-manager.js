import { validateToken, getTokenPayload, refreshToken } from './token-service.js';
import networkService from './network-service.js';

class SessionManager {
  constructor () {
    this.sessionCheckInterval = null;
    this.lastActivity = Date.now();
    this.sessionTimeout = 30 * 60 * 1000; // 30 دقيقة
    this.tokenRefreshThreshold = 5 * 60 * 1000; // 5 دقائق
  }

  initializeSession() {
    // بدء مراقبة نشاط المستخدم
    this.setupActivityMonitoring();

    // بدء فحص الجلسة بشكل دوري
    this.startSessionCheck();

    // تخزين وقت بدء الجلسة
    sessionStorage.setItem('sessionStartTime', Date.now().toString());
  }

  setupActivityMonitoring() {
    // تحديث وقت آخر نشاط عند أي تفاعل
    const events = ['mousedown', 'keydown', 'scroll', 'touchstart'];

    events.forEach(event => {
      document.addEventListener(event, () => {
        this.updateLastActivity();
      });
    });
  }

  updateLastActivity() {
    this.lastActivity = Date.now();
    sessionStorage.setItem('lastActivity', this.lastActivity.toString());
  }

  startSessionCheck() {
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    this.sessionCheckInterval = setInterval(async () => {
      try {
        await this.checkSession();
      } catch (error) {
        console.error('خطأ في فحص الجلسة:', error);
        this.handleSessionError(error);
      }
    }, 60000); // فحص كل دقيقة
  }

  async checkSession() {
    const now = Date.now();
    const lastActivity = parseInt(sessionStorage.getItem('lastActivity')) || this.lastActivity;

    // التحقق من وقت عدم النشاط
    if (now - lastActivity > this.sessionTimeout) {
      this.endSession('تم إنهاء الجلسة بسبب عدم النشاط');
      return;
    }

    // التحقق من صلاحية التوكن
    const isValid = await validateToken();
    if (!isValid) {
      // محاولة تجديد التوكن
      const token = await refreshToken();
      if (!token) {
        this.endSession('انتهت صلاحية الجلسة');
        return;
      }
    }

    // تحديث معلومات الجلسة
    this.updateSessionMetadata();
  }

  updateSessionMetadata() {
    const payload = getTokenPayload();
    if (payload) {
      sessionStorage.setItem('userId', payload.userId);
      sessionStorage.setItem('userEmail', payload.email);
      sessionStorage.setItem('userName', payload.name);
    }
  }

  async endSession(reason = '') {
    // إيقاف فحص الجلسة
    if (this.sessionCheckInterval) {
      clearInterval(this.sessionCheckInterval);
    }

    // حذف بيانات الجلسة
    sessionStorage.clear();

    // تسجيل الخروج من الخادم
    try {
      await networkService.post('logout', {});
    } catch (error) {
      console.error('خطأ في تسجيل الخروج:', error);
    }

    // إعادة التوجيه إلى صفحة تسجيل الدخول مع رسالة
    const message = encodeURIComponent(reason || 'تم تسجيل الخروج بنجاح');
    window.location.href = `/login.html?message=${message}`;
  }

  handleSessionError(error) {
    if (error.message.includes('توكن') || error.message.includes('مصادقة')) {
      this.endSession('حدث خطأ في المصادقة');
    } else {
      console.error('خطأ غير متوقع:', error);
    }
  }

  getSessionInfo() {
    return {
      userId: sessionStorage.getItem('userId'),
      userEmail: sessionStorage.getItem('userEmail'),
      userName: sessionStorage.getItem('userName'),
      sessionStartTime: parseInt(sessionStorage.getItem('sessionStartTime')),
      lastActivity: parseInt(sessionStorage.getItem('lastActivity'))
    };
  }

  isAuthenticated() {
    return sessionStorage.getItem('userId') !== null;
  }
}

export default new SessionManager();