const jwt = require('jsonwebtoken');

// أنواع أخطاء المصادقة
const AuthError = {
  NO_TOKEN: 'NO_TOKEN',
  INVALID_TOKEN: 'INVALID_TOKEN',
  EXPIRED_TOKEN: 'EXPIRED_TOKEN',
  TEMPORARY_TOKEN: 'TEMPORARY_TOKEN',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS'
};

// رسائل الأخطاء بالعربية
const errorMessages = {
  [AuthError.NO_TOKEN]: 'لم يتم تقديم توكن المصادقة',
  [AuthError.INVALID_TOKEN]: 'توكن المصادقة غير صالح',
  [AuthError.EXPIRED_TOKEN]: 'انتهت صلاحية توكن المصادقة',
  [AuthError.TEMPORARY_TOKEN]: 'يجب إكمال الملف الشخصي أولاً',
  [AuthError.INSUFFICIENT_PERMISSIONS]: 'ليس لديك صلاحيات كافية'
};

function verifyToken(event) {
  // استخراج التوكن من ترويسة Authorization
  const token = event.headers.authorization?.split(' ')[1];
  if (!token) {
    throw new CustomAuthError(AuthError.NO_TOKEN);
  }

  try {
    // التحقق من التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error instanceof CustomAuthError) {
      throw error;
    }

    if (error.name === 'TokenExpiredError') {
      throw new CustomAuthError(AuthError.EXPIRED_TOKEN);
    }

    throw new CustomAuthError(AuthError.INVALID_TOKEN);
  }
}

// للتحقق من الأدوار والصلاحيات
function checkRole(allowedRoles) {
  return function (decoded) {
    if (!allowedRoles.includes(decoded.userType)) {
      throw new CustomAuthError(AuthError.INSUFFICIENT_PERMISSIONS);
    }
    return decoded;
  };
}

// فئة مخصصة لأخطاء المصادقة
class CustomAuthError extends Error {
  constructor (type) {
    super(errorMessages[type]);
    this.type = type;
    this.name = 'CustomAuthError';
  }
}

const authMiddleware = {
  validateToken: async (event) => {
    try {
      const token = event.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return {
          isValid: false,
          error: 'لم يتم توفير توكن المصادقة'
        };
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // التحقق من انتهاء صلاحية التوكن
      if (Date.now() >= decoded.exp * 1000) {
        return {
          isValid: false,
          error: 'انتهت صلاحية التوكن'
        };
      }

      return {
        isValid: true,
        user: decoded
      };
    } catch (error) {
      console.error('خطأ في التحقق من التوكن:', error);
      return {
        isValid: false,
        error: 'توكن غير صالح'
      };
    }
  },

  generateToken: (user, isTemporary = false) => {
    // استخدام ساعة واحدة للتوكن المؤقت و7 أيام للتوكن العادي
    const expiresIn = isTemporary ? '1h' : '7d';

    return jwt.sign(
      {
        userId: user.userId,
        name: user.name,
        email: user.email,
        isTemporary
      },
      process.env.JWT_SECRET,
      { expiresIn }
    );
  },

  refreshToken: (oldToken) => {
    try {
      // التحقق من صحة التوكن القديم
      const decoded = jwt.verify(oldToken, process.env.JWT_SECRET);

      // توليد توكن جديد
      return jwt.sign(
        {
          userId: decoded.userId,
          email: decoded.email,
          name: decoded.name,
          isTemporary: false
        },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );
    } catch (error) {
      console.error('خطأ في تجديد التوكن:', error);
      return null;
    }
  }
};

module.exports = {
  verifyToken,
  checkRole,
  AuthError,
  CustomAuthError,
  authMiddleware
};