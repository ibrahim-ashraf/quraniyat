import { getIpapiData } from "./ipapi.js";
import { initialIntlTelInput } from "./intl-tel-input.js";
import { handleError } from './utils.js';
import networkService from './network-service.js';
import errorService from './error-service.js';
import { formatPriceForCountry } from './ppp-service.js';

let userCountry = null;
let iti = null;

document.addEventListener('DOMContentLoaded', async () => {
  try {
    // جلب بيانات ipapi
    // const ipData = await getIpapiData();
    // userCountry = ipData ? ipData.country_code : null;
    userCountry = 'eg';

    await Promise.all([
      // loadCountries()
    ]);

    if (userCountry) {
      const countrySelect = document.getElementById('country-select') || document.getElementById('residence-country-select');
      countrySelect.value = userCountry.toLowerCase();

      // إضافة مستمع الأحداث لعدم إمكانية تغيير الدولة
      // countrySelect.addEventListener('change', () => {
      //   countrySelect.value = userCountry.toLowerCase();
      // });

      // تهيئة intl-tel-input
      iti = await initialIntlTelInput('phone-input', 'ar', userCountry.toLowerCase());
    }

    // Initialize form submission
    document.getElementById('student-registration-form').addEventListener('submit', handleSubmit);

    let packagesData = [];

    const packageSelect = document.getElementById("package-select");
    const durationSelect = document.getElementById("session-duration-select");

    // تحميل الباقات
    async function loadPackages() {
      const res = await fetch("/data/packages.json");
      packagesData = await res.json();

      packageSelect.innerHTML = '<option value="">-- اختر الباقة --</option>';

      packagesData.forEach(pkg => {
        const option = document.createElement("option");
        option.value = pkg.id;
        option.textContent = pkg.name;
        packageSelect.appendChild(option);
      });
    }

    // تحديث المدد
    function updateDurations(packageId) {
      durationSelect.innerHTML = '<option value="">-- اختر الباقة أولًا --</option>';

      const selectedPackage = packagesData.find(p => p.id === packageId);
      if (!selectedPackage) return;

      durationSelect.innerHTML = '<option value="">-- اختر مدة الحصة --</option>';

      selectedPackage.durations.forEach(async d => {
        const durationPrice = d.price;
        const formattedPrice = await formatPriceForCountry(durationPrice, userCountry);
        const option = document.createElement("option");
        option.value = d.value;
        option.textContent = `${d.label} - ${formattedPrice}`;
        option.dataset.price = d.price;

        durationSelect.appendChild(option);
      });
    }

    // عند تغيير الباقة
    packageSelect.addEventListener("change", () => {
      updateDurations(packageSelect.value);
    });

    // تشغيل أولي
    loadPackages();
  } catch (error) {
    handleError(error);
  }
});

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

async function handleSubmit(event) {
  event.preventDefault();

  try {
    const form = event.target;
    const formData = new FormData(form);

    const data = {
      type: 'students',
      name: formData.get("name"),
      gender: formData.get("gender"),
      birthDate: `${document.getElementById("adult_year").value}-${document.getElementById("adult_month").value}-${document.getElementById("adult_day").value}`,
      nationality: formData.get("nationality"),
      residence: formData.get("residence"),
      phone: iti.getNumber(),
      email: formData.get("email"),
      package: formData.get("package"),
      sessionDuration: formData.get("sessionDuration"),
      price: document.getElementById("session-duration-select").selectedOptions[0].dataset.price || null,
      notes: formData.get("notes"),
      termsAccepted: formData.get("agree-terms") === "on"
    };

    // حذف الحقول غير الضرورية
    if (!data.email) {
      delete data.email;
    }
    if (!data.notes) {
      delete data.notes;
    }

    const response = await fetch("/.netlify/functions/submitRegistration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    if (response.ok) {

      try {
        const messageHtml = await buildFinalEmail(data);

        const response = await emailjs.send(
          "service_hh25ffv",
          "template_fnzdfrc", {
          message_html: messageHtml
        }
        );

        console.log("Email sent:", response.status);

        // =========================
        // 6️⃣ نجاح الإرسال
        // =========================
        alert("تم التسجيل بنجاح 🌿 سيتم التواصل معك قريبًا");

        form.reset();

      } catch (error) {
        console.error("EmailJS Error:", error);
        alert("حدث خطأ أثناء التسجيل، حاول مرة أخرى لاحقًا");
      }

    } else {
      const errorText = await response.text();
      throw new Error(`فشل التسجيل: ${errorText}`);
    }

  } catch (error) {
    handleError(error);
  }
}

async function loadEmailTemplate() {
  const response = await fetch("/email-templates/students-registration.html");
  const template = await response.text();
  return template;
}

function fillTemplate(template, data) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return data[key.trim()] ?? "";
  });
}

async function buildFinalEmail(data) {
  const template = await loadEmailTemplate();

  const finalHtml = fillTemplate(template, {
    name: data.name,
    gender: data.gender === "male" ? "ذكر" : "أنثى",
    birthDate: new Date(data.birthDate).toLocaleDateString("ar-EG"),
    nationality: data.nationality,
    residence: data.residence,
    phone: data.phone,
    email: data.email || "لا يوجد",
    package: data.package,
    sessionDuration: data.sessionDuration,
    price: data.price,
    notes: data.notes || "لا يوجد"
  });

  return finalHtml;
}