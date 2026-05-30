const https = require('https');

/**
 * Send email via Brevo (Sendinblue) HTTP API.
 * Free tier: 300 emails/day. No custom domain needed.
 */
function sendViaBrevo(to, subject, html) {
  return new Promise((resolve) => {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
      console.log('Brevo API key not set, skipping...');
      return resolve(false);
    }

    const senderEmail = process.env.EMAIL_USER || 'lehphysio@gmail.com';
    const senderName = 'Leh Physio?';

    const postData = JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      to: [{ email: to }],
      subject: subject,
      htmlContent: html
    });

    const options = {
      hostname: 'api.brevo.com',
      port: 443,
      path: '/v3/smtp/email',
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      },
      timeout: 15000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Email sent via Brevo to: ${to}`);
          resolve(true);
        } else {
          console.error(`Brevo error ${res.statusCode}:`, body);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Brevo request error:', err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('Brevo request timed out');
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Send email via Resend HTTP API (fallback).
 */
function sendViaResend(to, subject, html) {
  return new Promise((resolve) => {
    const apiKey = process.env.RESEND_API_KEY;
    if (!apiKey) {
      return resolve(false);
    }

    const fromAddress = process.env.EMAIL_FROM || 'onboarding@resend.dev';

    const postData = JSON.stringify({
      from: fromAddress,
      to: [to],
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
      },
      timeout: 10000
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          console.log(`Email sent via Resend to: ${to}`);
          resolve(true);
        } else {
          console.error(`Resend error ${res.statusCode}:`, body);
          resolve(false);
        }
      });
    });

    req.on('error', (err) => {
      console.error('Resend request error:', err.message);
      resolve(false);
    });

    req.on('timeout', () => {
      req.destroy();
      resolve(false);
    });

    req.write(postData);
    req.end();
  });
}

/**
 * Primary send function - tries Brevo first, then Resend, then logs mock.
 */
async function sendEmail(to, subject, html) {
  console.log(`Sending email to ${to}...`);

  // 1. Try Brevo (HTTP API - works on Railway)
  const brevoResult = await sendViaBrevo(to, subject, html);
  if (brevoResult) return true;

  // 2. Try Resend (HTTP API)
  const resendResult = await sendViaResend(to, subject, html);
  if (resendResult) return true;

  // 3. Mock mode - log the code to console
  console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject}`);
  return false;
}

/**
 * Sends a verification code email.
 */
async function sendVerificationCode(email, code, username) {
  const subject = 'Leh Physio? - Verification Code';
  const html = `
    <div style="direction: ltr; text-align: left; font-family: sans-serif; background-color: #0f0a07; color: #f5e6cc; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #2e1a0e;">
      <h2 style="color: #e8a045; text-align: center;">Welcome to Leh Physio?! 🏆</h2>
      <p>Dear <strong>${username}</strong>,</p>
      <p>Thank you for registering on the Leh Physio? platform for Physical Therapy students at Kafrelsheikh University.</p>
      <p>To activate your account and start earning XP and competing on the leaderboard, please use the following verification code:</p>
      <div style="background-color: #1c1208; border: 1px dashed #c8621a; padding: 1rem; border-radius: 8px; text-align: center; margin: 1.5rem 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #e8a045;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #8a6a4a;">If you did not request this code, please ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #2e1a0e; margin: 1.5rem 0;" />
      <p style="text-align: center; font-size: 12px; color: #8a6a4a;">"Why Physio?" Podcast &copy; 2026</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

/**
 * Sends a password reset code email.
 */
async function sendResetPasswordCode(email, code, username) {
  const subject = 'Leh Physio? - Password Reset Code';
  const html = `
    <div style="direction: ltr; text-align: left; font-family: sans-serif; background-color: #0f0a07; color: #f5e6cc; padding: 2rem; border-radius: 12px; max-width: 600px; margin: 0 auto; border: 1px solid #2e1a0e;">
      <h2 style="color: #e8a045; text-align: center;">Reset Password 🔑</h2>
      <p>Dear <strong>${username}</strong>,</p>
      <p>We received a request to reset your password for Leh Physio? account.</p>
      <p>Please use the following 6-digit verification code to complete your password reset:</p>
      <div style="background-color: #1c1208; border: 1px dashed #c8621a; padding: 1rem; border-radius: 8px; text-align: center; margin: 1.5rem 0;">
        <span style="font-size: 32px; font-weight: 900; letter-spacing: 5px; color: #e8a045;">${code}</span>
      </div>
      <p style="font-size: 13px; color: #8a6a4a;">If you did not request a password reset, you can safely ignore this email.</p>
      <hr style="border: none; border-top: 1px solid #2e1a0e; margin: 1.5rem 0;" />
      <p style="text-align: center; font-size: 12px; color: #8a6a4a;">"Why Physio?" Podcast &copy; 2026</p>
    </div>
  `;

  return sendEmail(email, subject, html);
}

module.exports = {
  sendVerificationCode,
  sendResetPasswordCode
};
