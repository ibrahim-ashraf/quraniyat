import { getCurrentUser, updateUserProfile } from './auth.js';
import { handleError } from './utils.js';
import config from './config.js';
import networkService from './network-service.js';
import errorService from './error-service.js';
import { initializeLocationServices } from './utils.js';

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // استرجاع معلومات المستخدم من URL
    const params = new URLSearchParams(window.location.search);
    const userEmail = params.get('email');
    const userName = params.get('name');

    // ملء معلومات المستخدم
    if (userName) {
      document.getElementById('fullName').value = userName;
    }
    if (userEmail) {
      document.getElementById('contact-email').value = userEmail;
      document.getElementById('use-account-email').checked = true;
    }

    // إضافة التحقق من تاريخ الميلاد
    const birthdateInput = document.getElementById('birthdate');
    const today = new Date();
    const maxDate = new Date();
    maxDate.setFullYear(today.getFullYear() - 18);

    birthdateInput.max = maxDate.toISOString().split('T')[0];

    const note = birthdateInput.nextElementSibling;
    note.textContent = 'يجب أن يكون عمرك 18 سنة أو أكثر للتسجيل كمعلم';

    // تحميل قائمة الدول
    const response = await fetch('countries.json');
    const countries = await response.json();
    const countrySelect = document.getElementById('country');

    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code;
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });

    // تحديد الدولة تلقائياً
    const userCountry = await getUserCountry();
    if (userCountry) {
      countrySelect.value = userCountry;
      countrySelect.disabled = true;

      // تهيئة intl-tel-input
      const phoneInput = document.getElementById('contact-phone');
      const iti = window.intlTelInput(phoneInput, {
        initialCountry: userCountry,
        onlyCountries: [userCountry],
        separateDialCode: true,
        utilsScript: "https://cdnjs.cloudflare.com/ajax/libs/intl-tel-input/17.0.8/js/utils.js",
      });
    }

    // إعداد قائمة التخصصات والأقسام
    const specialtySelect = document.getElementById('specialty');
    const departmentSelect = document.getElementById('department');
    const otherDepartmentDiv = document.getElementById('other-department-div');

    // إضافة خيار القرآن الكريم فقط
    specialtySelect.innerHTML = `
      <option value="">اختر التخصص</option>
      <option value="quran">القرآن الكريم</option>
    `;

    // تحديث الأقسام عند اختيار التخصص
    specialtySelect.addEventListener('change', () => {
      if (specialtySelect.value === 'quran') {
        departmentSelect.innerHTML = `
          <option value="">اختر القسم</option>
          <option value="hafs">رواية حفص عن عاصم</option>
          <option value="shuaba">قراءة عاصم براوييه</option>
          <option value="other">أخرى</option>
        `;
        departmentSelect.style.display = 'block';
      }
    });

    // إظهار حقل الإدخال عند اختيار "أخرى"
    departmentSelect.addEventListener('change', () => {
      otherDepartmentDiv.style.display =
        departmentSelect.value === 'other' ? 'block' : 'none';
    });

    // Set the account email
    const accountEmailInput = document.getElementById('account-email');
    accountEmailInput.value = user.email;

    // Welcome message
    document.getElementById('welcome-message').textContent = `مرحباً ${user.email}`;

    // Initialize form submission
    document.getElementById('teacher-registration-form').addEventListener('submit', handleSubmit);

    // Initialize national ID input handler
    document.getElementById('nationalId').addEventListener('input', handleNationalIdInput);
  } catch (error) {
    handleError(error);
  }
});

async function loadCountries() {
  try {
    const countrySelect = document.getElementById('country');
    const response = await fetch('countries.json');
    const countries = await response.json();

    countries.sort((a, b) => a.name.localeCompare(b.name));
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code.toLowerCase();
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });
  } catch (error) {
    handleError('حدث خطأ في تحميل قائمة الدول: ' + error.message);
  }
}

function initializeDateFields() {
  const today = new Date();
  const minDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maxDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  const birthDateInput = document.getElementById('teacher-birthdate');
  if (birthDateInput) {
    birthDateInput.min = minDate.toISOString().split('T')[0];
    birthDateInput.max = maxDate.toISOString().split('T')[0];
  }
}

function handleNationalIdInput() {
  const nationalId = document.getElementById('nationalId').value;
  const cleanedValue = nationalId.replace(/\\D/g, '');
  if (cleanedValue !== nationalId) {
    document.getElementById('nationalId').value = cleanedValue;
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);
  const profileData = {
    userType: 'teacher',
    fullName: formData.get('fullName'),
    gender: formData.get('gender'),
    birthDate: formData.get('birthDate'),
    nationalId: formData.get('nationalId'),
    specialization: formData.get('specialization'),
    department: formData.get('department'),
    country: formData.get('country'),
    location: formData.get('location'),
    contactEmail: formData.get('contact-email'),
    contactPhone: formData.get('contact-phone'),
    preferredClassPlatform: formData.get('preferred-class-platform')
  };

  try {
    document.getElementById('loader').style.display = 'block';
    await updateUserProfile(profileData);
    window.location.href = '/profile.html';
  } catch (error) {
    handleError(error);
  } finally {
    document.getElementById('loader').style.display = 'none';
  }
}

// دالة للحصول على دولة المستخدم
async function getUserCountry() {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    return data.country_code;
  } catch (error) {
    console.error('خطأ في تحديد الدولة:', error);
    return 'EG'; // الدولة الافتراضية
  }
}
