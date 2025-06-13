// خدمة تحويل العملات باستخدام معدل القوة الشرائية

const BASE_COUNTRY = 'EG'; // مصر كدولة أساسية
const PPP_CACHE = new Map();
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 ساعة

async function fetchLatestPPP(countryCode) {
  // التحقق من وجود قيمة محفوظة وصالحة في الذاكرة المؤقتة
  const cached = PPP_CACHE.get(countryCode);
  if (cached && (Date.now() - cached.timestamp) < CACHE_DURATION) {
    return cached.value;
  }

  const currentYear = new Date().getFullYear();
  const url = `https://api.worldbank.org/v2/en/country/${countryCode}/indicator/PA.NUS.PPP?format=json&date=${currentYear - 5}:${currentYear}&per_page=100`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`فشل في جلب بيانات PPP للدولة: ${countryCode}`);
    }

    const data = await response.json();

    if (!data[1]) {
      throw new Error(`لا توجد بيانات PPP للدولة: ${countryCode}`);
    }

    // استخراج السنوات ذات القيم غير الفارغة
    const validData = data[1].filter(entry => entry.value !== null);

    if (validData.length === 0) {
      throw new Error(`لا توجد بيانات PPP صالحة للدولة: ${countryCode}`);
    }

    // إيجاد السنة الأحدث من بين البيانات الصالحة
    const latestEntry = validData.reduce((latest, entry) =>
      parseInt(entry.date) > parseInt(latest.date) ? entry : latest
    );

    // حفظ القيمة في الذاكرة المؤقتة
    PPP_CACHE.set(countryCode, {
      value: latestEntry.value,
      timestamp: Date.now()
    });

    return latestEntry.value;

    return latestEntry.value;
  } catch (error) {
    console.error('خطأ في جلب بيانات PPP:', error);
    throw error;
  }
}

export async function convertAmountByPPP(amount, targetCountryCode) {
  if (targetCountryCode === BASE_COUNTRY) {
    return amount;
  }

  try {
    const [egyptPPP, targetPPP] = await Promise.all([
      fetchLatestPPP(BASE_COUNTRY),
      fetchLatestPPP(targetCountryCode)
    ]);

    // تحويل القيمة بناءً على القوة الشرائية النسبية
    const converted = (amount / egyptPPP) * targetPPP;
    return converted;
  } catch (error) {
    console.error('خطأ في تحويل المبلغ:', error);
    throw error;
  }
}

const CURRENCY_CODES = {
  'AF': 'AFN', // أفغانستان
  'AU': 'AUD', // أستراليا
  'BD': 'BDT', // بنغلاديش
  'BE': 'EUR', // بلجيكا
  'BH': 'BHD', // البحرين
  'CA': 'CAD', // كندا
  'DE': 'EUR', // ألمانيا
  'DZ': 'DZD', // الجزائر
  'EG': 'EGP', // مصر
  'FR': 'EUR', // فرنسا
  'GB': 'GBP', // المملكة المتحدة
  'ID': 'IDR', // إندونيسيا
  'IN': 'INR', // الهند
  'IQ': 'IQD', // العراق
  'IR': 'IRR', // إيران
  'JO': 'JOD', // الأردن
  'KW': 'KWD', // الكويت
  'LB': 'LBP', // لبنان
  'LY': 'LYD', // ليبيا
  'MA': 'MAD', // المغرب
  'MR': 'MRU', // موريتانيا
  'MY': 'MYR', // ماليزيا
  'NG': 'NGN', // نيجيريا
  'NL': 'EUR', // هولندا
  'NO': 'NOK', // النرويج
  'OM': 'OMR', // عُمان
  'PK': 'PKR', // باكستان
  'PS': 'ILS', // فلسطين (تستخدم الشيكل الإسرائيلي)
  'QA': 'QAR', // قطر
  'SA': 'SAR', // السعودية
  'SD': 'SDG', // السودان
  'SE': 'SEK', // السويد
  'SN': 'XOF', // السنغال
  'SY': 'SYP', // سوريا
  'TD': 'XAF', // تشاد
  'TR': 'TRY', // تركيا
  'TN': 'TND', // تونس
  'US': 'USD', // الولايات المتحدة
  'YE': 'YER', // اليمن
  'AE': 'AED'  // الإمارات
};

/**
 * تحويل وتنسيق السعر حسب الدولة
 * @param {number} basePrice - السعر الأساسي بالجنيه المصري
 * @param {string} countryCode - رمز الدولة (مثل EG, SA, etc)
 * @returns {Promise<string>} السعر المحول والمنسق مع رمز العملة
 */
export async function formatPriceForCountry(basePrice, countryCode) {
  try {
    if (countryCode === BASE_COUNTRY) {
      return new Intl.NumberFormat('ar-EG', {
        style: 'currency',
        currency: CURRENCY_CODES[countryCode]
      }).format(basePrice);
    }

    // تحويل رمز الدولة إلى الأردن إذا كان فلسطين
    if (countryCode === 'PS') {
      countryCode = 'JO';
    }

    const pppRate = await fetchLatestPPP(countryCode);
    const basePPP = await fetchLatestPPP(BASE_COUNTRY);

    if (!pppRate || !basePPP) {
      throw new Error('لم يتم العثور على معدل تحويل العملة');
    }

    // تحويل السعر باستخدام معدل القوة الشرائية
    const convertedPrice = parseFloat(((basePrice * pppRate) / basePPP).toFixed(2));

    // تنسيق السعر حسب عملة الدولة
    return new Intl.NumberFormat('ar', {
      style: 'currency',
      currency: CURRENCY_CODES[countryCode] || CURRENCY_CODES[BASE_COUNTRY]
    }).format(convertedPrice);
  } catch (error) {
    console.error('خطأ في تحويل السعر:', error);
    // في حالة الخطأ، نعرض السعر بالعملة الأساسية
    return new Intl.NumberFormat('ar-EG', {
      style: 'currency',
      currency: CURRENCY_CODES[BASE_COUNTRY]
    }).format(basePrice);
  }
}
