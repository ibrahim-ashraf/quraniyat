const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const { requireAuth } = require('./middleware/require-auth');

const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function updateProfileHandler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'الطريقة غير مسموح بها' })
    };
  }

  try {
    const userData = JSON.parse(event.body);

    // الاتصال بقاعدة البيانات
    await mongoClient.connect();
    const db = mongoClient.db('meftah-aloloom');
    const users = db.collection('users');

    // تجهيز البيانات للتحديث
    const updateData = {
      ...userData,
      updatedAt: new Date()
    };

    // تحديث بيانات المستخدم
    const result = await users.updateOne(
      { userId: event.user.userId },
      { $set: updateData }
    );

    // الحصول على المستخدم المحدث
    const updatedUser = await users.findOne({ userId: event.user.userId });

    // إنشاء توكن جديد يحتوي على البيانات المحدثة
    const token = jwt.sign(updatedUser,
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'تم تحديث البيانات بنجاح',
        token
      })
    };
  } catch (error) {
    console.error('خطأ في تحديث الملف الشخصي:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'حدث خطأ داخلي في الخادم',
        error: error.message
      })
    };
  } finally {
    await mongoClient.close();
  }
}

// تطبيق middleware المصادقة على الوظيفة
exports.handler = requireAuth(updateProfileHandler);