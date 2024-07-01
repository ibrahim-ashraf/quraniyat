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
    console.log('Connecting to MongoDB...');
    const client = await MongoClient.connect(mongodbURI, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log('Connected to MongoDB');

    const db = client.db('quraniyat');
    const collection = db.collection('form_submissions');

    console.log('Inserting data...');
    await collection.insertOne(data);
    console.log('Data inserted successfully');

    client.close();
    console.log('Connection closed');

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