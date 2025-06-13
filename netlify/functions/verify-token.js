const { requireAuth } = require('./middleware/require-auth');

async function handler(event, context) {
  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'توكن صالح',
      user: event.user
    })
  };
}

// استخدام middleware للتحقق من المصادقة
exports.handler = requireAuth(handler);