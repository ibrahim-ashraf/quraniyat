const { authMiddleware } = require('./middleware/auth-middleware');

exports.handler = async function (event, context) {
  // التحقق من طريقة الطلب
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'طريقة غير مسموح بها' })
    };
  }

  try {
    // التحقق من وجود التوكن القديم
    const oldToken = event.headers.authorization?.replace('Bearer ', '');
    if (!oldToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'لم يتم توفير توكن المصادقة' })
      };
    }

    // تجديد التوكن
    const newToken = authMiddleware.refreshToken(oldToken);

    if (!newToken) {
      return {
        statusCode: 401,
        body: JSON.stringify({ message: 'فشل تجديد التوكن' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        token: newToken,
        message: 'تم تجديد التوكن بنجاح'
      })
    };
  } catch (error) {
    console.error('خطأ في تجديد التوكن:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'حدث خطأ في الخادم أثناء تجديد التوكن'
      })
    };
  }
};