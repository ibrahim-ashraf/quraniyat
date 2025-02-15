const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  const recaptchaSecret = process.env.RECAPTCHA_SECRET_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const data = JSON.parse(event.body);
  const recaptchaResponse = data['g-recaptcha-response'];

  if (!recaptchaResponse) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'reCAPTCHA response is required' }),
    };
  }

  const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${recaptchaSecret}&response=${recaptchaResponse}`;

  try {
    const recaptchaVerification = await fetch(verificationUrl, { method: 'POST' });
    const recaptchaResult = await recaptchaVerification.json();

    if (!recaptchaResult.success) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'reCAPTCHA verification failed', 'error-codes': recaptchaResult['error-codes'] }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'reCAPTCHA verification succeeded' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error verifying reCAPTCHA.', error: error.toString() })
    };
  }
};