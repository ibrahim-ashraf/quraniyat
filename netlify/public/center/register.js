// تعريف متغيرات كائنات intl-tel-input
let mainIti, secondaryIti;

document.addEventListener('DOMContentLoaded', function () {
  // تهيئة intl-tel-input لكل حقل هاتف
  mainIti = initializeIntlTelInput(document.getElementById('mainPhone'));
  secondaryIti = initializeIntlTelInput(document.getElementById('secondaryPhone'));

  // تهيئة قوائم التواريخ
  initializeDateSelects();

  // معالج إضافة طالب جديد
  const addStudentBtn = document.getElementById('addStudentBtn');
  addStudentBtn.addEventListener('click', addNewStudent);

  // معالج تقديم النموذج
  const form = document.getElementById('registrationForm');
  form.addEventListener('submit', handleFormSubmit);

  // تهيئة صلة القرابة
  const relationSelect = document.getElementById('relation');
  relationSelect.addEventListener('change', function () {
    const otherRelationDiv = document.getElementById('otherRelationDiv');
    const otherRelationInput = document.getElementById('otherRelation');

    if (this.value === 'other') {
      otherRelationDiv.style.display = 'block';
      otherRelationInput.required = true;
    } else {
      otherRelationDiv.style.display = 'none';
      otherRelationInput.required = false;
      otherRelationInput.value = '';
    }
  });

  // تهيئة معالجات تاريخ الميلاد
  setupBirthDateHandlers();
});

// دالة لتهيئة intl-tel-input
function initializeIntlTelInput(input) {
  const iti = window.intlTelInput(input, {
    i18n: ar,
    strictMode: true,
    onlyCountries: ['eg'],
    allowDropdown: false,
    showFlags: true,
    separateDialCode: false,
    loadUtils: () => import("https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js"),
  });
  return iti;
}

function setupBirthDateHandlers() {
  const updateAge = (yearSelect, monthSelect, daySelect) => {
    const ageDisplay = yearSelect.closest('.card-body').querySelector('.age-display');
    if (yearSelect.value && monthSelect.value && daySelect.value) {
      const birthDate = new Date(yearSelect.value, monthSelect.value - 1, daySelect.value);
      const today = new Date();
      let age = today.getFullYear() - birthDate.getFullYear();
      let monthDiff = today.getMonth() - birthDate.getMonth();
      let dayDiff = today.getDate() - birthDate.getDate();

      // تعديل يوم الميلاد إذا كان سالبا
      if (dayDiff < 0) {
        monthDiff--;
        dayDiff += new Date(today.getFullYear(), today.getMonth(), 0).getDate();
      }

      // تعديل الشهر إذا كان سالبا
      if (monthDiff < 0) {
        age--;
        monthDiff += 12;
      }
      // عرض العمر
      ageDisplay.value = `${age} سنة وـ ${monthDiff} شهر وـ ${dayDiff} يوم`;

    } else {
      ageDisplay.value = '';
    }
  };

  document.querySelectorAll('.birthYear, .birthMonth, .birthDay').forEach(select => {
    select.addEventListener('change', function () {
      const form = this.closest('.card-body');
      const yearSelect = form.querySelector('.birthYear');
      const monthSelect = form.querySelector('.birthMonth');
      const daySelect = form.querySelector('.birthDay');
      updateAge(yearSelect, monthSelect, daySelect);
    });
  });
}

function initializeDateSelects() {
  const currentYear = new Date().getFullYear();
  const yearSelects = document.querySelectorAll('.birthYear');
  const monthSelects = document.querySelectorAll('.birthMonth');
  const daySelects = document.querySelectorAll('.birthDay');

  // تهيئة قوائم السنوات
  yearSelects.forEach(select => {
    if (select.options.length <= 1) {
      select.innerHTML = '<option value="">اختر السنة</option>';
      for (let year = currentYear - 4; year >= currentYear - 18; year--) {
        const option = document.createElement('option');
        option.value = year;
        option.textContent = year;
        select.appendChild(option);
      }
    }
  });

  // إضافة مستمعي الأحداث لتحديث الأيام
  yearSelects.forEach((yearSelect, index) => {
    yearSelect.addEventListener('change', () => updateDays(daySelects[index], monthSelects[index].value, yearSelect.value));
  });

  monthSelects.forEach((monthSelect, index) => {
    monthSelect.addEventListener('change', () => updateDays(daySelects[index], monthSelect.value, yearSelects[index].value));
  });

  // تهيئة أيام أول شهر
  daySelects.forEach(select => updateDays(select, 1, currentYear));
}

function updateDays(daySelect, month, year) {
  const currentValue = daySelect.value;
  daySelect.innerHTML = '<option value="">اختر اليوم</option>';

  const daysInMonth = new Date(year, month, 0).getDate();

  for (let day = 1; day <= daysInMonth; day++) {
    const option = document.createElement('option');
    option.value = day;
    option.textContent = day;
    daySelect.appendChild(option);
  }

  if (currentValue && currentValue <= daysInMonth) {
    daySelect.value = currentValue;
  }
}

function addNewStudent() {
  const studentsContainer = document.getElementById('studentsContainer');
  const studentCount = studentsContainer.children.length + 1;

  // نسخ نموذج الطالب الأول
  const firstStudentForm = studentsContainer.children[0];
  const newStudentForm = firstStudentForm.cloneNode(true);

  // تحديث العنوان والمعرفات
  newStudentForm.querySelector('.card-header h3').textContent = `بيانات الطفل/ة ${studentCount}`;
  newStudentForm.dataset.studentIndex = studentCount;

  // إعادة تهيئة جميع الحقول
  const inputs = newStudentForm.querySelectorAll('input, select, textarea');
  inputs.forEach(input => {
    input.value = '';
  });

  // حذف أي نتائج سابقة للتحقق من الاسم
  const existingResult = newStudentForm.querySelector('.name-validation-result');
  if (existingResult) {
    existingResult.remove();
  }

  // إضافة زر حذف للنموذج الجديد
  const headerDiv = newStudentForm.querySelector('.card-header');
  const deleteButton = document.createElement('button');
  deleteButton.type = 'button';
  deleteButton.className = 'btn btn-danger btn-sm';
  deleteButton.innerHTML = 'حذف';
  deleteButton.onclick = function () {
    if (confirm('هل أنت متأكد من حذف بيانات هذا الطالب؟')) {
      newStudentForm.remove();
      updateStudentNumbers();
    }
  };
  headerDiv.appendChild(deleteButton);

  // إضافة النموذج الجديد
  studentsContainer.appendChild(newStudentForm);

  // تهيئة قوائم التاريخ للنموذج الجديد
  initializeDateSelects();

  // تهيئة معالجات تاريخ الميلاد للنموذج الجديد
  setupBirthDateHandlers();
}

function updateStudentNumbers() {
  const studentForms = document.querySelectorAll('.student-form');
  studentForms.forEach((form, index) => {
    const number = index + 1;
    form.querySelector('.card-header h3').textContent = `بيانات الطالب/ة ${number}`;
    form.dataset.studentIndex = number;

    // تحديث أسماء أزرار الراديو
    const radios = form.querySelectorAll('input[type="radio"]');
    radios.forEach(radio => {
      radio.name = `studentGender${number}`;
    });
  });
}

async function handleFormSubmit(event) {
  event.preventDefault();

  // التحقق من صحة النموذج
  if (!event.target.checkValidity()) {
    event.target.reportValidity();
    alert('يرجى ملء جميع الحقول المطلوبة بشكل صحيح.');
    return;
  }

  // تعطيل زر الإرسال لمنع التكرار
  const submitButton = document.getElementById('submitBtn');
  submitButton.disabled = true;
  submitButton.textContent = 'جاري التسجيل...';
  submitButton.classList.add('disabled');
  submitButton.classList.remove('btn-primary');
  submitButton.classList.add('btn-secondary');

  // جمع البيانات
  const formData = {
    parent: {
      name: document.getElementById('parentName').value,
      gender: document.querySelector('select[name="parentGender"]').value,
      relation: document.getElementById('relation').value,
      otherRelation: document.getElementById('relation').value === 'other' ? document.getElementById('otherRelation').value : '',
      mainPhone: mainIti.getNumber(),
      secondaryPhone: secondaryIti.getNumber()
    },
    children: []
  };

  // جمع بيانات الطلاب
  const studentForms = document.querySelectorAll('.student-form');
  studentForms.forEach(form => {
    // تنسيق التاريخ بالشكل yyyy-mm-dd
    const year = form.querySelector('select[name="birthYear[]"]').value;
    const month = form.querySelector('select[name="birthMonth[]"]').value.padStart(2, '0');
    const day = form.querySelector('select[name="birthDay[]"]').value.padStart(2, '0');
    const birthDate = `${year}-${month}-${day}`;

    const child = {
      name: form.querySelector('input[name="studentName[]"]').value,
      gender: form.querySelector('select[name="studentGender[]"]').value,
      birthDate: birthDate,
      grade: form.querySelector('select[name="grade[]"]').value,
      school: form.querySelector('select[name="school[]"]').value,
      memorizedParts: form.querySelector('input[name="memorizedParts[]"]').value,
      notes: form.querySelector('textarea[name="notes[]"]').value
    };
    formData.children.push(child);
  });

  const emailData = getEmailData(formData);

  const payload = {
    formData,
    emailData
  };

  try {
    // إرسال البيانات إلى الخادم
    const response = await fetch('/.netlify/functions/register-student', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      alert('تم التسجيل بنجاح!');
      location.reload();
    } else {
      throw new Error('فشل في تسجيل الطلاب');
    }
  } catch (error) {
    console.error('خطأ:', error);
    alert('حدث خطأ أثناء تسجيل الطلاب. الرجاء المحاولة مرة أخرى.');
  }
}

// دالة للحصول على بيانات البريد الإلكتروني
function getEmailData(data) {
  const to = ['meftah.aloloom@gmail.com'];
  const subject = 'تسجيل جديد في مركز مفتاح العلوم';
  let text = `تم تسجيل ${data.children.length} من الأطفال في مركز مفتاح العلوم:\n\n
  البيانات الشخصية لولي الأمر:\n
  الاسم: ${data.parent.name}\n
  الجنس: ${data.parent.gender}\n
  صلة القرابة: ${data.parent.relation}${data.parent.otherRelation ? ` (${data.parent.otherRelation})` : ''}\n
  الهاتف الرئيسي: ${data.parent.mainPhone}\n
  الهاتف الثانوي: ${data.parent.secondaryPhone}\n\n
  بيانات الأطفال:\n`;
  data.children.forEach((student, index) => {
    text += `\nالطفل/ة ${index + 1}:\n
    الاسم: ${student.name}\n
    الجنس: ${student.gender}\n
    تاريخ الميلاد: ${student.birthDate}\n
    الصف: ${student.grade}\n
    المدرسة: ${student.school}\n
    الأجزاء المحفوظة: ${student.memorizedParts}\n
    الملاحظات: ${student.notes}\n`;
  });

  let html = `<p>تم تسجيل ${data.children.length} من الأطفال في مركز مفتاح العلوم:</p>
  <p><strong>البيانات الشخصية لولي الأمر:</strong></p>
  <p>الاسم: ${data.parent.name}</p>
  <p>الجنس: ${data.parent.gender}</p>
  <p>صلة القرابة: ${data.parent.relation}${data.parent.otherRelation ? ` (${data.parent.otherRelation})` : ''}</p>
  <p>الهاتف الرئيسي: ${data.parent.mainPhone}</p>
  <p>الهاتف الثانوي: ${data.parent.secondaryPhone}</p>
  <p><strong>بيانات الطلاب:</strong></p>`;
  data.children.forEach((student, index) => {
    html += `<p><strong>الطفل/ة ${index + 1}:</strong></p>
    <p>الاسم: ${student.name}</p>
    <p>الجنس: ${student.gender}</p>
    <p>تاريخ الميلاد: ${student.birthDate}</p>
    <p>الصف: ${student.grade}</p>
    <p>المدرسة: ${student.school}</p>
    <p>الأجزاء المحفوظة: ${student.memorizedParts}</p>
    <p>الملاحظات: ${student.notes}</p>`;
  });
  html += `<p><a href="tel:${data.parent.mainPhone}">الاتصال بالرقم الأول</a></p>
  <p><a href="tel:${data.parent.secondaryPhone}">الاتصال بالرقم الثاني</a></p>
  <p><a href="https://wa.me/${data.parent.mainPhone.replace(/\D/g, '')}" target="_blank">التواصل عبر واتساب مع الرقم الأول</a></p>
  <p><a href="https://wa.me/${data.parent.secondaryPhone.replace(/\D/g, '')}" target="_blank">التواصل عبر واتساب مع الرقم الثاني</a></p>`;

  return { to, subject, text, html };
}

// دالة للتحقق من الأسماء
async function validateName(name, isParent = false) {
  const prompt = `حلل الاسم التالي بدقة لغوية وذكاء لغوي عميق، وأجب فقط بصيغة JSON:

الاسم: "${name}";

المطلوب:
1. هل الاسم يتكون من أربعة مقاطع أو أكثر؟ أجب بـ true أو false.
2. حدد نوع الجنس من الاسم(male أو female أو unknown).
3. هل الاسم صحيح إملائيًا (خاصةً فيما يتعلق بالهمزات) ونحويًا ويطابق قواعد الكتابة العربية الفصيحة فقط؟ (valid: true/false).
4. إذا كان المقطع الأول على وزن "فِيعَال" (مثل: رينادن ريتاج، ريتال، ريماس، ريهام)، فأزل الياء واجعلها على وزن "فِعَال" (مثل: رِنَاد، رِتَاج، رِتَال، رِمَاس، رِهام).
5. إذا لم يكن صالحًا، اقترح اسما أو عدة أسماء صالحة دون حذف أي جزء من الاسم(فقط بالتصحيح الإملائي أو الفصيح).
6. إن كان الاسم صحيحًا فصيحًا، أعده كما هو.

أعد الإجابة بصيغة JSON فقط بدون أي شرح إضافي، وبدون استخدام علامات تنسيق json، كما في المثال:

    {
      "isQuadruple": true,
      "gender": "male",
      "valid": true,
      "correctNames": [
        "محمد أحمد عبد الله علي"
      ]
    }
      `;

  try {
    const response = await fetch('/.netlify/functions/validate-name', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name,
        prompt
      })
    });

    if (!response.ok) {
      throw new Error('فشل التحقق من الاسم');
    }

    const responseText = await response.text();
    const result = responseText.replace(/^```(?: json) ?\s * /i, '').replace(/```$/, '').trim();
    // تحليل النتيجة كـ JSON
    const parsedResult = JSON.parse(result);
    return parsedResult;
  } catch (error) {
    console.error('خطأ في التحقق من الاسم:', error);
    return null;
  }
}

// دالة لإظهار نتيجة التحقق من الاسم
function showNameValidationResult(input, result) {
  // إزالة أي نتائج سابقة
  const existingResult = input.parentElement.querySelector('.name-validation-result');
  if (existingResult) {
    existingResult.remove();
  }

  const resultDiv = document.createElement('div');
  resultDiv.className = 'name-validation-result';

  if (!result) {
    input.setCustomValidity('احذف أي شيء من الاسم ثم أعد كتابته؛ لإعادة التحقق');
    input.reportValidity();

    resultDiv.innerHTML = `
  <div class= "alert alert-warning" >
  <i class="bi bi-exclamation-triangle"></i>
        تعذر التحقق من الاسم. احذف أي شيء من الاسم ثم أعد كتابته؛ لإعادة التحقق.
      </div >
    `;
  } else if (result.valid && result.isQuadruple) {
    input.setCustomValidity('');
    input.reportValidity();

    resultDiv.innerHTML = `
    <div class= "alert alert-success" >
    <i class="bi bi-check-circle"></i>
        تم التحقق من صلاحية الاسم إملائيًا
      </div >
    `;
  } else {
    input.setCustomValidity('الاسم غير صالح إملائيا');
    input.reportValidity();

    let message = '';
    if (!result.isQuadruple) {
      message = 'الاسم يجب أن يكون رباعيًا على الأقل';
    } else if (!result.valid) {
      message = 'الاسم غير صحيح إملائيًا';
    }

    const suggestions = result.correctNames.map(name =>
      `<button type = "button" class= "btn btn-link suggestion-btn" onclick = "useSuggestion(this, '${name}')" > ${name}</button > `
    ).join('');

    resultDiv.innerHTML = `
  <div class= "alert alert-warning" >
  <i class="bi bi-exclamation-triangle"></i>
        ${message}
  <div class= "suggestions" >
  <p>هل تقصد:</p>
          ${suggestions}
  <button type = "button" class= "btn btn-link confirm-btn" onclick = "confirmName(this)" >
  الاسم صحيح فعلاً
          </button >
        </div >
      </div >
    `;
  }

  input.parentElement.appendChild(resultDiv);
}

// دالة لاستخدام الاسم المقترح
function useSuggestion(button, name) {
  const input = button.closest('.form-group').querySelector('input');
  input.value = name;
  nameValidationStatus.set(input, true);
  showNameValidationResult(input, { valid: true, isQuadruple: true });
}

// دالة لتأكيد صحة الاسم
function confirmName(button) {
  const input = button.closest('.form-group').querySelector('input');
  nameValidationStatus.set(input, true);
  showNameValidationResult(input, { valid: true, isQuadruple: true });
}
