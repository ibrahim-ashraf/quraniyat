import { validateToken, getTokenPayload } from './token-service.js';

class AuthGuard {
  constructor () {
    this.protectedPaths = [
      '/profile.html',
      '/complete-profile.html'
    ];
    this.publicPaths = [
      '/login.html',
      '/register.html',
      '/index.html',
      '/',
      '/educational-paths.html',
      '/contact-us.html',
      '/privacy-policy.html'
    ];

    this.init();
  }

  init() {
    // تحقق من حالة المصادقة عند تحميل الصفحة
    document.addEventListener('DOMContentLoaded', () => this.checkAuth());

    // مراقبة تغييرات المسار
    window.addEventListener('popstate', () => this.checkAuth());
  }

  async checkAuth() {
    const currentPath = window.location.pathname;
    const isProtectedPath = this.protectedPaths.includes(currentPath);
    const isPublicPath = this.publicPaths.includes(currentPath);

    try {
      const isAuthenticated = await validateToken();

      if (isProtectedPath && !isAuthenticated) {
        sessionStorage.setItem('redirectUrl', currentPath);
        window.location.href = '/login.html';
        return;
      }

      if (currentPath === '/login.html' && isAuthenticated) {
        const redirectUrl = sessionStorage.getItem('redirectUrl') || '/';
        sessionStorage.removeItem('redirectUrl');
        window.location.href = redirectUrl;
        return;
      }

      // التحقق من اكتمال الملف الشخصي
      if (isAuthenticated) {
        const payload = getTokenPayload();
        // التأكد من أن المستخدم الجديد يتم توجيهه لصفحة استكمال الملف الشخصي
        if (payload?.isTemporary && currentPath !== '/complete-profile.html') {
          console.log('توجيه المستخدم الجديد لاستكمال الملف الشخصي');
          sessionStorage.setItem('isNewUser', 'true');
          window.location.href = '/complete-profile.html';
          return;
        }
      }

      this.updateUI(isAuthenticated);
    } catch (error) {
      console.error('خطأ في التحقق من المصادقة:', error);
      if (isProtectedPath) {
        window.location.href = '/login.html';
      }
    }
  }

  updateUI(isAuthenticated) {
    document.body.classList.toggle('authenticated', isAuthenticated);

    const userMenu = document.querySelector('.user-menu');
    const loginLink = document.querySelector('.login-link');
    const logoutLink = document.querySelector('.logout-link');

    if (isAuthenticated) {
      const payload = getTokenPayload();
      if (payload) {
        const userNameElement = document.querySelector('.user-name');
        if (userNameElement) {
          userNameElement.textContent = payload.name;
        }
      }

      if (userMenu) userMenu.style.display = 'block';
      if (loginLink) loginLink.style.display = 'none';
      if (logoutLink) logoutLink.style.display = 'block';
    } else {
      if (userMenu) userMenu.style.display = 'none';
      if (loginLink) loginLink.style.display = 'block';
      if (logoutLink) logoutLink.style.display = 'none';
    }
  }

  static redirectToLogin(returnUrl) {
    if (returnUrl) {
      sessionStorage.setItem('redirectUrl', returnUrl);
    }
    window.location.href = '/login.html';
  }
}

export default new AuthGuard();