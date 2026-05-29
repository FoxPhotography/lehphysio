const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'physioleague_super_secret_key_123';

function authMiddleware(req, res, next) {
  const authHeader = req.headers['authorization'];
  if (!authHeader) {
    return res.status(401).json({ error: 'لم يتم توفير رمز التحقق (Token). الرجاء تسجيل الدخول.' });
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'تنسيق الرمز غير صحيح.' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'رمز التحقق غير صالح أو انتهت صلاحيته.' });
  }
}

module.exports = {
  authMiddleware,
  JWT_SECRET
};
