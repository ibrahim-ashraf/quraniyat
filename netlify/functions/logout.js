const { MongoClient } = require('mongodb');
const { requireAuth } = require('./middleware/require-auth');

const mongoClient = new MongoClient(process.env.MONGODB_URI);

async function logoutHandler(event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'الطريقة غير مسموح بها' })
    };
  }

  try {
    await mongoClient.connect();
    const db = mongoClient.db('meftah-aloloom');
    const sessions = db.collection('sessions');

    // حذف جلسة المستخدم من قاعدة البيانات
    await sessions.deleteOne({ userId: event.user.userId });

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'تم تسجيل الخروج بنجاح'
      })
    };
  } catch (error) {
    console.error('خطأ في تسجيل الخروج:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'حدث خطأ أثناء تسجيل الخروج'
      })
    };
  } finally {
    await mongoClient.close();
  }
}

// تطبيق middleware المصادقة
exports.handler = requireAuth(logoutHandler);