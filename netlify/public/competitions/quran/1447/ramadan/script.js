// الحصول على التاريخ والوقت الحاليين
const today = new Date();

// تعيين وقت انتهاء التقديم
const targetDate = new Date('2026-02-11T00:00:00');

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

function validatePhoneNumber() {
  if (phoneInput.value) {
    const phoneNumber = intlTelInput.isValidNumber() ? iti.getNumber().replace(/^\+2/, "") : false;
    // const phoneNumber = intlTelInput.getNumber();
    console.log(phoneNumber);
    if (!phoneNumber) {
      alert('تأكد من إدخال رقم هاتف صالح.');
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
const tajweedStudy = document.getElementById('tajweed_study');
const booksWrapper = document.getElementById('tajweed_books_wrapper');
const levelWrapper = document.getElementById('tajweed_level_wrapper');

tajweedStudy.addEventListener('change', function () {
  if (this.value === 'نعم') {
    booksWrapper.style.display = 'block';
    booksWrapper.querySelector('select').setAttribute('required', 'required');
    levelWrapper.style.display = 'block';
    levelWrapper.querySelector('select').setAttribute('required', 'required');
  } else {
    booksWrapper.style.display = 'none';
    levelWrapper.style.display = 'none';

    document.getElementById('tajweed_books').value = '';
    document.getElementById('tajweed_level').value = '';
  }
});

document.getElementById('registrationForm').addEventListener('submit', async event => {
  event.preventDefault(); // منع الإرسال الافتراضي للنموذج

  const submitButton = document.getElementById('submit');
  submitButton.disabled = true;
  submitButton.textContent = 'جاري الإرسال...';

  const birthDate = `${document.getElementById('birth-year-select').value}-${document.getElementById('birth-month-select').value}-${document.getElementById('birth-day-select').value}`;

  const phone = validatePhoneNumber();
  if (!phone) {
    submitButton.disabled = false;
    submitButton.textContent = 'إرسال';
    return;
  }

  const formData = {
    timestamp: new Date().toLocaleString('ar-EG'),
    fullName: document.getElementById("fullName").value,
    gender: document.getElementById("gender").value,
    birthDate,
    phone,
    educationSystem: document.getElementById("educationSystem").value,
    schoolYear: document.getElementById("schoolYear").value,
    juzCount: document.getElementById("quran-memorized-portion").value,
    surahs: juzCount === '30' ? 'القرآن الكريم كاملا' : Array.from(document.querySelectorAll("input[name='surah']:checked")).map(el => el.value).join('، '),
    tajweedStudy: document.getElementById("tajweed_study").value,
    tajweedBooks: tajweedStudy === 'لا' ? '' : document.getElementById("tajweed_books").value,
    tajweedLevel: tajweedStudy === 'لا' ? '' : document.getElementById("tajweed_level").value,
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