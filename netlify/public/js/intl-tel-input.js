let itiLibPromise;

export async function initialIntlTelInput(inputId, language = 'ar') {
  const input = document.getElementById(inputId);
  if (!input) {
    throw new Error(`Input with id "${inputId}" not found`);
  }

  // CSS (مرة واحدة)
  if (!document.querySelector('[data-iti-css]')) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/css/intlTelInput.css';
    link.dataset.itiCss = 'true';
    document.head.appendChild(link);
  }

  // JS lib (مرة واحدة)
  if (!window.intlTelInput) {
    if (!itiLibPromise) {
      itiLibPromise = new Promise((res, rej) => {
        const s = document.createElement('script');
        s.src = 'https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/intlTelInput.min.js';
        s.onload = res;
        s.onerror = rej;
        document.head.appendChild(s);
      });
    }
    await itiLibPromise;
  }

  // language (dynamic import)
  const translation = (await import(
    `https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/i18n/${language}/index.js`
  )).default;

  return window.intlTelInput(input, {
    i18n: translation,
    onlyCountries: ['eg'],
    allowDropdown: false,
    showFlags: true,
    initialCountry: 'eg',
    strictMode: true,
    nationalMode: true,
    separateDialCode: false,
    autoPlaceholder: 'off',
    loadUtils: () =>
      import('https://cdn.jsdelivr.net/npm/intl-tel-input@25.3.1/build/js/utils.js'),
  });
}
