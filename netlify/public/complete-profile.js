import { getCurrentUser } from './auth.js';
import { handleError } from './utils.js';

// دالة تهيئة الصفحة
document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = '/login.html';
      return;
    }

    // تحديث معلومات المستخدم
    document.getElementById('user-email').textContent = user.email;
    document.getElementById('user-name').textContent = user.name || 'لم يتم تحديد الاسم';

    // إضافة معلومات المستخدم لروابط التسجيل
    const registrationLinks = document.querySelectorAll('.registration-option');
    registrationLinks.forEach(link => {
      const url = new URL(link.href, window.location.origin);
      url.searchParams.set('email', user.email);
      url.searchParams.set('name', user.name || '');
      link.href = url.toString();
    });
  } catch (error) {
    handleError(error);
  }
});