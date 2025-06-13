// تحميل عناصر الواجهة المشتركة
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
});

function loadHeader() {
  const header = document.querySelector('header');
  header.innerHTML = `
    <div class="logo-container">
      <a href="index.html">
        <img src="logo.png" alt="شعار مركز مفتاح العلوم لتعليم كلام الحي القيوم" class="logo">
      </a>
    </div>

    <nav>
      <ul>
        <li><a href="index.html" class="nav-item">الرئيسية</a></li>
        <li><a href="register.html" class="nav-item">تسجيل الأطفال</a></li>
        <li><a href="regulations.html" class="nav-item">اللوائح التنظيمية</a></li>
        <li><a href="contact.html" class="nav-item">اتصل بنا</a></li>
      </ul>
    </nav>
  `;
}

function loadFooter() {
  const footer = document.querySelector('footer');
  footer.innerHTML = `
    <p>© ${new Date().getFullYear()} مركز مفتاح العلوم لتعليم كلام الحي القيوم. جميع الحقوق محفوظة.</p>
    <ul>
      <li><a href="regulations.html">اللوائح التنظيمية</a></li>
    </ul>
  `;
}

// دالة للحصول على العام الدراسي الحالي
function getCurrentAcademicYear() {
  const currentDate = new Date();
  const currentYear = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // إذا كان الشهر قبل سبتمبر، العام الدراسي يبدأ في العام السابق
  return month < 9 ? `${currentYear - 1}-${currentYear}` : `${currentYear}-${currentYear + 1}`;
}