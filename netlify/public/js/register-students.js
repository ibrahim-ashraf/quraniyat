import { getIpapiData } from "./ipapi.js";
import { handleError } from './utils.js';
import networkService from './network-service.js';
import errorService from './error-service.js';
import { formatPriceForCountry } from './ppp-service.js';

let userCountry = null;
let iti = null;
let pricingData = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // جلب بيانات ipapi
    const ipData = await getIpapiData();
    userCountry = ipData ? ipData.country_code : null;

    await Promise.all([
      loadCountries(),
      loadPricingData()
    ]);

    if (userCountry) {
      const countrySelect = document.getElementById('country-select') || document.getElementById('residence-country-select');
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
  } catch (error) {
    handleError(error);
  }
});

function formatArabicDate(date) {
  // أسماء الأيام بالعربية
  const days = [
    "الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"
  ];

  // أسماء الأشهر بالعربية
  const months = [
    "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
    "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
  ];

  const dayName = days[date.getDay()];       // اسم اليوم
  const day = date.getDate();                // رقم اليوم
  const monthName = months[date.getMonth()]; // اسم الشهر
  const year = date.getFullYear();           // السنة

  return `${dayName}، ${day} ${monthName} ${year}`;
}

async function loadCountries() {
  try {
    const nationalitySelect = document.getElementById('nationality-select');
    const countrySelect = document.getElementById('residence-country-select');
    const response = await fetch('countries.json');
    const countries = await response.json();

    // Sort countries alphabetically
    countries.sort((a, b) => a.name.localeCompare(b.name));

    // Add options to country select
    countries.forEach(country => {
      const option = document.createElement('option');
      option.value = country.code.toLowerCase();
      option.textContent = country.name;
      nationalitySelect.appendChild(option);
      countrySelect.appendChild(option.cloneNode(true));
    });
  } catch (error) {
    handleError('حدث خطأ في تحميل قائمة الدول: ' + error.message);
  }
}

async function loadPricingData() {
  try {
    const response = await fetch('/pricing.json');
    pricingData = await response.json();
    addSpecialties();
  } catch (error) {
    handleError(error);
  }
}

function addSpecialties() {
  const specialtiesContainer = document.getElementById('specialties-container');

  Object.values(pricingData.subjects).forEach(subject => {
    // حاوية التخصص
    const specialtyDiv = document.createElement("div");
    specialtyDiv.className = "specialty";

    // عنوان التخصص
    const h3 = document.createElement('h3');
    h3.textContent = subject.name;
    specialtyDiv.appendChild(h3);

    // الأقسام
    Object.values(subject.departments).forEach(dept => {
      const div = document.createElement("div");
      div.className = "department";

      // عنوان القسم
      const h4 = document.createElement("h4");
      h4.textContent = dept.name;
      div.appendChild(h4);

      // وصف القسم
      const pDesc = document.createElement("p");
      pDesc.textContent = dept.description;
      div.appendChild(pDesc);

      // مدة الحصة
      const pDuration = document.createElement("p");
      pDuration.textContent = `⏱ مدة الحصة: ${dept.session_duration} دقيقة`;
      div.appendChild(pDuration);

      // select عدد الحصص
      const select = document.createElement("select");
      select.innerHTML = `<option value="">اختر عدد الحصص</option>`;
      pricingData.sessions_per_month.forEach(async s => {
        // الحصول على السعر الأساسي وتحويله حسب القوة الشرائية
        const basePrice = pricingData.base_prices[dept.key][s];
        const formattedPrice = await formatPriceForCountry(basePrice, userCountry);

        const opt = document.createElement("option");
        opt.value = s;
        opt.textContent = `${s} حصص (${formattedPrice})`;
        select.appendChild(opt);
      });
      div.appendChild(select);

      // checkbox اختيار القسم
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.disabled = true; // يبدأ معطل
      div.appendChild(checkbox);

      const label = document.createElement("label");
      label.textContent = " اختر هذا القسم";
      div.appendChild(label);

      // تمكين/تعطيل checkbox عند اختيار عدد الحصص
      select.addEventListener("change", () => {
        if (select.value === "") {
          checkbox.disabled = true;
          checkbox.checked = false;
        } else {
          checkbox.disabled = false;
        }
      });

      // السماح بقسم واحد فقط داخل نفس التخصص
      checkbox.addEventListener("change", () => {
        if (checkbox.checked) {
          specialtyDiv.querySelectorAll("input[type=checkbox]").forEach(cb => {
            if (cb !== checkbox) cb.checked = false;
          });
        }
      });

      specialtyDiv.appendChild(div);
    });

    // إضافة التخصص إلى الحاوية
    specialtiesContainer.appendChild(specialtyDiv);
  });
}

async function handleSubmit(event) {
  event.preventDefault();

  try {
    const form = event.target;
    const formData = new FormData(form);

    const profileData = {
      userType: 'student',
      name: formData.get('name'),
      gender: formData.get('gender'),
      birthDate: formData.get('birthDate'),
      nationality: formData.get('nationality'),
      country: formData.get('residence-country'),
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
