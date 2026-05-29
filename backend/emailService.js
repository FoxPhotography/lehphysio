const https = require('https');

/**
 * Sends a verification code to a user email via Resend API.
 * @param {string} email 
 * @param {string} code 
 * @param {string} username 
 */
async function sendVerificationCode(email, code, username) {
  const subject = 'رمز تفعيل حساب ليه فيزيو؟ - Leh Physio? Verification Code';
  const html = `
    <div style="direction: rtl; text-align: right; font-family: 'Cairo', sans-serif; background-color: #0f0a07; color: #f5e6cc; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #2e1a0e;">
      <h2 style="color: #e8a045; text-align: center;">مرحبًا بك في ليه فيزيو؟! 🏆</h2>
      <p>عزيزنا <strong>${username}</strong>،</p>
      <p>شكرًا لتسجيلك في منصة ليه فيزيو؟ لطلاب كلية العلاج الطبيعي بجامعة كفر الشيخ.</p>
      <p>لتفعيل حسابك والبدء في كسب نقاط الـ XP والتنافس في لوحة الصدارة، الرجاء استخدام رمز التفعيل التالي:</p>
      <div style="background-color: #1c1208; border: 1px dashed #c8621a; padding: 1rem; border-radius: 8px; text-align: center; margin: 1.5rem 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #e8a045; font-family: sans-serif;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #8a6a4a;">إذا لم تقم بطلب هذا الرمز، يرجى تجاهل هذا البريد الإلكتروني.</p>
      <hr style="border: none; border-top: 1px solid #2e1a0e; margin: 1.5rem 0;" />
      <p style="text-align: center; font-size: 12px; color: #8a6a4a;">بودكاست "ليه فيزيو؟" &copy; 2026</p>
    </div>
  `;

  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    if (!apiKey) {
      console.log('⚠️ No RESEND_API_KEY found in environment variables. Email service is running in mock mode.');
      console.log(`
======================================================
📧 [MOCK EMAIL SENT via Resend Mock]
To: ${email} (${username})
Subject: ${subject}
Code: ${code}
======================================================
      `);
      return resolve(true);
    }

    const postData = JSON.stringify({
      from: fromAddress,
      to: [email],
      subject: subject,
      html: html
    });

    const options = {
      hostname: 'api.resend.com',
      port: 443,
      path: '/emails',
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Verification code successfully sent to: ${email}`);
          resolve(true);
        } else {
          console.error(`Resend API returned error status ${res.statusCode}:`, body);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Error calling Resend API:', err.message);
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

module.exports = {
  sendVerificationCode
};
