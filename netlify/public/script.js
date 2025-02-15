let intlTelInput;

function createChallengeCode(count) {
  let challengeCode = "";
  let challengeCodeNumbers = Math.floor(Math.random() * 3) + 4;

  for (let i = 0; i < count; i++) {
    challengeCode += Math.floor(Math.random() * 10);
  }

  return challengeCode;
}

function loadCountries(countrySelect, phoneInput) {
  fetch('countries.json')
    .then(response => response.json())
    .then(data => {
      const countries = data.countries;

      const countryCodes = populateCountryDropdownAndStoreCodes(countries, countrySelect);
      countrySelect.selectedIndex = -1;

      const ar = setArabicTranslationForITI(countries);
      intlTelInput = initialIntlTelInput(phoneInput, ar, countryCodes);
    })
    .catch(error => console.error('Error fetching countries:', error));
}

function populateCountryDropdownAndStoreCodes(countries, countrySelect) {
  const countryCodes = [];

  for (const [code, country] of Object.entries(countries)) {
    const option = new Option(country, code);
    countrySelect.add(option);
    countryCodes.push(code);
  }

  return countryCodes;
}

function setArabicTranslationForITI(countries) {
  const ar = {
    ...countries,
    selectedCountryAriaLabel: 'البلد المحددة',
    noCountrySelected: 'لا توجد بلد محددة',
    countryListAriaLabel: 'قائمة البلدان',
    searchPlaceholder: 'بحث',
    zeroSearchResults: 'لم يتم العثور على نتائج',
    oneSearchResult: 'تم العثور على نتيجة واحدة',
    multipleSearchResults: 'تم العثور على ${count} نتيجة',
  };

  return ar;
}

function initialIntlTelInput(phoneInput, ar, countryCodes) {
  const intlTelInput = window.intlTelInput(phoneInput, {
    utilsScript: 'https://cdn.jsdelivr.net/npm/intl-tel-input@23.3.2/build/js/utils.js',
    i18n: ar,
    onlyCountries: countryCodes,
    separateDialCode: false,
    initialCountry: 'auto',
    autoPlaceholder: 'aggressive',
    geoIpLookup: fetchGeoIp,
  });

  return intlTelInput;
}

function fetchGeoIp(callback) {
  fetch('https://ipapi.co/json')
    .then(response => response.json())
    .then(data => callback(data.country_code))
    .catch(() => callback(''));
}

function submitForm(data, databaseCollectionName, adminEmail, userEmail) {
  const metadata = {
    databaseCollectionName,
    'g-recaptcha-response': data['g-recaptcha-response']
  };

  delete data['g-recaptcha-response'];

  const userData = {
    timestamp: new Date().toISOString(),
    ...data
  };

  const allData = {
    metadata,
    userData,
    adminEmail
  };

  if (data.email) {
    allData.userEmail = userEmail;
  }

  return fetch('/.netlify/functions/submit', {
    method: 'POST',
    body: JSON.stringify(allData),
    headers: {
      'Content-Type': 'application/json',
    },
  })
    .then(response => {
      if (!response.ok) {
        throw new Error('server');
      }
      return response.json();
    })
    .then(result => {
      return { success: true, message: result.message };
    })
    .catch(error => {
      throw error;
    });
}

function displayDateTime() {
  const days = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
  const months = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];

  let dddd = days[dateTime.getDay()];
  let dd = dateTime.getDate();
  let mmmm = months[dateTime.getMonth()];
  let yyyy = dateTime.getFullYear();
  let dateText = `${dddd}، ${dd} ${mmmm} ${yyyy}`;
  let time = dateTime.toLocaleTimeString();
  document.getElementById("date_time").innerHTML = `${date}، ${time}`;

  setInterval(displayDateTime, 1000);
}