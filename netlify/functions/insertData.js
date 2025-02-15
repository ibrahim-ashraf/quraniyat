const { MongoClient } = require('mongodb');

const uri = process.env.MONGODB_URI;
const client = new MongoClient(uri);

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const data = JSON.parse(event.body);

  try {
    await client.connect();
    const database = client.db('quraniyat');
    const collection = database.collection(data.metadata.databaseCollectionName);

    const result = await collection.insertOne(data.userData);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Data inserted successfully', id: result.insertedId }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error inserting data', error: error.toString() }),
    };
  } finally {
    await client.close();
  }
};