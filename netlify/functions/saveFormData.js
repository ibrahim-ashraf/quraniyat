const MongoClient = require('mongodb').MongoClient;

exports.handler = async (event, context) => {
  const mongodbURI = process.env.MONGODB_URI;
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const data = JSON.parse(event.body);
  console.log(data);
  console.log(mongodbURI);

  try {
    const client = await MongoClient.connect(mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    const db = client.db('quraniyat');
    const collection = db.collection('form_submissions');

    await collection.insertOne(data);

    client.close();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'تم حفظ البيانات بنجاح' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'حدث خطأ أثناء حفظ البيانات', error: error.toString() })
    };
  }
};