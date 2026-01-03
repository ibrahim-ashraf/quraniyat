import { formatPriceForCountry } from './ppp-service.js';
import { handleError } from './utils.js';

let pricingData = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    await Promise.all([
      loadCountries(),
      loadPricingData()
    ]);

    const userCountry = await getUserCountry();
    if (userCountry) {
      const countrySelect = document.getElementById('country-select') || document.getElementById('residence-country-select');
      countrySelect.value = userCountry.toLowerCase();

      countrySelect.addEventListener('change', () => {
        countrySelect.value = userCountry.toLowerCase();
      });
    }
  } catch (error) {
    handleError(error);
  }
});

async function loadCountries() {
  try {
    const countrySelect = document.getElementById('country-select') || document.getElementById('residence-country-select');
    const response = await fetch('countries.json');
    const countries = await response.json();
    countries.sort((a, b) => a.name.localeCompare(b.name));

    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code.toLowerCase();
      option.textContent = country.name;
      countrySelect.appendChild(option.cloneNode(true));
    });
  } catch (error) {
    handleError('حدث خطأ في تحميل قائمة الدول: ' + error.message);
  }
}

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

async function loadPricingData() {
  try {
    const response = await fetch('/pricing.json');
    pricingData = await response.json();
    initializeProgramFields();
  } catch (error) {
    handleError(error);
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
  sessionsSelect.addEventListener('change', updatePricing);
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
  const countryCode = document.getElementById('country-select').value?.toUpperCase() || document.getElementById('residence-country-select').value?.toUpperCase();
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