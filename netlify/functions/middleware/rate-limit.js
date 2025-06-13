const rateLimit = {
  // مخزن مؤقت لتتبع الطلبات
  requestStore: new Map(),

  // تنظيف المخزن المؤقت كل ساعة
  cleanupInterval: setInterval(() => {
    const now = Date.now();
    for (const [key, data] of rateLimit.requestStore) {
      if (now - data.timestamp > 3600000) { // حذف البيانات الأقدم من ساعة
        rateLimit.requestStore.delete(key);
      }
    }
  }, 3600000),

  // الحصول على معرف الطلب
  getRequestIdentifier(event) {
    return event.headers['client-ip'] ||
      event.headers['x-forwarded-for'] ||
      'unknown';
  },

  // التحقق من تجاوز الحد
  checkLimit(identifier, limit, windowMs) {
    const now = Date.now();
    const requestData = this.requestStore.get(identifier) || {
      count: 0,
      timestamp: now
    };

    // إعادة تعيين العداد إذا انتهت النافذة الزمنية
    if (now - requestData.timestamp > windowMs) {
      requestData.count = 0;
      requestData.timestamp = now;
    }

    // التحقق من تجاوز الحد
    if (requestData.count >= limit) {
      const timeLeft = Math.ceil((requestData.timestamp + windowMs - now) / 1000);
      return {
        allowed: false,
        timeLeft
      };
    }

    // زيادة العداد وتحديث البيانات
    requestData.count++;
    this.requestStore.set(identifier, requestData);

    return {
      allowed: true,
      timeLeft: 0
    };
  },

  // middleware للتحقق من معدل الطلبات
  checkRateLimit(limit = 60, windowMs = 60000) { // افتراضياً: 60 طلب في الدقيقة
    return function (handler) {
      return async function (event, context) {
        const identifier = rateLimit.getRequestIdentifier(event);
        const check = rateLimit.checkLimit(identifier, limit, windowMs);

        if (!check.allowed) {
          return {
            statusCode: 429,
            body: JSON.stringify({
              error: true,
              message: `تم تجاوز الحد المسموح به من الطلبات. يرجى المحاولة بعد ${check.timeLeft} ثانية`
            })
          };
        }

        // إضافة ترويسات التحكم في معدل الطلبات
        const response = await handler(event, context);
        const headers = {
          ...response.headers,
          'X-RateLimit-Limit': limit,
          'X-RateLimit-Remaining': limit - rateLimit.requestStore.get(identifier).count,
          'X-RateLimit-Reset': Math.ceil((rateLimit.requestStore.get(identifier).timestamp + windowMs) / 1000)
        };

        return { ...response, headers };
      };
    };
  }
};

module.exports = rateLimit;