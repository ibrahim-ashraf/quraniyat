import { getIpapiData } from "./ipapi.js";
import { initialIntlTelInput } from "./intl-tel-input.js";
import { handleError } from './utils.js';
import networkService from './network-service.js';
import errorService from './error-service.js';
import { formatPriceForCountry } from './ppp-service.js';

let userCountry = null;
let iti = null;
let packagesData = [];

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
      const countrySelect = document.getElementById('country-select') || document.getElementById('residence-country-select') || document.getElementById('guardian-residence-country-select');
      countrySelect.value = userCountry.toLowerCase();

      // إضافة مستمع الأحداث لعدم إمكانية تغيير الدولة
      // countrySelect.addEventListener('change', () => {
      //   countrySelect.value = userCountry.toLowerCase();
      // });

      // تهيئة intl-tel-input
      iti = await initialIntlTelInput('guardian-phone-input', 'ar', userCountry.toLowerCase());
    }

    // Initialize form submission
    document.getElementById('children-registration-form').addEventListener('submit', handleSubmit);

    addChild();
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

let childCount = 0;

window.addChild = function () {
  const container = document.getElementById("children-container");

  const childId = generateChildId();
  const childNumber = container.children.length + 1;

  const childDiv = document.createElement("div");
  childDiv.className = "child-box";
  childDiv.dataset.childId = childId;

  childDiv.innerHTML = `
        <h3>طفل رقم ${childNumber}</h3>

        <div class="form-group">
          <label for="${childId}_name">اسم الطفل:</label>
          <input type="text" id="${childId}_name" name="${childId}_name" required>
        </div>

        <div class="form-group">
          <label for="${childId}_gender">النوع:</label>
          <select id="${childId}_gender" name="${childId}_gender" required>
            <option value="">اختر</option>
            <option value="male">ذكر</option>
            <option value="female">أنثى</option>
          </select>
        </div>

        <div class="form-group">
          <div id="${childId}-birthdate-container"></div>
        </div>

        <div class="form-group">
          <label for="${childId}_package">الباقة:</label>
          <select id="${childId}_package" name="${childId}_package" required>
            <option value="">-- جاري تحميل الباقات... --</option>
          </select>
        </div>

        <div class="form-group">
          <label for="${childId}_sessionDuration">مدة الحصة:</label>
          <select id="${childId}_sessionDuration" name="${childId}_sessionDuration" required>
            <option value="">-- اختر الباقة أولًا --</option>
          </select>
        </div>

        <button type="button" class="delete-child-btn">
          حذف الطفل ${childNumber}
        </button>
      `;

  container.appendChild(childDiv);

  // الأحداث
  setupChildEvents(childDiv, childId);

  // تحميل البيانات
  loadPackages(childId);
  createBirthdateDropdown(`${childId}-birthdate-container`, childId, 7, 17);
};

function generateChildId() {
  return `child_${Date.now()}_${Math.random().toString(16).slice(2, 6)}`;
}

function setupChildEvents(childDiv, childId) {
  const deleteBtn = childDiv.querySelector(".delete-child-btn");

  deleteBtn.addEventListener("click", () => {
    childDiv.remove();
    updateChildNumbers();
  });

  const packageSelect = childDiv.querySelector(`#${childId}_package`);

  packageSelect.addEventListener("change", () => {
    updateDurations(childId, packageSelect.value);
  });
}

function updateChildNumbers() {
  const children = document.querySelectorAll(".child-box");

  children.forEach((childDiv, index) => {
    const number = index + 1;

    childDiv.querySelector("h3").textContent = `طفل رقم ${index + 1}`;
    childDiv.querySelector(".delete-child-btn").textContent = `حذف الطفل ${number}`;
  });
}

async function loadPackages(childId) {
  const packageSelect = document.getElementById(`${childId}_package`);

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

function updateDurations(childId, packageId) {
  const durationSelect = document.getElementById(`${childId}_sessionDuration`);
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

async function handleSubmit(event) {
  event.preventDefault();

  try {
    const form = event.target;
    const formData = new FormData(form);

    const guardianData = {
      name: formData.get("guardianName"),
      gender: formData.get("guardianGender"),
      birthDate: `${document.getElementById("guardian_year").value}-${document.getElementById("guardian_month").value}-${document.getElementById("guardian_day").value}`,
      relationship: formData.get("relationship"),
      otherRelationship: formData.get("otherRelationship"),
      nationality: formData.get("nationality"),
      residence: formData.get("residenceCountry"),
      phone: iti.getNumber(),
      email: formData.get("email")
    };

    const childrenData = [];

    document.querySelectorAll(".child-box").forEach(childDiv => {
      const childId = childDiv.dataset.childId;
      const childData = {
        name: formData.get(`${childId}_name`),
        gender: formData.get(`${childId}_gender`),
        birthDate: `${document.getElementById(`${childId}_year`).value}-${document.getElementById(`${childId}_month`).value}-${document.getElementById(`${childId}_day`).value}`,
        package: formData.get(`${childId}_package`),
        sessionDuration: formData.get(`${childId}_sessionDuration`),
        price: document.getElementById(`${childId}_sessionDuration`).selectedOptions[0].dataset.price
      };
      childrenData.push(childData);
    });

    const data = {
      type: "children",
      guardian: guardianData,
      children: childrenData,
      notes: formData.get("notes"),
      termsAccepted: formData.get("agree-terms") === "on"
    };

    // حذف الحقول غير الضرورية
    if (data.guardian.relationship !== "other") {
      delete data.guardian.otherRelationship;
    }
    if (!data.guardian.email) {
      delete data.guardian.email;
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
          "template_sgaro9y", {
          message_html: messageHtml
        });

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
  const response = await fetch("/email-templates/children-registration.html");
  const template = await response.text();
  return template;
}

function fillTemplate(template, data) {
  return template.replace(/{{(.*?)}}/g, (_, key) => {
    return data[key.trim()] ?? "";
  });
}

function buildChildrenHtml(children) {
  return children.map((child, index) => `
    <div style="margin-bottom: 12px;">
      <strong>👶 الطفل ${index + 1}:</strong><br>
      الاسم: ${child.name}<br>
      النوع: ${child.gender === "male" ? "ذكر" : "أنثى"}<br>
      تاريخ الميلاد: ${new Date(child.birthDate).toLocaleDateString("ar-EG")}<br>
      الباقة: ${child.package}<br>
      مدة الحصة: ${child.sessionDuration} دقيقة<br>
      السعر: ${child.price} جنيه
    </div>
  `).join("");
}

async function buildFinalEmail(data) {
  const template = await loadEmailTemplate();

  const childrenHtml = buildChildrenHtml(data.children);

  const finalHtml = fillTemplate(template, {
    name: data.guardian.name,
    gender: data.guardian.gender === "male" ? "ذكر" : "أنثى",
    birthDate: new Date(data.guardian.birthDate).toLocaleDateString("ar-EG"),
    relationship: data.guardian.relationship === "other"
      ? data.guardian.otherRelationship
      : data.guardian.relationship,
    nationality: data.guardian.nationality,
    residence: data.guardian.residence,
    phone: data.guardian.phone,
    email: data.guardian.email || "لا يوجد",
    notes: data.notes || "لا يوجد",

    childrenHtml: childrenHtml
  });

  return finalHtml;
}