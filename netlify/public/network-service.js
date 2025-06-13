import { retry } from './utils.js';
import errorService from './error-service.js';

class NetworkService {
  constructor () {
    this.baseUrl = '/.netlify/functions';
    this.defaultTimeout = 30000; // 30 ثانية
    this.retryConfig = {
      maxRetries: 3,
      delay: 1000,
      backoff: 2
    };
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}/${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.defaultTimeout);

    try {
      // إضافة ترويسات الأمان
      const headers = {
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      };

      // إضافة توكن المصادقة إذا كان موجوداً
      const token = sessionStorage.getItem('temp_token') || localStorage.getItem('auth_token');
      if (token && !options.isRefreshRequest) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      // إضافة توكن CSRF للطلبات غير الآمنة
      if (options.method !== 'GET') {
        const csrfToken = sessionStorage.getItem('csrf_token');
        if (csrfToken) {
          headers['X-CSRF-Token'] = csrfToken;
        }
      }

      const response = await retry(
        async () => {
          const res = await fetch(url, {
            ...options,
            headers: { ...headers, ...options.headers },
            signal: controller.signal
          });

          if (!res.ok) {
            const error = await res.json();
            throw new Error(error.message || 'حدث خطأ في الطلب');
          }

          return res.json();
        },
        this.retryConfig
      );

      return response;
    } catch (error) {
      if (error.name === 'AbortError') {
        throw new Error('انتهت مهلة الطلب');
      }

      if (error.message?.includes('401')) {
        if (!options.isRefreshRequest && await this.handleUnauthorized()) {
          return this.request(endpoint, options);
        }
        window.location.href = '/login.html';
      }

      throw error;
    } finally {
      clearTimeout(timeoutId);
    }
  }

  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  async post(endpoint, data, requiresAuth = true) {
    const options = {
      method: 'POST',
      body: JSON.stringify(data)
    };

    if (!requiresAuth) {
      return this.request(endpoint, options);
    }

    try {
      return await this.request(endpoint, options);
    } catch (error) {
      if (error.message?.includes('401')) {
        window.location.href = '/login.html';
      }
      throw error;
    }
  }

  async handleUnauthorized() {
    try {
      const response = await this.request('refresh-token', {
        method: 'POST',
        isRefreshRequest: true
      });

      if (response.token) {
        localStorage.setItem('auth_token', response.token);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }
}

export default new NetworkService();