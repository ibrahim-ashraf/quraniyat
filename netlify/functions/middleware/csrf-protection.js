const crypto = require('crypto');

const csrfProtection = {
  // توليد توكن CSRF
  generateToken() {
    return crypto.randomBytes(32).toString('hex');
  },

  // التحقق من صحة التوكن
  verifyToken(token, storedToken) {
    if (!token || !storedToken) {
      return false;
    }
    return crypto.timingSafeEqual(
      Buffer.from(token),
      Buffer.from(storedToken)
    );
  },

  // middleware للتحقق من CSRF
  validateCsrf(options = {}) {
    const defaultOptions = {
      cookieName: 'csrf_token',
      headerName: 'X-CSRF-Token',
      ignoreMethods: ['GET', 'HEAD', 'OPTIONS']
    };

    const config = { ...defaultOptions, ...options };

    return function (handler) {
      return async function (event, context) {
        // تجاهل الطرق الآمنة
        if (config.ignoreMethods.includes(event.httpMethod)) {
          return handler(event, context);
        }

        // الحصول على التوكن من الترويسة والكوكي
        const headerToken = event.headers[config.headerName.toLowerCase()];
        const cookieHeader = event.headers.cookie || '';
        const cookies = cookieHeader.split(';').reduce((acc, cookie) => {
          const [key, value] = cookie.trim().split('=');
          acc[key] = value;
          return acc;
        }, {});
        const cookieToken = cookies[config.cookieName];

        // التحقق من وجود التوكن
        if (!headerToken || !cookieToken) {
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: true,
              message: 'توكن CSRF مفقود'
            })
          };
        }

        // التحقق من تطابق التوكن
        if (!csrfProtection.verifyToken(headerToken, cookieToken)) {
          return {
            statusCode: 403,
            body: JSON.stringify({
              error: true,
              message: 'توكن CSRF غير صالح'
            })
          };
        }

        return handler(event, context);
      };
    };
  },

  // middleware لإنشاء توكن CSRF
  createCsrfToken(handler) {
    return async function (event, context) {
      const token = csrfProtection.generateToken();

      const response = await handler(event, context);
      const headers = {
        ...response.headers,
        'Set-Cookie': `csrf_token=${token}; Path=/; HttpOnly; SameSite=Strict`
      };

      return {
        ...response,
        headers,
        csrfToken: token
      };
    };
  }
};

module.exports = csrfProtection;