const { verifyToken, CustomAuthError } = require('./auth-middleware');

// Middleware للتحقق من المصادقة
function requireAuth(handler) {
  return async function (event, context) {
    try {
      // التحقق من التوكن
      const decoded = verifyToken(event);

      // إضافة معلومات المستخدم إلى الطلب
      event.user = decoded;

      // تنفيذ المعالج الأصلي
      return await handler(event, context);
    } catch (error) {
      if (error instanceof CustomAuthError) {
        return {
          statusCode: 401,
          body: JSON.stringify({
            error: true,
            message: error.message,
            type: error.type
          })
        };
      }

      // الأخطاء غير المتوقعة
      console.error('خطأ غير متوقع:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: true,
          message: 'حدث خطأ في الخادم'
        })
      };
    }
  };
}

// Middleware للتحقق من الأدوار
function requireRole(roles) {
  return function (handler) {
    return requireAuth(async (event, context) => {
      // التحقق من وجود الدور المطلوب
      if (!roles.includes(event.user.userType)) {
        return {
          statusCode: 403,
          body: JSON.stringify({
            error: true,
            message: 'ليس لديك صلاحية للوصول إلى هذا المورد'
          })
        };
      }

      // تنفيذ المعالج الأصلي
      return await handler(event, context);
    });
  };
}

module.exports = {
  requireAuth,
  requireRole
};