// تحميل قائمة التنقل
fetch('nav.html')
  .then(response => response.text())
  .then(data => {
    document.getElementById('nav-container').innerHTML = data;
    updateAuthUI();
    initializeUserMenu();
  })
  .catch(error => console.error('Error loading navigation:', error));

// تهيئة القائمة المنسدلة للمستخدم
function initializeUserMenu() {
  const userMenu = document.querySelector('.user-menu');
  const userMenuButton = document.querySelector('.user-menu-button');
  const userDropdown = document.querySelector('.user-dropdown');

  if (userMenu && userMenuButton && userDropdown) {
    // فتح/إغلاق القائمة المنسدلة عند النقر
    userMenuButton.addEventListener('click', (e) => {
      e.stopPropagation();
      userDropdown.style.display = userDropdown.style.display === 'block' ? 'none' : 'block';
    });

    // إغلاق القائمة المنسدلة عند النقر خارجها
    document.addEventListener('click', (e) => {
      if (!userMenu.contains(e.target)) {
        userDropdown.style.display = 'none';
      }
    });
  }
}

// تحديث واجهة المستخدم بناءً على حالة تسجيل الدخول
async function updateAuthUI() {
  const token = localStorage.getItem('auth_token');
  const body = document.body;
  const userMenu = document.querySelector('.user-menu');
  const loginLink = document.querySelector('.login-link');
  const userAvatar = document.querySelector('.user-avatar');
  const userName = document.querySelector('.user-name');

  if (token) {
    try {
      const response = await fetch('/.netlify/functions/verify-token', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      if (data.user) {
        // تحديث واجهة المستخدم للحالة المسجلة
        body.classList.add('authenticated');
        userMenu.style.display = 'inline-block';
        loginLink.style.display = 'none';

        // تحديث معلومات المستخدم
        userName.textContent = data.user.name;
        if (data.user.picture) {
          userAvatar.src = data.user.picture;
          userAvatar.alt = data.user.name;
        }

        // إظهار العناصر المخصصة للمستخدمين المسجلين
        document.querySelectorAll('.auth-required').forEach(el => {
          el.style.display = 'block';
        });
      } else {
        handleUnauthenticated();
      }
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      handleUnauthenticated();
    }
  } else {
    handleUnauthenticated();
  }
}

// معالجة حالة عدم تسجيل الدخول
function handleUnauthenticated() {
  const body = document.body;
  const userMenu = document.querySelector('.user-menu');
  const loginLink = document.querySelector('.login-link');

  body.classList.remove('authenticated');
  userMenu.style.display = 'none';
  loginLink.style.display = 'inline-block';

  // إخفاء العناصر المخصصة للمستخدمين المسجلين
  document.querySelectorAll('.auth-required').forEach(el => {
    el.style.display = 'none';
  });

  // حذف التوكن من التخزين
  localStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_token');
}