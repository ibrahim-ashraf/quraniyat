const fetch = require('node-fetch');
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

exports.handler = async (event, context) => {
    const baseURL = process.env.URL;
    try {
        const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
        const key = process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n');

        const spreadsheetId = '127292rLXgw8l6GBPHT_NZBx7rnbwZkniqrQFtxv3ams';
        const sheetTitle = 'بيانات نموذج التقديم';

        const auth = new JWT({
            email,
            key,
            scopes: ['https://www.googleapis.com/auth/spreadsheets'],
        });

        const doc = new GoogleSpreadsheet(spreadsheetId, auth);

        await doc.loadInfo();

        const sheet = doc.sheetsByTitle[sheetTitle];

        const data = Object.values(JSON.parse(event.body));
        console.log(data);
        const row = await sheet.addRow(data);

        const emailData = {
            // to: ['ibrahimashrafabdo@gmail.com', 'alcoranalkreem12345@gmail.com', 'mostafaelraei3@gmail.com'],
            to: ['ibrahimashrafabdo@gmail.com'],
            subject: `تسجيل جديد في المسابقة الرمضانية للقرآن الكريم برقم ${row.rowNumber - 1}`,
            text: `
السلام عليكم ورحمة الله وبركاته

تم استلام تسجيل جديد في المسابقة الرمضانية للقرآن الكريم 1446هـ

بيانات المتسابق:
------------------
الاسم الرباعي: ${data[1]}
النوع: ${data[2]}
تاريخ الميلاد: ${data[3]}
رقم الهاتف: ${data[4]}
الجهة التعليمية: ${data[5]}
السنة الدراسية: ${data[6]}

معلومات الحفظ:
------------------
عدد الأجزاء المحفوظة: ${data[7]}
السور المحفوظة: ${data[8]}
المشاركة السابقة: ${data[9]}

تم التسجيل بتاريخ: ${data[0]}

مع خالص التحيات
نظام التسجيل الآلي - المسابقة الرمضانية للقرآن الكريم
`,
            html: `<!DOCTYPE html>
      <html dir="rtl" lang="ar">
      <head>
          <meta charset="UTF-8">
          <style>
              body {
                  font-family: Arial, sans-serif;
                  line-height: 1.6;
                  color: #333;
                  max-width: 600px;
                  margin: 0 auto;
                  padding: 20px;
              }
              .header {
                  border-bottom: 2px solid #4CAF50;
                  margin-bottom: 20px;
                  padding-bottom: 10px;
              }
              .section {
                  background-color: #f9f9f9;
                  border-radius: 5px;
                  padding: 15px;
                  margin-bottom: 15px;
              }
              .section-title {
                  color: #2E7D32;
                  font-size: 18px;
                  margin-top: 0;
                  margin-bottom: 10px;
              }
              .info-row {
                  margin-bottom: 8px;
              }
              .label {
                  font-weight: bold;
                  color: #555;
              }
              .footer {
                  border-top: 1px solid #ddd;
                  margin-top: 20px;
                  padding-top: 10px;
                  font-size: 14px;
                  color: #666;
              }
          </style>
      </head>
      <body>
          <div class="header">
              <h1 style="margin: 0; color: #1B5E20;">تسجيل جديد في المسابقة الرمضانية للقرآن الكريم</h1>
          </div>

          <p>السلام عليكم ورحمة الله وبركاته</p>
          <p>تم استلام تسجيل جديد في المسابقة الرمضانية للقرآن الكريم 1447هـ 2027م</p>

          <div class="section">
              <h2 class="section-title">بيانات المتسابق</h2>
              <div class="info-row">
                  <span class="label">الاسم الرباعي:</span>
                  <span>${data[1]}</span>
              </div>
              <div class="info-row">
                  <span class="label">النوع:</span>
                  <span>${data[2]}</span>
              </div>
              <div class="info-row">
                  <span class="label">تاريخ الميلاد:</span>
                  <span>${data[3]}</span>
              </div>
              <div class="info-row">
                  <span class="label">رقم الهاتف:</span>
                  <span>${data[4]}</span>
              </div>

              <div class="info-row">
                  <span class="label">الجهة التعليمية:</span>
                  <span>${data[5]}</span>
              </div>
              <div class="info-row">
                  <span class="label">السنة الدراسية:</span>
                  <span>${data[6]}</span>
              </div>
          </div>

          <div class="section">
              <h2 class="section-title">بيانات الحفظ</h2>
              <div class="info-row">
                  <span class="label">عدد الأجزاء المحفوظة:</span>
                  <span>${data[7]}</span>
              </div>
              <div class="info-row">
                  <span class="label">السور المحفوظة:</span>
                  <span>${data[8]}</span>
              </div>
              <div class="info-row">
                  <span class="label">دراسة علم التجويد؟</span>
                  <span>${data[9]}</span>
              </div>
              <div class="info-row">
                  <span class="label">المتون المحفوظة:</span>
                  <span>${data[10]}</span>
              </div>
              <div class="info-row">
                  <span class="label">نهاية الدراسة النظرية:</span>
                  <span>${data[11]}</span>
              </div>
              <div class="info-row">
                  <span class="label">المشاركة السابقة:</span>
                  <span>${data[12]}</span>
              </div>
          </div>

          <div class="footer">
              <div class="info-row">
                  <span class="label">تم التسجيل بتاريخ:</span>
                  <span>${data[0]}</span>
              </div>
              <p style="margin-top: 20px;">
                  مع خالص التحيات<br>
                  نظام التسجيل الآلي - المسابقة الرمضانية للقرآن الكريم
              </p>
          </div>
      </body>
      </html>`
        };

        await fetch(`${baseURL}/.netlify/functions/sendEmail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(emailData),
        });
        return {
            statusCode: 200,
            body: JSON.stringify({ message: '🌟 مبارك! تم التسجيل! لقد وصلت بياناتكم بنجاح إلى القائمين على المسابقة. 📝✨' }),
        };
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ error: error.message }),
        };
    }
};
