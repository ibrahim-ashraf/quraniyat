import { NetworkService } from './network-service.js';
import { TokenService } from './token-service.js';
import { ErrorService } from './error-service.js';

const PRICE_PER_SESSION = 35;
const DISCOUNT_RATES = {
  1: 0,    // لا خصم لطفل واحد
  2: 10,   // خصم 10% لكل طفل عند تسجيل طفلين
  3: 15,   // خصم 15% لكل طفل عند تسجيل 3 أطفال
  4: 25    // خصم 25% لكل طفل عند تسجيل 4 أطفال أو أكثر
};

document.addEventListener('DOMContentLoaded', async () => {
  const form = document.getElementById('update-profile-form');
  const userTypeSelect = document.getElementById('userType');
  const teacherFields = document.getElementById('teacher-fields');
  const studentFields = document.getElementById('student-fields');
  const guardianInfo = document.getElementById('guardian-info');
  const relationshipType = document.getElementById('relationshipType');
  const otherRelationship = document.getElementById('otherRelationship');
  const studentBirthdate = document.getElementById('student-birthdate');
  const preferredContactSelect = document.getElementById('preferred-contact');
  const childrenCountInput = document.getElementById('childrenCount');
  const sessionsPerMonthInput = document.getElementById('sessionsPerMonth');

  try {
    // جلب بيانات المستخدم الحالية
    const response = await NetworkService.get('/get-profile');
    if (response.ok) {
      const userData = await response.json();
      populateForm(userData);
    }
  } catch (error) {
    ErrorService.handleError(error);
  }

  // التعامل مع تغيير نوع المستخدم
  userTypeSelect.addEventListener('change', () => {
    const selectedType = userTypeSelect.value;
    teacherFields.style.display = selectedType === 'teacher' ? 'block' : 'none';
    studentFields.style.display = selectedType === 'student' ? 'block' : 'none';

    // إظهار/إخفاء تفاصيل الدراسة والتكلفة للطالب
    const studyDetails = document.getElementById('study-details');
    if (studyDetails) {
      studyDetails.style.display = selectedType === 'student' ? 'block' : 'none';
    }

    // إعادة تعيين الحقول عند تغيير نوع المستخدم
    if (selectedType === 'teacher') {
      document.getElementById('nationalId').required = true;
      if (document.getElementById('sessionsPerMonth')) {
        document.getElementById('sessionsPerMonth').required = false;
      }
    } else if (selectedType === 'student') {
      document.getElementById('nationalId').required = false;
      if (document.getElementById('sessionsPerMonth')) {
        document.getElementById('sessionsPerMonth').required = true;
      }
      if (studentBirthdate) {
        studentBirthdate.dispatchEvent(new Event('change')); // للتحقق من العمر وإظهار معلومات ولي الأمر إذا لزم الأمر
      }
    }
  });

  // التعامل مع تغيير طريقة التواصل المفضلة
  preferredContactSelect.addEventListener('change', () => {
    updateContactDetails(preferredContactSelect.value);
  });

  // التعامل مع تغيير صلة القرابة
  relationshipType?.addEventListener('change', () => {
    if (otherRelationship) {
      otherRelationship.style.display = relationshipType.value === 'other' ? 'block' : 'none';
    }
  });

  // التحقق من عمر الطالب وإظهار معلومات ولي الأمر
  studentBirthdate?.addEventListener('change', () => {
    const birthDate = new Date(studentBirthdate.value);
    const today = new Date();
    const age = today.getFullYear() - birthDate.getFullYear();
    if (guardianInfo) {
      guardianInfo.style.display = age < 18 ? 'block' : 'none';
    }
  });

  // تحديث حسابات التكلفة عند تغيير عدد الأطفال أو عدد الحصص
  childrenCountInput?.addEventListener('input', updateCostCalculation);
  sessionsPerMonthInput?.addEventListener('input', updateCostCalculation);

  // معالجة تقديم النموذج
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());

    // تجميع معلومات التواصل
    data.contactInfo = {
      method: formData.get('preferred-contact'),
      details: getContactDetails(formData)
    };

    // حساب التكلفة النهائية للطالب
    if (data.userType === 'student') {
      data.study = {
        sessionsPerMonth: parseInt(formData.get('sessionsPerMonth')),
        childrenCount: parseInt(formData.get('childrenCount')) || 1,
        baseCost: parseInt(document.getElementById('base-cost').textContent),
        finalCost: parseInt(document.getElementById('final-cost').textContent),
        discountPercentage: parseInt(document.getElementById('discount-percentage')?.textContent || '0')
      };
    }

    try {
      const response = await NetworkService.put('/update-profile', data);
      if (response.ok) {
        alert('تم تحديث الملف الشخصي بنجاح');
        location.reload();
      }
    } catch (error) {
      ErrorService.handleError(error);
    }
  });
});

function updateContactDetails(method) {
  const contactDetailsDiv = document.getElementById('contact-details');
  const currentEmail = document.getElementById('account-email').value;

  let html = '';

  switch (method) {
    case 'email':
      html = `
        <div class="contact-email-group">
          <label for="contact-email">البريد الإلكتروني للتواصل:</label>
          <input type="email" id="contact-email" name="contact-email" required>
          <div class="checkbox-group">
            <label>
              <input type="checkbox" id="use-account-email" name="use-account-email">
              استخدام نفس البريد الإلكتروني المرتبط بالحساب
            </label>
          </div>
        </div>
      `;
      break;
    case 'phone':
      html = `
        <div class="contact-phone-group">
          <label for="contact-phone">رقم الهاتف:</label>
          <input type="tel" id="contact-phone" name="contact-phone" required>
          <div class="checkbox-group">
            <label><input type="checkbox" name="phone-methods" value="calls"> المكالمات الهاتفية</label>
            <label><input type="checkbox" name="phone-methods" value="whatsapp"> واتساب</label>
            <label><input type="checkbox" name="phone-methods" value="telegram"> تيليجرام</label>
          </div>
        </div>
      `;
      break;
    case 'messenger':
      html = `
        <div class="contact-messenger-group">
          <label for="facebook-profile">رابط الملف الشخصي على فيسبوك:</label>
          <input type="url" id="facebook-profile" name="facebook-profile" required>
          <small><a href="#" onclick="showProfileLinkHelp()">كيف أحصل على رابط ملفي الشخصي؟</a></small>
        </div>
      `;
      break;
    case 'other':
      html = `
        <div class="contact-other-group">
          <label for="other-contact-method">اقترح طريقة التواصل:</label>
          <textarea id="other-contact-method" name="other-contact-method" rows="3" required
            placeholder="يرجى وصف طريقة التواصل المفضلة لديك بالتفصيل"></textarea>
        </div>
      `;
      break;
    default:
      html = '';
  }

  contactDetailsDiv.innerHTML = html;

  // تهيئة السلوكيات الخاصة
  if (method === 'email') {
    const useAccountEmailCheckbox = document.getElementById('use-account-email');
    const contactEmailInput = document.getElementById('contact-email');

    useAccountEmailCheckbox.addEventListener('change', (e) => {
      if (e.target.checked) {
        contactEmailInput.value = currentEmail;
        contactEmailInput.readOnly = true;
      } else {
        contactEmailInput.value = '';
        contactEmailInput.readOnly = false;
      }
    });
  } else if (method === 'phone') {
    // تهيئة intl-tel-input
    const phoneInput = document.getElementById('contact-phone');
    if (phoneInput && window.intlTelInput) {
      window.intlTelInput(phoneInput, {
        preferredCountries: ['eg', 'sa', 'ae', 'kw', 'bh', 'om', 'qa'],
        separateDialCode: true,
        utilsScript: "https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/utils.js"
      });
    }
  }
}

function getContactDetails(formData) {
  const method = formData.get('preferred-contact');
  const details = {};

  switch (method) {
    case 'email':
      details.email = formData.get('contact-email');
      details.useAccountEmail = formData.get('use-account-email') === 'on';
      break;
    case 'phone':
      details.phone = formData.get('contact-phone');
      details.methods = Array.from(document.querySelectorAll('input[name="phone-methods"]:checked'))
        .map(checkbox => checkbox.value);
      break;
    case 'messenger':
      details.facebookProfile = formData.get('facebook-profile');
      break;
    case 'other':
      details.description = formData.get('other-contact-method');
      break;
  }

  return details;
}

function updateCostCalculation() {
  const sessionsPerMonth = parseInt(document.getElementById('sessionsPerMonth').value) || 0;
  const childrenCount = parseInt(document.getElementById('childrenCount').value) || 1;

  const baseCost = PRICE_PER_SESSION * sessionsPerMonth;
  document.getElementById('monthly-sessions').textContent = sessionsPerMonth;
  document.getElementById('base-cost').textContent = baseCost;

  // حساب نسبة الخصم بناءً على عدد الأطفال
  const discountRate = DISCOUNT_RATES[Math.min(childrenCount, 4)];
  const discountInfo = document.getElementById('discount-info');

  if (discountRate > 0) {
    const discountAmount = (baseCost * (discountRate / 100));
    const finalCost = baseCost - discountAmount;

    document.getElementById('discount-percentage').textContent = discountRate;
    document.getElementById('discount-amount').textContent = discountAmount;
    document.getElementById('final-cost').textContent = finalCost;
    discountInfo.style.display = 'block';
  } else {
    document.getElementById('final-cost').textContent = baseCost;
    discountInfo.style.display = 'none';
  }
}

function populateForm(userData) {
  const form = document.getElementById('update-profile-form');

  // تعبئة الحقول الأساسية
  Object.keys(userData).forEach(key => {
    const element = form.elements[key];
    if (element) {
      if (element.type === 'checkbox') {
        element.checked = userData[key];
      } else {
        element.value = userData[key];
      }
    }
  });

  // تعبئة طريقة التواصل المفضلة
  if (userData.contactInfo) {
    const preferredContactSelect = document.getElementById('preferred-contact');
    preferredContactSelect.value = userData.contactInfo.method;
    updateContactDetails(userData.contactInfo.method);

    // تعبئة تفاصيل التواصل
    setTimeout(() => {
      const details = userData.contactInfo.details;
      switch (userData.contactInfo.method) {
        case 'email':
          document.getElementById('contact-email').value = details.email;
          document.getElementById('use-account-email').checked = details.useAccountEmail;
          break;
        case 'phone':
          const phoneInput = document.getElementById('contact-phone');
          if (phoneInput) {
            phoneInput.value = details.phone;
            details.methods?.forEach(method => {
              const checkbox = document.querySelector(`input[name="phone-methods"][value="${method}"]`);
              if (checkbox) checkbox.checked = true;
            });
          }
          break;
        case 'messenger':
          document.getElementById('facebook-profile').value = details.facebookProfile;
          break;
        case 'other':
          document.getElementById('other-contact-method').value = details.description;
          break;
      }
    }, 100);
  }

  // تهيئة الحقول المناسبة بناءً على نوع المستخدم
  const userTypeEvent = new Event('change');
  document.getElementById('userType').dispatchEvent(userTypeEvent);

  // تحديث التكلفة إذا كان طالباً
  if (userData.userType === 'student' && userData.study) {
    document.getElementById('sessionsPerMonth').value = userData.study.sessionsPerMonth;
    document.getElementById('childrenCount').value = userData.study.childrenCount;
    updateCostCalculation();
  }

  // التحقق من عمر الطالب وإظهار معلومات ولي الأمر إذا كان قاصراً
  if (userData.userType === 'student' && userData.birthDate) {
    const birthdateEvent = new Event('change');
    document.getElementById('student-birthdate').dispatchEvent(birthdateEvent);
  }
}