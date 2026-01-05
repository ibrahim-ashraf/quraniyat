// الحصول على التاريخ والوقت الحاليين
const today = new Date();

// تعيين وقت انتهاء التقديم
const targetDate = new Date('2026-01-25T00:00:00');

// الحصول على كل الخطوات التي تمثل صفحات النموذج، والتي هي ذات التصنيف step
const steps = document.querySelectorAll('.step');

// دالة لتعيين وتحديث عداد انتهاء التقديم
function updateCountdown() {
  // الحصول على التاريخ والوقت الحاليين لحظة تنفيذ الدالة
  const now = new Date();

  // الحصول على الوقت بالمللي ثانية بين الآن والوقت المستهدف
  const timeDifference = targetDate - now;

  // تعيين نص انتهاء التقديم إلى الحاوية الرئيسية في حالة كون اختلاف الوقت صفرا أو سالبا
  if (timeDifference <= 0) {
    document.getElementById('container').textContent = 'تم إغلاق باب التقديم.';
    return;
  }

  // الحصول على وقت انتهاء التقديم بالأيام والساعات والدقائق والثواني
  const days = Math.floor(timeDifference / (1000 * 60 * 60 * 24));
  const hours = Math.floor((timeDifference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((timeDifference % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((timeDifference % (1000 * 60)) / 1000);

  // تعيين نص انتهاء التقديم إلى حاوية العداد
  document.getElementById('countdown').textContent = `يتبقى على إغلاق باب التقديم ${days} يوم وـ ${hours} ساعة وـ ${minutes} دقيقة وـ ${seconds} ثانية.`;
}

setInterval(updateCountdown, 1000); // تحديث العد التنازلي كل ثانية

function validateName() {
  const nameInput = document.getElementById('fullName');
  const fullName = nameInput.value;
  if (typeof fullName !== 'string') return false;

  // إزالة المسافات الزائدة
  const cleanedName = fullName.trim().replace(/\s+/g, ' ');

  // تقسيم الاسم
  const parts = cleanedName.split(' ');

  // التحقق من كونه رباعيًا
  if (parts.length < 4) {
    changeStep(1);
    alert('يرجى إدخال الاسم الرباعي الكامل (الاسم الأول، اسم الأب، اسم الجد، واسم العائلة).');
    nameInput.focus();
    return false;
  }

  nameInput.value = cleanedName;
  return cleanedName;
}

function validatePhoneNumber() {
  const phoneInput = document.getElementById('phone');
  if (phoneInput.value) {
    const phoneNumber = iti.isValidNumber() ? iti.getNumber().replace(/^\+2/, "") : false;
    console.log(phoneNumber);
    if (!phoneNumber) {
      changeStep(1);
      alert('تأكد من إدخال رقم هاتف صالح.');
      phoneInput.focus();
      return false;
    }
    return phoneNumber;
  } else {
    alert('أدخل رقم هاتف.');
    return false;
  }

  return true;
}

function changeStep(step) {
  steps.forEach((s, index) => {
    s.classList.toggle('hidden', index !== step - 1);
  });

  if (step !== 1) {
    document.getElementById('competitionIntroContainer').style.display = 'none';
  } else {
    document.getElementById('competitionIntroContainer').style.display = 'block';
  }
}

fetch('/surahs_data.json')
  .then(response => response.json())
  .then(data => {
    const surahSelection = document.getElementById('surahSelection');
    Object.entries(data).forEach(([key, value]) => {
      const surahName = key.split('سورة ')[1];
      const label = document.createElement('label');
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.name = 'surah';
      checkbox.value = surahName;
      label.appendChild(checkbox);
      label.appendChild(document.createTextNode(surahName));
      const li = document.createElement('li');
      li.appendChild(label);
      surahSelection.appendChild(li);
      surahSelection.appendChild(document.createElement('br'));
    });
  })
  .catch(error => console.error('Error fetching surah data:', error));

// تعطيل اختيار السور إذا اختار "القرآن الكريم كاملا"
document.getElementById('quran-memorized-portion').addEventListener('change', function () {
  const surahsContainer = document.getElementById('surahsContainer');

  if (this.value === '30') {
    surahsContainer.style.display = 'none';
  } else {

    surahsContainer.style.display = 'inline-block';

  }
});

// إظهار حقلَي اختيار دراسة التجويد وإخفاؤهما حسب الإجابة
const tajweedStudySelect = document.getElementById('tajweed_study');
const booksWrapperSelect = document.getElementById('tajweed_books_wrapper');
const levelWrapperSelect = document.getElementById('tajweed_level_wrapper');

tajweedStudySelect.addEventListener('change', function () {
  if (this.value === 'نعم') {
    booksWrapperSelect.style.display = 'block';
    booksWrapperSelect.querySelector('select').required = true;
    levelWrapperSelect.style.display = 'block';
    levelWrapperSelect.querySelector('select').required = true;
  } else {
    booksWrapperSelect.style.display = 'none';
    booksWrapperSelect.querySelector('select').required = false;
    levelWrapperSelect.style.display = 'none';
    levelWrapperSelect.querySelector('select').required = false;

    booksWrapperSelect.value = '';
    levelWrapperSelect.value = '';
  }
});

document.getElementById('registrationForm').addEventListener('submit', async event => {
  event.preventDefault(); // منع الإرسال الافتراضي للنموذج

  const submitButton = document.getElementById('submit');
  submitButton.disabled = true;
  submitButton.textContent = 'جاري الإرسال...';

  const name = validateName();
  const phone = validatePhoneNumber();

  if (!name || !phone) {
    submitButton.disabled = false;
    submitButton.textContent = 'إرسال';
    return;
  }

  const birthDate = `${document.getElementById('birth-year-select').value}-${document.getElementById('birth-month-select').value}-${document.getElementById('birth-day-select').value}`;
  const juzCount = document.getElementById("quran-memorized-portion").value;
  const tajweedStudy = document.getElementById("tajweed_study").value;

  const formData = {
    timestamp: new Date().toLocaleString('ar-EG'),
    fullName: name,
    gender: document.getElementById("gender").value,
    birthDate,
    phone,
    educationSystem: document.getElementById("educationSystem").value,
    schoolYear: document.getElementById("schoolYear").value,
    juzCount,
    surahs: juzCount === '30' ? 'القرآن الكريم كاملا' : Array.from(document.querySelectorAll("input[name='surah']:checked")).map(el => el.value).join('، '),
    tajweedStudy,
    tajweedBooks: tajweedStudy === 'لا' ? 'لا ينطبق' : document.getElementById("tajweed_books").value,
    tajweedLevel: tajweedStudy === 'لا' ? 'لا ينطبق' : document.getElementById("tajweed_level").value,
    participatedBefore: document.getElementById("participatedBefore").value,
  };

  try {
    const response = await fetch('/.netlify/functions/submitForm', {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(formData),
    });
    if (!response.ok) {
      throw new Error(`فشل الاتصال بالخادم، رمز الحالة: ${response.status}`);
    }
    const result = await response.json();

    alert('🌟 مبارك! تم التسجيل! لقد وصلت بياناتكم بنجاح إلى القائمين على المسابقة. 📝✨');
    location.reload();
  } catch (error) {
    console.error('Error occurred:', error);
    let userMessage = "حدث خطأ غير متوقع، يرجى المحاولة لاحقًا.";
    if (error.message.includes('فشل الاتصال بالخادم')) {
      userMessage = "⚠️ هناك مشكلة في الاتصال بالخادم، يرجى التحقق من الإنترنت أو المحاولة لاحقًا.";
    }
    alert(`❌ ${userMessage}`);
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = 'إرسال';
  }
});