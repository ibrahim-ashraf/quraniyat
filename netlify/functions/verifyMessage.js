const twilio = require('twilio');

exports.handler = async function(event, context) {
    const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID } = process.env;
    const client = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

    const { to, code } = JSON.parse(event.body);

    try {
        const verificationCheck = await client.verify.services(TWILIO_VERIFY_SID)
            .verificationChecks
            .create({
                to,
                code
            });

        if (verificationCheck.status === 'approved') {
            return {
                statusCode: 200,
                body: JSON.stringify({ message: 'Phone number verification successful!' })
            }
        } else {
            return {
                statusCode: 400,
                body: JSON.stringify({ error: 'Invalid verification code provided.' })
            }
        }
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message })
        }
    }
}