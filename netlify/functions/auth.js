const { OAuth2Client } = require('google-auth-library');
const { authMiddleware } = require('./middleware/auth-middleware');
const { MongoClient } = require('mongodb');

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
const mongoClient = new MongoClient(process.env.MONGODB_URI);

// تخزين محاولات تسجيل الدخول الفاشلة
const loginAttempts = new Map();

// التحقق من محاولات تسجيل الدخول
function checkLoginAttempts(ip) {
  const now = Date.now();
  const attempts = loginAttempts.get(ip) || { count: 0, timestamp: now };

  if (now - attempts.timestamp > 3600000) {
    attempts.count = 0;
    attempts.timestamp = now;
  }

  if (attempts.count >= 5) {
    const timeRemaining = Math.ceil((attempts.timestamp + 900000 - now) / 1000);
    throw new Error(`تم تجاوز الحد الأقصى لمحاولات تسجيل الدخول. يرجى المحاولة بعد ${timeRemaining} ثانية`);
  }

  return attempts;
}

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'طريقة غير مسموح بها' })
    };
  }

  const ip = event.headers['client-ip'] || event.headers['x-forwarded-for'];

  try {
    const { credential } = JSON.parse(event.body);

    // التحقق من محاولات تسجيل الدخول
    const attempts = checkLoginAttempts(ip);

    // التحقق من توكن Google
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    console.log('Payload:', payload);
    // التحقق من مجال البريد الإلكتروني إذا كان مطلوباً
    const hostedDomain = payload.hd;
    if (process.env.ALLOWED_DOMAINS) {
      const allowedDomains = process.env.ALLOWED_DOMAINS.split(',');
      if (!hostedDomain || !allowedDomains.includes(hostedDomain)) {
        throw new Error('نطاق البريد الإلكتروني غير مسموح به');
      }
    }

    // الاتصال بقاعدة البيانات
    await mongoClient.connect();
    const db = mongoClient.db('meftah-aloloom');
    const users = db.collection('users');

    // البحث عن المستخدم
    let user = await users.findOne({ email: payload.email });
    let isNewUser = false;

    if (!user) {
      // إنشاء مستخدم جديد
      user = {
        userId: payload.sub,
        name: payload.name,
        email: payload.email,
        picture: payload.picture,
        createdAt: new Date(),
        isProfileComplete: false
      };
      await users.insertOne(user);
      isNewUser = true;
    }

    // توليد التوكن
    const token = authMiddleware.generateToken(user, !user.isProfileComplete);

    // إعادة تعيين محاولات تسجيل الدخول عند النجاح
    loginAttempts.delete(ip);

    return {
      statusCode: 200,
      body: JSON.stringify({
        token,
        isNewUser,
        isProfileComplete: user.isProfileComplete || false,
        message: isNewUser ? 'تم إنشاء حساب جديد بنجاح' : 'تم تسجيل الدخول بنجاح'
      })
    };
  } catch (error) {
    console.error('خطأ في المصادقة:', error);

    // زيادة عدد محاولات تسجيل الدخول الفاشلة
    const attempts = loginAttempts.get(ip) || { count: 0, timestamp: Date.now() };
    attempts.count++;
    loginAttempts.set(ip, attempts);

    return {
      statusCode: error.message.includes('تم تجاوز الحد الأقصى') ? 429 : 401,
      body: JSON.stringify({
        error: true,
        message: error.message || 'فشل تسجيل الدخول'
      })
    };
  } finally {
    if (mongoClient) {
      await mongoClient.close();
    }
  }
};