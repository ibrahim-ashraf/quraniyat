import { handleError } from './utils.js';

class ErrorService {
  constructor () {
    this.errorListeners = new Set();
    this.setupGlobalErrorHandling();
  }

  setupGlobalErrorHandling() {
    // معالجة الأخطاء غير المتوقعة
    window.onerror = (message, source, lineno, colno, error) => {
      this.handleGlobalError(error || message);
      return false;
    };

    // معالجة الوعود المرفوضة غير المعالجة
    window.onunhandledrejection = (event) => {
      this.handleGlobalError(event.reason);
      event.preventDefault();
    };

    // مراقبة حالة الاتصال بالإنترنت
    window.addEventListener('offline', () => {
      this.notifyError(new NetworkError('انقطع الاتصال بالإنترنت'));
    });
  }

  handleGlobalError(error) {
    const errorInfo = handleError(error);
    this.notifyError(errorInfo);

    // تسجيل الخطأ للتحليل
    this.logError(errorInfo);
  }

  notifyError(errorInfo) {
    this.errorListeners.forEach(listener => {
      try {
        listener(errorInfo);
      } catch (err) {
        console.error('خطأ في معالج الأخطاء:', err);
      }
    });
  }

  async logError(errorInfo) {
    try {
      const errorLog = {
        timestamp: new Date().toISOString(),
        type: errorInfo.type,
        message: errorInfo.message,
        url: window.location.href,
        userAgent: navigator.userAgent
      };

      // إرسال معلومات الخطأ إلى الخادم
      await fetch('/.netlify/functions/log-error', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(errorLog)
      });
    } catch (error) {
      console.error('فشل في تسجيل الخطأ:', error);
    }
  }

  showErrorMessage(error, options = {}) {
    const errorInfo = handleError(error);

    // إظهار رسالة الخطأ للمستخدم
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.textContent = errorInfo.message;
      errorDiv.style.display = 'block';

      if (!options.persistent) {
        setTimeout(() => {
          errorDiv.style.display = 'none';
        }, options.duration || 5000);
      }
    }

    return errorInfo;
  }

  addErrorListener(listener) {
    this.errorListeners.add(listener);
    return () => this.errorListeners.delete(listener);
  }

  clearError() {
    const errorDiv = document.getElementById('error-message');
    if (errorDiv) {
      errorDiv.style.display = 'none';
      errorDiv.textContent = '';
    }
  }

  handleApiError(error) {
    if (error.response) {
      switch (error.response.status) {
        case 401:
          // إعادة توجيه إلى صفحة تسجيل الدخول
          window.location.href = '/login.html';
          break;
        case 403:
          this.showErrorMessage('ليس لديك صلاحية للوصول إلى هذا المورد');
          break;
        case 404:
          this.showErrorMessage('المورد المطلوب غير موجود');
          break;
        case 429:
          this.showErrorMessage('تم تجاوز عدد الطلبات المسموح به. يرجى المحاولة لاحقاً');
          break;
        default:
          this.showErrorMessage('حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى');
      }
    } else if (error.request) {
      this.showErrorMessage('فشل الاتصال بالخادم. يرجى التحقق من اتصالك بالإنترنت');
    } else {
      this.showErrorMessage(error.message);
    }
  }

  // معالجة أخطاء النموذج
  handleFormErrors(errors, form) {
    errors.forEach(error => {
      const field = form.querySelector(`[name="${error.field}"]`);
      if (field) {
        field.classList.add('error');

        // إضافة رسالة الخطأ تحت الحقل
        const errorSpan = document.createElement('span');
        errorSpan.className = 'field-error';
        errorSpan.textContent = error.message;
        field.parentNode.appendChild(errorSpan);
      }
    });
  }

  // إزالة رسائل الخطأ من النموذج
  clearFormErrors(form) {
    form.querySelectorAll('.error').forEach(field => {
      field.classList.remove('error');
    });
    form.querySelectorAll('.field-error').forEach(errorSpan => {
      errorSpan.remove();
    });
  }
}

export default new ErrorService();