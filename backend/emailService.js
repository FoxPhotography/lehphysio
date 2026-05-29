const nodemailer = require('nodemailer');

// Set up transporter (only if environment variables are provided)
let transporter = null;

if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
  transporter = nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
  console.log('Nodemailer initialized with SMTP credentials.');
} else {
  console.log('⚠️ No email credentials found in environment variables. Email service is running in mock mode (verification codes will be printed to server console).');
}

/**
 * Sends a verification code to a user email.
 * @param {string} email 
 * @param {string} code 
 * @param {string} username 
 */
async function sendVerificationCode(email, code, username) {
  const mailOptions = {
    from: `"ليه فيزيو؟ 🏆" <${process.env.EMAIL_USER || 'no-reply@physioleague.com'}>`,
    to: email,
    subject: 'رمز تفعيل حساب ليه فيزيو؟ - Leh Physio? Verification Code',
    html: `
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
    `
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`Verification code successfully sent to email: ${email}`);
      return true;
    } catch (err) {
      console.error('Error sending email: ', err);
      // Fallback to mock behavior on error
      console.log(`[MOCK EMAIL FALLBACK] Verification code for ${email} (${username}): ${code}`);
      return false;
    }
  } else {
    // Mock mode
    console.log(`
======================================================
📧 [MOCK EMAIL SENT]
To: ${email} (${username})
Subject: Leh Physio? Verification Code
Code: ${code}
======================================================
    `);
    return true;
  }
}

module.exports = {
  sendVerificationCode
};
