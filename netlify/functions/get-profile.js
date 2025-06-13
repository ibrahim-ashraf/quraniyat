const { MongoClient } = require('mongodb');
const { requireAuth } = require('./middleware/require-auth');

const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function getProfileHandler(event, context) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'الطريقة غير مسموح بها' })
    };
  }

  try {
    // الاتصال بقاعدة البيانات
    await mongoClient.connect();
    const db = mongoClient.db('meftah-aloloom');
    const users = db.collection('users');

    // البحث عن المستخدم باستخدام معرف المستخدم من التوكن
    const user = await users.findOne({
      userId: event.user.userId
    });
    console.log('الجدول الزمني:', user.subjects);

    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'لم يتم العثور على المستخدم' })
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'تم جلب البيانات بنجاح',
        user
      })
    };
  } catch (error) {
    console.error('خطأ في جلب الملف الشخصي:', error);
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
exports.handler = requireAuth(getProfileHandler);