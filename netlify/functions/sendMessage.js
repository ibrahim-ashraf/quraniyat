const twilio = require('twilio');

exports.handler = async function (event, context) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
    console.log(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID);
    const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);
    const { to, channel, body } = JSON.parse(event.body);
    console.log(to, channel, body);
    if (channel === 'call') {
        try {
            await client.verify.services(TWILIO_VERIFY_SID)
                .verifications
                .create({ to, channel: 'call' });
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Verification call initiated successfully!' })
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
            };
        }
    } else if (channel === 'sms') {
        try {
            await client.verify.services(TWILIO_VERIFY_SID)
                .verifications
                .create({ to, channel: 'sms' });
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Verification code sent successfully!' })
            };
        } catch (error) {
            return {
                statusCode: 500,
                body: JSON.stringify({ error: error.message })
            };
        }
    } else {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: 'Invalid channel provided.' })
        };
    }
};