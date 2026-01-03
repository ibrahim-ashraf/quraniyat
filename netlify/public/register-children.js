import { getCurrentUser, updateUserProfile } from './auth.js';
import { handleError } from './utils.js';
import config from './config.js';
import networkService from './network-service.js';
import errorService from './error-service.js';
import { initializeLocationServices } from './utils.js';
import { formatPriceForCountry } from './ppp-service.js';

// حدود العمر للأطفال
const MIN_AGE = 7;
const MAX_AGE = 18;

let pricingData = null;

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

    // ملء معلومات ولي الأمر
    if (userName) {
      document.getElementById('guardianName').value = userName;
    }
    if (userEmail) {
      document.getElementById('contact-email').value = userEmail;
      document.getElementById('use-account-email').checked = true;
    }

    await Promise.all([
      loadCountries(),
      loadPricingData(),
      initializeLocationServices(),
      initializeDateFields()
    ]);

    // Set the account email
    const accountEmailInput = document.getElementById('account-email');
    accountEmailInput.value = user.email;

    // Welcome message
    document.getElementById('welcome-message').textContent = `مرحباً ${user.email}`;

    // Initialize form submission
    document.getElementById('children-registration-form').addEventListener('submit', handleSubmit);

    // Initialize relationship type change handler
    const relationshipSelect = document.getElementById('relationship-select');
    relationshipSelect.addEventListener('change', () => {
      const otherContainer = document.getElementById('other-relationship-container');
      const otherInput = document.getElementById('other-relationship-input');
      otherContainer.style.display = relationshipSelect.value === 'other' ? 'block' : 'none';
      otherInput.required = relationshipSelect.value === 'other';
    });

    // Initialize child forms
    initializeChildrenContainer();
  } catch (error) {
    handleError(error);
  }
});

function initializeChildrenContainer() {
  // Add first child form if none exists
  const childrenContainer = document.getElementById('children-container');
  if (childrenContainer.children.length === 0) {
    addChild();
  }

  // Initialize add child button
  document.getElementById('add-child').addEventListener('click', () => {
    addChild();
    updatePricing();
  });
}

function addChild() {
  const childrenContainer = document.getElementById('children-container');
  const childCount = childrenContainer.children.length + 1;

  const childDiv = document.createElement('div');
  childDiv.className = 'child-form';
  childDiv.dataset.childIndex = childCount;

  // إنشاء نموذج الطفل
  childDiv.innerHTML = `
        <h4>الطفل ${childCount}</h4>
        <button type="button" class="remove-child" onclick="removeChildForm(this)">حذف الطفل ${childCount}</button>
        <div class="form-group">
            <label for="child-name-${childCount}">اسم الطفل:</label>
            <input type="text" id="child-name-${childCount}" name="children[${childCount - 1}].name" required 
                   minlength="3" maxlength="50" pattern="^[\u0600-\u06FF\s]{3,}$" 
                   title="يرجى إدخال الاسم باللغة العربية (3 أحرف على الأقل)">
        </div>
        
        <div class="form-group">
            <label for="child-birthdate-${childCount}">تاريخ الميلاد:</label>
            <input type="date" id="child-birthdate-${childCount}" name="children[${childCount - 1}].birthDate" required>
            <small class="note">يجب أن يكون عمر الطفل بين ${MIN_AGE} و ${MAX_AGE} سنة</small>
        </div>

        <div class="form-group">
            <label for="child-gender-${childCount}">النوع:</label>
            <select id="child-gender-${childCount}" name="children[${childCount - 1}].gender" required>
                <option value="">اختر النوع</option>
                <option value="male">ذكر</option>
                <option value="female">أنثى</option>
            </select>
        </div>

        <div class="study-program">
            <h4>البرنامج الدراسي</h4>
            <div class="form-group">
                <label for="child-subject-${childCount}">المادة:</label>
                <select id="child-subject-${childCount}" name="children[${childCount - 1}].subject" required>
                    <option value="">اختر المادة</option>
                </select>
            </div>

            <div class="form-group">
                <label for="child-department-${childCount}">القسم:</label>
                <select id="child-department-${childCount}" name="children[${childCount - 1}].department" required>
                    <option value="">اختر القسم</option>
                </select>
            </div>

            <div class="form-group">
                <label for="child-sessions-${childCount}">عدد الحصص الشهرية:</label>
                <select id="child-sessions-${childCount}" name="children[${childCount - 1}].sessions" required>
                    <option value="">اختر عدد الحصص</option>
                </select>
            </div>

            <div id="child-pricing-${childCount}" class="pricing-details" style="display: none;">
                <p>مدة الحصة: <span class="session-duration"></span> دقيقة</p>
                <p>السعر الشهري: <span class="program-price"></span></p>
            </div>
        </div>
    `;

  childrenContainer.appendChild(childDiv);
  setChildDateConstraints(document.getElementById(`child-birthdate-${childCount}`));

  // تحديد حدود تاريخ الميلاد
  const birthdateInput = document.getElementById(`child-birthdate-${childCount}`);
  const today = new Date();
  const maxDate = new Date();
  const minDate = new Date();

  maxDate.setFullYear(today.getFullYear() - MIN_AGE);
  minDate.setFullYear(today.getFullYear() - MAX_AGE);

  birthdateInput.max = maxDate.toISOString().split('T')[0];
  birthdateInput.min = minDate.toISOString().split('T')[0];

  // إعداد قوائم البرنامج الدراسي
  const subjectSelect = document.getElementById(`child-subject-${childCount}`);
  const departmentSelect = document.getElementById(`child-department-${childCount}`);
  const sessionsSelect = document.getElementById(`child-sessions-${childCount}`);

  // تحديث الأقسام عند اختيار المادة
  subjectSelect.addEventListener('change', () => {
    const selectedSubject = pricingData.subjects.find(s => s.id === subjectSelect.value);
    if (selectedSubject) {
      departmentSelect.innerHTML = '<option value="">اختر القسم</option>';
      selectedSubject.departments.forEach(dept => {
        const option = document.createElement('option');
        option.value = dept.id;
        option.textContent = dept.name;
        departmentSelect.appendChild(option);
      });
    }
  });

  // تحديث عدد الحصص عند اختيار القسم
  departmentSelect.addEventListener('change', () => {
    const selectedSubject = pricingData.subjects.find(s => s.id === subjectSelect.value);
    const selectedDept = selectedSubject?.departments.find(d => d.id === departmentSelect.value);

    if (selectedDept) {
      sessionsSelect.innerHTML = '<option value="">اختر عدد الحصص</option>';
      selectedDept.sessions.forEach(session => {
        const option = document.createElement('option');
        option.value = session.count;
        option.textContent = `${session.count} حصة شهرياً`;
        sessionsSelect.appendChild(option);
      });
    }
  });

  // تحديث السعر عند اختيار عدد الحصص
  sessionsSelect.addEventListener('change', async () => {
    const selectedSubject = pricingData.subjects.find(s => s.id === subjectSelect.value);
    const selectedDept = selectedSubject?.departments.find(d => d.id === departmentSelect.value);
    const selectedSession = selectedDept?.sessions.find(s => s.count === parseInt(sessionsSelect.value));

    if (selectedSession) {
      const pricingDetails = document.getElementById(`child-pricing-${childCount}`);
      const sessionDuration = pricingDetails.querySelector('.session-duration');
      const programPrice = pricingDetails.querySelector('.program-price');

      sessionDuration.textContent = selectedSession.duration;

      const countryCode = document.getElementById('country').value;
      const convertedPrice = await formatPriceForCountry(selectedSession.priceEGP, countryCode);
      programPrice.textContent = convertedPrice;

      if (countryCode !== 'EG') {
        const priceNote = document.createElement('p');
        priceNote.className = 'pricing-note';
        priceNote.textContent = 'السعر محول حسب معدل القوة الشرائية وفقاً لبيانات البنك الدولي';
        pricingDetails.appendChild(priceNote);
      }

      pricingDetails.style.display = 'block';
    }
  });

  // ملء قائمة المواد
  pricingData.subjects.forEach(subject => {
    const option = document.createElement('option');
    option.value = subject.id;
    option.textContent = subject.name;
    subjectSelect.appendChild(option);
  });
}

window.removeChildForm = function (button) {
  try {
    const childForm = button.closest('.child-form');
    const childrenContainer = document.getElementById('children-container');

    if (childrenContainer.children.length <= 1) {
      errorService.showErrorMessage('لا يمكن حذف الطفل الوحيد. يجب أن يكون هناك طفل واحد على الأقل.');
      return;
    }

    childForm.remove();

    // Renumber remaining children
    const childForms = document.querySelectorAll('.child-form');
    childForms.forEach((form, index) => {
      const childNumber = index + 1;
      form.dataset.childIndex = childNumber;

      // Update title and remove button
      const titleElement = form.querySelector('h5');
      const removeButton = form.querySelector('.remove-child');
      if (titleElement) titleElement.textContent = `الطفل ${childNumber}`;
      if (removeButton) removeButton.textContent = `حذف الطفل ${childNumber}`;

      // Update field IDs and names
      ['name', 'gender', 'birthdate'].forEach(field => {
        const element = form.querySelector(`[id^=child-${field}]`);
        if (element) {
          element.id = `child-${field}-${childNumber}`;
          element.name = `children[${index}].${field}`;
        }
      });
    });

    // Update pricing after removing a child
    updatePricing();
  } catch (error) {
    errorService.showErrorMessage('حدث خطأ أثناء محاولة حذف الطفل');
  }
};

function initializeDateFields() {
  const today = new Date();

  // Calculate date constraints
  const minChildDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxChildDate = new Date(today.getFullYear() - 4, today.getMonth(), today.getDate());
  const minAdultDate = new Date(today.getFullYear() - 100, today.getMonth(), today.getDate());
  const maxAdultDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());

  // Set guardian date constraints
  const guardianBirthDate = document.getElementById('guardianBirthDate');
  if (guardianBirthDate) {
    guardianBirthDate.min = minAdultDate.toISOString().split('T')[0];
    guardianBirthDate.max = maxAdultDate.toISOString().split('T')[0];
  }

  // Set child date constraints for first child
  const firstChildBirthDate = document.getElementById('child-birthdate-1');
  if (firstChildBirthDate) {
    setChildDateConstraints(firstChildBirthDate);
  }
}

function setChildDateConstraints(childBirthdateInput) {
  const today = new Date();
  const minChildDate = new Date(today.getFullYear() - 18, today.getMonth(), today.getDate());
  const maxChildDate = new Date(today.getFullYear() - 4, today.getMonth(), today.getDate());

  childBirthdateInput.min = minChildDate.toISOString().split('T')[0];
  childBirthdateInput.max = maxChildDate.toISOString().split('T')[0];
}

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

function calculateMultiChildDiscount(childrenCount) {
  if (childrenCount <= 1) return 0;
  const discounts = pricingData.multiChildDiscount;
  if (childrenCount >= 5) return discounts['5+'];
  return discounts[childrenCount.toString()] || 0;
}

async function updatePricing() {
  const subjectKey = document.getElementById('subject').value;
  const departmentKey = document.getElementById('department').value;
  const sessionCount = document.getElementById('sessions').value;
  const countryCode = document.getElementById('country').value?.toUpperCase();
  const pricingDetails = document.getElementById('pricing-details');
  const childrenCount = document.getElementById('children-container').children.length;

  if (!subjectKey || !departmentKey || !sessionCount || !countryCode) {
    pricingDetails.style.display = 'none';
    return;
  }

  try {
    const basePrice = pricingData.base_prices[departmentKey][sessionCount];
    const sessionDuration = pricingData.subjects[subjectKey].departments[departmentKey].session_duration;
    const discountPercentage = calculateMultiChildDiscount(childrenCount);

    let finalPrice = basePrice;
    if (discountPercentage > 0) {
      finalPrice = basePrice * (1 - discountPercentage / 100);
    }

    const formattedPrice = await formatPriceForCountry(finalPrice, countryCode);

    document.getElementById('session-duration').textContent = sessionDuration;
    document.getElementById('program-price').textContent = formattedPrice;

    const discountElement = document.getElementById('multi-child-discount');
    if (discountElement) {
      if (discountPercentage > 0) {
        discountElement.textContent = `خصم ${discountPercentage}% على كل طفل للتسجيل المتعدد`;
        discountElement.style.display = 'block';
      } else {
        discountElement.style.display = 'none';
      }
    }

    pricingDetails.style.display = 'block';
  } catch (error) {
    console.error('خطأ في حساب السعر:', error);
    errorService.showErrorMessage('حدث خطأ في حساب السعر. يرجى المحاولة مرة أخرى لاحقاً.');
    pricingDetails.style.display = 'none';
  }
}

async function handleSubmit(event) {
  event.preventDefault();

  const form = event.target;
  const formData = new FormData(form);

  // Collect children data
  const children = [];
  const childForms = document.querySelectorAll('.child-form');
  childForms.forEach((childForm, index) => {
    children.push({
      name: formData.get(`children[${index}].name`),
      gender: formData.get(`children[${index}].gender`),
      birthDate: formData.get(`children[${index}].birthDate`)
    });
  });

  const profileData = {
    userType: 'guardian',
    guardian: {
      name: formData.get('guardianName'),
      gender: formData.get('guardianGender'),
      birthDate: formData.get('guardianBirthDate'),
      relationship: formData.get('relationship'),
      otherRelationship: formData.get('otherRelationship')
    },
    children: children,
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
