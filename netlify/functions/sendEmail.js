const sgMail = require('@sendgrid/mail');

exports.handler = async (event, context) => {
  const sendgridApiKey = process.env.SENDGRID_API_KEY;

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ message: 'Method Not Allowed' }) };
  }

  const { to, subject, text, html } = JSON.parse(event.body);
  console.log(JSON.parse(event.body));
  sgMail.setApiKey(sendgridApiKey);
  const msg = {
    from: 'quraniyat.platform@gmail.com',
    to,
    subject,
    text,
    html
  };

  try {
    await sgMail.send(msg);

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Email sent successfully.' }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Error sending email.', error: error.toString() })
    };
  }
};