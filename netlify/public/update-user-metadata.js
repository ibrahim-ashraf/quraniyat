const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // التحقق من الطريقة
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: 'طريقة غير مسموح بها'
    };
  }

  try {
    const { user } = context.clientContext;
    const { fullName, phone } = JSON.parse(event.body);

    // تحديث بيانات المستخدم
    const response = await fetch(`${process.env.URL}/.netlify/identity/user`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${user.token.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        user_metadata: {
          full_name: fullName,
          phone: phone
        }
      })
    });

    if (!response.ok) {
      throw new Error('فشل تحديث بيانات المستخدم');
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'تم تحديث البيانات بنجاح' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'حدث خطأ أثناء تحديث البيانات' })
    };
  }
};