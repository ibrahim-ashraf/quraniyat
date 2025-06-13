const { MongoClient } = require('mongodb');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'طريقة غير مسموح بها' })
    };
  }

  const client = new MongoClient(process.env.MONGODB_URI);

  try {
    const errorLog = JSON.parse(event.body);

    // إضافة معلومات إضافية للسجل
    errorLog.ip = event.headers['x-forwarded-for'] || event.headers['client-ip'];
    errorLog.userAgent = event.headers['user-agent'];
    errorLog.referer = event.headers['referer'];
    errorLog.timestamp = new Date();

    await client.connect();
    const db = client.db('quraniyat');
    const collection = db.collection('error_logs');

    await collection.insertOne(errorLog);

    // إرسال إشعار للمسؤول في حالة الأخطاء الحرجة
    if (errorLog.type === 'critical') {
      // TODO: إضافة آلية إرسال إشعارات للمسؤول
    }

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'تم تسجيل الخطأ بنجاح' })
    };
  } catch (error) {
    console.error('خطأ في تسجيل الخطأ:', error);

    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'فشل في تسجيل الخطأ',
        error: error.message
      })
    };
  } finally {
    await client.close();
  }
};