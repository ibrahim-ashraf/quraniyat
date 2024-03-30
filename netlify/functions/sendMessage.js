const twilio = require('twilio');

exports.handler = async function(event, context) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
  const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

  const { to, channel, body } = JSON.parse(event.body);

  if (channel === 'sms') {
    try {
        await client.verify.services(TWILIO_VERIFY_SID)
        .verifications
        .create({ to, channel: 'sms' });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Verification code sent successfully!' })
        }
    } catch (error) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: error.message })
      }
    }
  } else if (channel === 'email') {
    // تحقق من عنوان البريد الإلكتروني للمرسل والمستلم وأرسل الرسالة عبر البريد الإلكتروني
    return {
      statusCode: 501,
      body: JSON.stringify({ error: 'Email functionality not implemented yet.' })
    }
  } else {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid channel provided.' })
    }
  }
}