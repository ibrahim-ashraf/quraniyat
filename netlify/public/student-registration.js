import { getCurrentUser, updateUserProfile } from './auth.js';
import { handleError } from './utils.js';
import config from './config.js';
import networkService from './network-service.js';
import errorService from './error-service.js';
import { initializeLocationServices } from './utils.js';
import { formatPriceForCountry } from './ppp-service.js';

let iti = null;
let pricingData = null;

// حدود العمر
const MIN_AGE = 18;
const MAX_AGE = 150;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    const user = await getCurrentUser();
    if (!user) {
      window.location.href = '/login.html';
      return;
    }

    // استرجاع معلومات المستخدم من URL
    const params = new URLSearchParams(window.location.search);
    const userEmail = params.get('email');
    const userName = params.get('name');

    // ملء معلومات المستخدم
    if (userName) {
      document.getElementById('name-input').value = userName;
    }
    if (userEmail) {
      document.getElementById('email-input').value = userEmail;
    }

    // إضافة التحقق من تاريخ الميلاد
    const birthdateInput = document.getElementById('student-birthdate');
    const today = new Date();
    const maxDate = new Date();
    const minDate = new Date();

    maxDate.setFullYear(today.getFullYear() - MIN_AGE);
    minDate.setFullYear(today.getFullYear() - MAX_AGE);

    birthdateInput.max = maxDate.toISOString().split('T')[0];
    birthdateInput.min = minDate.toISOString().split('T')[0];

    const note = birthdateInput.nextElementSibling;
    note.textContent = `يجب أن يكون عمرك ${MIN_AGE} سنة أو أكثر للتسجيل كطالب. يجب أن يكون تاريخ ميلادك ${birthdateInput.max} أو قبل ذلك.`;

    await Promise.all([
      loadCountries(),
      loadPricingData(),
      initializeLocationServices()
    ]);

    // تحديد الدولة تلقائياً
    const userCountry = await getUserCountry();
    if (userCountry) {
      const countrySelect = document.getElementById('country');
      countrySelect.value = userCountry.toLowerCase();

      // إضافة مستمع الأحداث لعدم إمكانية تغيير الدولة
      countrySelect.addEventListener('change', () => {
        countrySelect.value = userCountry.toLowerCase();
      });

      // تهيئة intl-tel-input
      const phoneInput = document.getElementById('phone-input');
      iti = window.intlTelInput(phoneInput, {
        i18n: ar,
        initialCountry: userCountry.toLowerCase(),
        strictMode: true,
        onlyCountries: [userCountry.toLowerCase()],
        allowDropdown: false,
        showFlags: true,
        separateDialCode: false,
        loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js"),
      });
    }    // Initialize form submission
    document.getElementById('student-registration-form').addEventListener('submit', handleSubmit);

    // تهيئة تفضيلات المواعيد
    setupSchedulePreferences();
  } catch (error) {
    handleError(error);
  }
});

async function loadCountries() {
  try {
    const countrySelect = document.getElementById('country');
    const response = await fetch('countries.json');
    const countries = await response.json();

    // Sort countries alphabetically
    countries.sort((a, b) => a.name.localeCompare(b.name));

    // Add options to country select
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code.toLowerCase();
      option.textContent = country.name;
      countrySelect.appendChild(option);
    });

    // Update pricing when country changes
    countrySelect.addEventListener('change', updatePricing);
  } catch (error) {
    handleError('حدث خطأ في تحميل قائمة الدول: ' + error.message);
  }
}

async function loadPricingData() {
  try {
    const response = await fetch('/pricing.json');
    pricingData = await response.json();
    initializeProgramFields();
  } catch (error) {
    handleError('خطأ في تحميل بيانات التسعير');
  }
}

function initializeProgramFields() {
  const subjectSelect = document.getElementById('subject');
  const departmentSelect = document.getElementById('department');
  const sessionsSelect = document.getElementById('sessions');

  // Add subjects
  Object.keys(pricingData.subjects).forEach(subjectKey => {
    const subject = pricingData.subjects[subjectKey];
    const option = new Option(subject.name, subjectKey);
    subjectSelect.add(option);
  });

  // Event listeners
  subjectSelect.addEventListener('change', handleSubjectChange);
  departmentSelect.addEventListener('change', handleDepartmentChange);
  sessionsSelect.addEventListener('change', handleSessionsChange);
}

// معالجة تغيير عدد الحصص
function handleSessionsChange() {
  const sessionsCount = parseInt(this.value) || 0;
  const schedulePreferences = document.getElementById('schedule-preferences');
  const maxDaysSpan = document.getElementById('max-days');
  const dayCheckboxes = document.querySelectorAll('input[name="preferred-days"]');
  const maxDays = Math.ceil(sessionsCount / 4); // ربع عدد الحصص الشهرية

  if (sessionsCount > 0) {
    schedulePreferences.style.display = 'block';
    maxDaysSpan.textContent = maxDays;

    // إعادة تعيين الأيام والأوقات
    dayCheckboxes.forEach(checkbox => {
      // إلغاء تحديد اليوم
      checkbox.checked = false;
      checkbox.disabled = false;
      const dayItem = checkbox.closest('.day-item');
      dayItem.classList.remove('disabled');

      // إعادة تعيين الوقت
      const timeSelect = dayItem.querySelector('select');
      timeSelect.disabled = true;
      timeSelect.required = false;
      timeSelect.value = '';
      const timeSelectContainer = timeSelect.closest('.time-select');
      timeSelectContainer.style.display = 'none';
    });

  } else {
    // إخفاء قسم المواعيد إذا لم يتم اختيار عدد الحصص
    schedulePreferences.style.display = 'none';

    // إعادة تعيين كل الأيام والأوقات
    dayCheckboxes.forEach(checkbox => {
      checkbox.checked = false;
      checkbox.disabled = false;
      const dayItem = checkbox.closest('.day-item');
      dayItem.classList.remove('disabled');
      const timeSelect = dayItem.querySelector('select');
      timeSelect.disabled = true;
      timeSelect.required = false;
      timeSelect.value = '';
      timeSelect.closest('.time-select').style.display = 'none';
    });
  }

  // تحديث الأسعار
  updatePricing();
}

function handleSubjectChange(event) {
  const subjectKey = event.target.value;
  const departmentSelect = document.getElementById('department');
  const sessionsSelect = document.getElementById('sessions');

  // Reset department and sessions lists
  departmentSelect.innerHTML = '<option value="">اختر القسم</option>';
  sessionsSelect.innerHTML = '<option value="">اختر عدد الحصص</option>';

  if (!subjectKey) return;

  const subject = pricingData.subjects[subjectKey];
  if (!subject || !subject.departments) return;

  Object.entries(subject.departments).forEach(([key, dept]) => {
    const option = document.createElement('option');
    option.value = key;
    option.textContent = dept.name;
    if (dept.description) {
      option.title = dept.description;
    }
    departmentSelect.appendChild(option);
  });
}

function handleDepartmentChange() {
  const sessionsSelect = document.getElementById('sessions');
  sessionsSelect.innerHTML = '<option value="">اختر عدد الحصص</option>';

  pricingData.sessions_per_month.forEach(sessionCount => {
    const option = new Option(`${sessionCount} حصص في الشهر`, sessionCount);
    sessionsSelect.add(option);
  });

  updatePricing();
}

async function updatePricing() {
  const subjectKey = document.getElementById('subject').value;
  const departmentKey = document.getElementById('department').value;
  const sessionCount = document.getElementById('sessions').value;
  const countryCode = document.getElementById('country').value?.toUpperCase();
  const pricingDetails = document.getElementById('pricing-details');

  if (!subjectKey || !departmentKey || !sessionCount || !countryCode) {
    pricingDetails.style.display = 'none';
    return;
  }

  try {
    const basePrice = pricingData.base_prices[departmentKey][sessionCount];
    const sessionDuration = pricingData.subjects[subjectKey].departments[departmentKey].session_duration;

    // Convert price based on country's purchasing power
    const formattedPrice = await formatPriceForCountry(basePrice, countryCode);

    document.getElementById('session-duration').textContent = sessionDuration;
    document.getElementById('program-price').textContent = formattedPrice;

    pricingDetails.style.display = 'block';
  } catch (error) {
    console.error('خطأ في حساب السعر:', error);
    errorService.showErrorMessage('حدث خطأ في حساب السعر. يرجى المحاولة مرة أخرى لاحقاً.');
    pricingDetails.style.display = 'none';
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  try {
    // التحقق من صحة المواعيد المختارة
    validateSchedule();

    const form = event.target;
    const formData = new FormData(form);

    const profileData = {
      userType: 'student',
      name: formData.get('name'),
      gender: formData.get('gender'),
      birthDate: formData.get('birthDate'),
      country: formData.get('country'),
      location: formData.get('location'),
      email: formData.get('email'),
      phone: iti.getNumber(),
      subjects: {
        name: formData.get('subject'),
        department: formData.get('department'),
        sessionsPerMonth: parseInt(formData.get('sessions')),
        platform: formData.get('platform'),
        schedule: getSelectedSchedule()
      }
    };

    await updateUserProfile(profileData);
    window.location.href = '/student-dashboard.html';
  } catch (error) {
    handleError(error);
  }
}

// التحقق من صحة المواعيد المختارة
function validateSchedule() {
  const sessionsCount = parseInt(document.getElementById('sessions').value) || 0;
  const maxDays = Math.ceil(sessionsCount / 4);
  const selectedDays = document.querySelectorAll('input[name="preferred-days"]:checked').length;

  if (selectedDays === 0) {
    throw new Error('يرجى اختيار الأيام المفضلة للدراسة');
  }

  if (selectedDays > maxDays) {
    throw new Error(`يمكنك اختيار ${maxDays} أيام كحد أقصى`);
  }

  // التحقق من اختيار الوقت لكل يوم محدد
  const missingTimes = [];
  document.querySelectorAll('input[name="preferred-days"]:checked').forEach(checkbox => {
    const dayItem = checkbox.closest('.day-item');
    const timeSelect = dayItem.querySelector('select');
    const dayName = dayItem.querySelector('label').textContent;

    if (!timeSelect.value) {
      missingTimes.push(dayName);
    }
  });

  if (missingTimes.length > 0) {
    throw new Error(`يرجى اختيار الوقت المفضل لأيام: ${missingTimes.join('، ')}`);
  }

  return true;
}

// إعداد تفضيلات المواعيد
function setupSchedulePreferences() {
  const sessionsSelect = document.getElementById('sessions');
  const schedulePreferences = document.getElementById('schedule-preferences');
  const maxDaysSpan = document.getElementById('max-days');
  const dayCheckboxes = document.querySelectorAll('input[name="preferred-days"]');
  const timeSelects = document.querySelectorAll('.time-select select');

  // تهيئة قائمة الأوقات المتاحة
  const timeSlots = generateTimeSlots();
  timeSelects.forEach(select => {
    timeSlots.forEach(slot => {
      const option = new Option(slot, slot);
      select.add(option);
    });
  });
  // تم نقل معالج الحدث إلى دالة handleSessionsChange

  // إضافة مستمع الحدث لكل صندوق اختيار
  dayCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('change', function () {
      const timeSelect = this.closest('.day-item').querySelector('select');
      const timeSelectContainer = timeSelect.closest('.time-select');

      if (this.checked) {
        timeSelectContainer.style.display = 'block';
        timeSelect.disabled = false;
        timeSelect.required = true;
      } else {
        timeSelectContainer.style.display = 'none';
        timeSelect.disabled = true;
        timeSelect.required = false;
        timeSelect.value = '';
      }

      updateDaysAvailability(parseInt(maxDaysSpan.textContent));
    });
  });
}

// دالة لتوليد الأوقات المتاحة
function generateTimeSlots() {
  const slots = [];
  const startHour = 8; // 8 صباحاً
  const endHour = 22; // 10 مساءً

  for (let hour = startHour; hour <= endHour; hour++) {
    const time12 = hour <= 12 ? hour : hour - 12;
    const period = hour < 12 ? 'صباحاً' : 'مساءً';
    slots.push(`${time12}:00 ${period}`);
    slots.push(`${time12}:30 ${period}`);
  }

  return slots;
}

// دالة لتحديث إتاحة الأيام
function updateDaysAvailability(maxDays) {
  const checkedDays = document.querySelectorAll('input[name="preferred-days"]:checked').length;
  const uncheckedBoxes = document.querySelectorAll('input[name="preferred-days"]:not(:checked)');

  if (checkedDays >= maxDays) {
    // تعطيل الأيام غير المحددة
    uncheckedBoxes.forEach(box => {
      box.disabled = true;
      box.closest('.day-item').classList.add('disabled');
    });
  } else {
    // تفعيل جميع الأيام
    uncheckedBoxes.forEach(box => {
      box.disabled = false;
      box.closest('.day-item').classList.remove('disabled');
    });
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

// دالة للحصول على المواعيد المحددة
function getSelectedSchedule() {
  const schedule = [];
  const dayNames = {
    'sat': 'السبت',
    'sun': 'الأحد',
    'mon': 'الاثنين',
    'tue': 'الثلاثاء',
    'wed': 'الأربعاء',
    'thu': 'الخميس',
    'fri': 'الجمعة'
  };

  document.querySelectorAll('input[name="preferred-days"]:checked').forEach(checkbox => {
    const dayItem = checkbox.closest('.day-item');
    const timeSelect = dayItem.querySelector('select');

    schedule.push({
      day: dayNames[checkbox.value],
      dayCode: checkbox.value,
      time: timeSelect.value
    });
  });

  return schedule;
}
