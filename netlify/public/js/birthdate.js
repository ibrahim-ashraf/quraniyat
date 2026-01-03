async function createBirthdateDropdown(containerId, minAge = 5, maxAge = 100) {
  const container = document.getElementById(containerId);
  if (!container) return;

  container.innerHTML = "";

  let yearSelect, monthSelect, daySelect;

  try {
    const res = await fetch("/partials/birthdate.html");
    if (!res.ok) throw new Error("فشل تحميل نموذج تاريخ الميلاد");
    const html = await res.text();
    container.innerHTML = html;
    yearSelect = container.querySelector("#birth-year-select");
    monthSelect = container.querySelector("#birth-month-select");
    daySelect = container.querySelector("#birth-day-select");
  } catch (err) {
    console.error(err);
  }

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-based
  const currentDay = today.getDate();

  const maxYear = currentYear - minAge;
  const minYear = currentYear - maxAge;

  // تعبئة السنوات
  for (let y = maxYear; y >= minYear; y--) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  }

  // عند اختيار سنة → تعبئة الأشهر ضمن النطاق
  yearSelect.addEventListener("change", () => {
    const year = parseInt(yearSelect.value);

    if (year) {
      monthSelect.innerHTML = `<option value="">اختر الشهر</option>`;
      daySelect.innerHTML = `<option value="">اختر الشهر أولا!</option>`;
    } else {
      monthSelect.innerHTML = `<option value="">اختر السنة أولا!</option>`;
      daySelect.innerHTML = `<option value="">اختر السنة أولا!</option>`;
      return;
    }

    const months = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    let startMonth = 1;
    let endMonth = 12;

    if (year === maxYear) {
      // أصغر عمر → لا يتجاوز الشهر الحالي
      endMonth = currentMonth;
    } else if (year === minYear) {
      // أكبر عمر → لا يقل عن الشهر الحالي
      startMonth = currentMonth;
    }

    for (let m = startMonth; m <= endMonth; m++) {
      const monthPadded = String(m).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = monthPadded;
      opt.textContent = `${m} - ${months[m - 1]}`;
      monthSelect.appendChild(opt);
    }
  });

  // عند اختيار شهر → تعبئة الأيام ضمن النطاق
  monthSelect.addEventListener("change", () => {
    const year = parseInt(yearSelect.value);
    const month = parseInt(monthSelect.value);

    if (year && month) {
      daySelect.innerHTML = `<option value="">اختر اليوم</option>`;
    } else {
      daySelect.innerHTML = `<option value="">اختر الشهر أولا!</option>`;
      return;
    }

    let daysInMonth = new Date(year, month, 0).getDate();

    let startDay = 1;
    let endDay = daysInMonth;

    if (year === maxYear && month === currentMonth) {
      // السنة والشهر = الآن → لا يتجاوز اليوم الحالي
      endDay = currentDay;
    } else if (year === minYear && month === currentMonth) {
      // السنة والشهر = أقدم سنة في النطاق → لا يقل عن اليوم الحالي
      startDay = currentDay;
    }

    for (let d = startDay; d <= endDay; d++) {
      const dayPadded = String(d).padStart(2, "0");
      const opt = document.createElement("option");
      opt.value = dayPadded;
      opt.textContent = d;
      daySelect.appendChild(opt);
    }
  });
}