const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const data = JSON.parse(event.body);
  const baseURL = process.env.URL;

  try {
    // Call reCAPTCHA verification function
    const recaptchaResponse = await fetch(`${baseURL}/.netlify/functions/verifyRecaptcha`, {
      method: 'POST',
      body: JSON.stringify(data.metadata),
    });

    const recaptchaResult = await recaptchaResponse.json();

    if (!recaptchaResponse.ok) {
      return {
        statusCode: recaptchaResponse.status,
        body: JSON.stringify(recaptchaResult),
      };
    }

    // Call MongoDB insert function
    const dbResponse = await fetch(`${baseURL}/.netlify/functions/insertData`, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    const dbResult = await dbResponse.json();

    if (!dbResponse.ok) {
      return {
        statusCode: dbResponse.status,
        body: JSON.stringify(dbResult),
      };
    }

    // Call SendGrid email function
    const emailResponse = await fetch(`${baseURL}/.netlify/functions/sendEmail`, {
      method: 'POST',
      body: JSON.stringify(data.adminEmail),
    });

    if (data.userEmail) {
      const emailResponse = await fetch(`${baseURL}/.netlify/functions/sendEmail`, {
        method: 'POST',
        body: JSON.stringify(data.userEmail),
      });
    }

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      return {
        statusCode: emailResponse.status,
        body: JSON.stringify(emailResult),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'All tasks completed successfully.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: `Error processing request. ${error.toString()}`, error: error.toString() }),
    };
  }
};