const { MongoClient } = require('mongodb');
const jwt = require('jsonwebtoken');
const { verifyToken } = require('./middleware/auth-middleware');

const mongoClient = new MongoClient(process.env.MONGODB_URI);

exports.handler = async function (event, context) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'الطريقة غير مسموح بها' })
    };
  }

  try {
    // التحقق من التوكن المؤقت
    const decoded = verifyToken(event);

    if (!decoded.isTemporary) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'نوع التوكن غير صالح' })
      };
    }

    const requestData = JSON.parse(event.body);
    const { fullName, userType, contactInfo, study } = requestData;

    // التحقق من البيانات المطلوبة
    if (!fullName || !userType || !contactInfo?.method) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'جميع الحقول المطلوبة غير مكتملة' })
      };
    }

    // التحقق من صحة نوع المستخدم
    if (!['student', 'teacher'].includes(userType)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'نوع المستخدم غير صالح' })
      };
    }

    // التحقق من طريقة التواصل
    if (!['email', 'phone', 'messenger', 'other'].includes(contactInfo.method)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'طريقة التواصل غير صالحة' })
      };
    }

    // الاتصال بقاعدة البيانات
    await mongoClient.connect();
    const db = mongoClient.db('meftah-aloloom');
    const users = db.collection('users');

    // البحث عن المستخدم وتحديثه
    const user = await users.findOne({ email: decoded.email });
    if (!user) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'المستخدم غير موجود' })
      };
    }

    // تجهيز البيانات للتحديث
    const updateData = {
      fullName,
      userType,
      contactInfo,
      isProfileComplete: true,
      updatedAt: new Date()
    };

    // إضافة معلومات الدراسة للطلاب
    if (userType === 'student' && study) {
      updateData.study = {
        sessionsPerMonth: study.sessionsPerMonth,
        childrenCount: study.childrenCount,
        baseCost: study.baseCost,
        finalCost: study.finalCost,
        discountPercentage: study.discountPercentage
      };
    }

    // تحديث بيانات المستخدم
    await users.updateOne(
      { email: decoded.email },
      { $set: updateData }
    );

    // إنشاء توكن دائم جديد
    const token = jwt.sign(
      {
        userId: user._id.toString(),
        email: decoded.email,
        name: fullName,
        userType
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'تم إكمال الملف الشخصي بنجاح',
        token
      })
    };
  } catch (error) {
    console.error('خطأ في إكمال الملف الشخصي:', error);
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
};