// وظيفة Netlify لتسجيل الطلاب
const { MongoClient } = require('mongodb');
const fetch = require('node-fetch');

const uri = process.env.MONGODB_URI;
const baseURL = process.env.URL;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' }),
    };
  }

  // مثال لجسم الطلب
  const sampleBody = {
    "parent": {
      "name": "إبراهيم أشرف المتولى عبده",
      "gender": "ذكر",
      "relation": "أب",
      "otherRelation": "",
      "mainPhone": "+201094646815",
      "secondaryPhone": "+20121225087",
      "contactMethod": "واتساب"
    },
    "students": [
      {
        "name": "رانسي أحمد محمد الجوهري",
        "gender": "أنثى",
        "birthDate": "2015-03-13",
        "grade": "الرابع الابتدائي",
        "school": "معهد حانوت الأزهري",
        "memorizedParts": "17",
        "readingLevel": "جيد",
        "hasLearningDifficulties": "نعم",
        "difficultiesDetails": "تشتت",
        "notes": "لا\nشيء"
      }
    ]
  };

  const { formData, emailData } = JSON.parse(event.body);

  // إضافة تاريخ ووقت التسجيل إلى بيانات النموذج وبيانات البريد الإلكتروني
  const registrationDate = new Date().toISOString();
  formData.registrationDate = registrationDate;
  emailData.text += `\n\nتاريخ التسجيل: ${registrationDate}`;
  emailData.html += `<p>تاريخ التسجيل: ${registrationDate}</p>`;

  try {
    await client.connect();
    const database = client.db('meftah_aloloom');
    const childrenCollection = database.collection('childrenCollection');
    // طباعة البيانات قبل الإدراج
    console.log('Data to be inserted:', formData);

    // إدراج البيانات في قاعدة البيانات
    const result = await childrenCollection.insertOne(formData);

    // إرسال بريد إلكتروني باستخدام وظيفة sendEmail
    await fetch(`${baseURL}/.netlify/functions/sendEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Students registered successfully' }),
    };
  } catch (error) {
    console.error('Error registering students:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  } finally {
    await client.close();
  }
};