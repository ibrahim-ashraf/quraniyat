const twilio = require('twilio');
const rateLimit = require('./middleware/rate-limit');
const { validatePhone } = require('../public/utils');

const client = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

const handler = async (event) => {
    if (event.httpMethod !== 'POST') {
        return {
            statusCode: 405,
            body: JSON.stringify({ message: 'طريقة غير مسموح بها' })
        };
    }

    try {
        const { phone, email, code, verify, method } = JSON.parse(event.body);
        const verificationType = email ? 'email' : 'phone';
        const to = email || phone;

        // التحقق من صحة المدخلات
        if (verificationType === 'phone' && !validatePhone(to)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'رقم الهاتف غير صالح'
                })
            };
        } else if (verificationType === 'email' && !validateEmail(to)) {
            return {
                statusCode: 400,
                body: JSON.stringify({
                    success: false,
                    message: 'البريد الإلكتروني غير صالح'
                })
            };
        }

        // التحقق من الرمز
        if (verify) {
            try {
                const verificationCheck = await client.verify.v2
                    .services(process.env.TWILIO_VERIFY_SID)
                    .verificationChecks
                    .create({ to, code });

                if (verificationCheck.status === 'approved') {
                    return {
                        statusCode: 200,
                        body: JSON.stringify({
                            success: true,
                            message: verificationType === 'email' ?
                                'تم التحقق من البريد الإلكتروني بنجاح' :
                                'تم التحقق من رقم الهاتف بنجاح'
                        })
                    };
                } else {
                    return {
                        statusCode: 400,
                        body: JSON.stringify({
                            success: false,
                            message: 'رمز التحقق غير صحيح'
                        })
                    };
                }
            } catch (error) {
                console.error('خطأ في التحقق من الرمز:', error);
                return {
                    statusCode: 400,
                    body: JSON.stringify({
                        success: false,
                        message: 'رمز التحقق غير صحيح أو منتهي الصلاحية'
                    })
                };
            }
        }

        // إرسال رمز جديد
        try {
            const channel = verificationType === 'email' ? 'email' : (method || 'sms');
            await client.verify.v2
                .services(process.env.TWILIO_VERIFY_SID)
                .verifications
                .create({ to, channel });

            return {
                statusCode: 200,
                body: JSON.stringify({
                    success: true,
                    message: 'تم إرسال رمز التحقق بنجاح'
                })
            };
        } catch (error) {
            console.error('خطأ في إرسال رمز التحقق:', error);
            return {
                statusCode: 500,
                body: JSON.stringify({
                    success: false,
                    message: error.message || 'حدث خطأ في إرسال رمز التحقق'
                })
            };
        }
    } catch (error) {
        console.error('خطأ في عملية التحقق:', error);
        return {
            statusCode: error.status || 500,
            body: JSON.stringify({
                success: false,
                message: error.message || 'حدث خطأ في عملية التحقق'
            })
        };
    }
};

// تطبيق middleware تقييد معدل الطلبات
exports.handler = rateLimit.checkRateLimit(10, 60000)(handler);