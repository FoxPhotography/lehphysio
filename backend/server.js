require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { authMiddleware, JWT_SECRET } = require('./authMiddleware');
const { sendVerificationCode, sendResetPasswordCode } = require('./emailService');

const activeUsers = new Map(); // username -> timestamp

function getLocalDateString() {
  const d = new Date();
  const offset = d.getTimezoneOffset();
  const localDate = new Date(d.getTime() - (offset * 60000));
  return localDate.toISOString().split('T')[0];
}

function getExpirationDate(duration) {
  if (duration === 'permanent' || !duration) return null;
  const match = duration.match(/^(\d+)(h|d|w)$/);
  if (!match) return null;
  const val = parseInt(match[1], 10);
  const unit = match[2];
  const msMap = { h: 3600000, d: 86400000, w: 604800000 };
  return new Date(Date.now() + val * msMap[unit]).toISOString();
}

async function checkModerationStatus(userId) {
  try {
    const user = await db.get('SELECT is_muted, mute_expires_at, is_banned, ban_expires_at FROM users WHERE id = ?', [userId]);
    if (!user) return { banned: false, muted: false };
    
    const now = new Date();
    
    let banned = !!user.is_banned;
    if (banned && user.ban_expires_at) {
      if (new Date(user.ban_expires_at) < now) {
        await db.run('UPDATE users SET is_banned = 0, ban_expires_at = NULL WHERE id = ?', [userId]);
        banned = false;
      }
    }
    
    let muted = !!user.is_muted;
    if (muted && user.mute_expires_at) {
      if (new Date(user.mute_expires_at) < now) {
        await db.run('UPDATE users SET is_muted = 0, mute_expires_at = NULL WHERE id = ?', [userId]);
        muted = false;
      }
    }
    
    return { banned, muted, ban_expires_at: user.ban_expires_at, mute_expires_at: user.mute_expires_at };
  } catch (err) {
    console.error('Error in checkModerationStatus:', err);
    return { banned: false, muted: false };
  }
}



// Admin Authentication Middleware (Loads role dynamically from database)
const adminMiddleware = [authMiddleware, async (req, res, next) => {
  try {
    const user = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized. This page is reserved for admins only.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while checking permissions.' });
  }
}];

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Serve static frontend in production
const path = require('path');
app.use(express.static(path.join(__dirname, '../frontend/dist')));

// Dynamic Rank Calculator Helper
function getRank(xp) {
  if (xp >= 6000) return { name_ar: 'Rehab Legend', name_en: 'Rehab Legend', emoji: '👑', tier: 5 };
  if (xp >= 3000) return { name_ar: 'Neurogenic', name_en: 'Neurogenic', emoji: '🧠', tier: 4 };
  if (xp >= 1500) return { name_ar: 'Ortho King', name_en: 'Ortho King', emoji: '🦴', tier: 3 };
  if (xp >= 500) return { name_ar: 'Pain Specialist', name_en: 'Pain Specialist', emoji: '⚡', tier: 2 };
  return { name_ar: 'Anatomy Rookie', name_en: 'Anatomy Rookie', emoji: '🧪', tier: 1 };
}

// Seeding function to populate dummy data if empty
async function seedDatabase() {
  try {
    const episodesCount = await db.get('SELECT COUNT(*) as count FROM episodes');
    if (episodesCount.count === 0) {
      console.log('Seeding initial episodes and XP codes...');
      
      const ep1 = await db.run(
        `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Episode 1: Intro to Physical Therapy & Career Secrets',
          'Episode 1: Intro to Physical Therapy & Career Secrets',
          'In this episode, we talk with Dr. Ahmed Ali about the basics of physical therapy and common misconceptions.',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
          new Date().toISOString()
        ]
      );

      const ep2 = await db.run(
        `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Episode 2: Lower Limb Anatomy & Biomechanics',
          'Episode 2: Lower Limb Anatomy & Biomechanics',
          'A detailed explanation of knee and ankle anatomy, major sports injuries, and treatment methods.',
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          new Date().toISOString()
        ]
      );

      const ep3 = await db.run(
        `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'Episode 3: Sports Injuries & ACL Rehabilitation',
          'Episode 3: Sports Injuries & ACL Rehabilitation',
          'The journey of full recovery after ACL surgery from day one until returning to the field.',
          'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=600&q=80',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          new Date().toISOString()
        ]
      );

      // Seed Quizzes for the episodes
      await db.run(
        `INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward) VALUES (?, ?, ?, ?, ?)`,
        [
          ep1.id,
          "What is the body's first line of defense for treating movement problems?",
          JSON.stringify(['Painkillers', 'Complete Rest', 'Therapeutic Exercises & Correct Diagnosis', 'Surgical Operations']),
          2, // 'Therapeutic Exercises & Correct Diagnosis'
          150
        ]
      );

      await db.run(
        `INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward) VALUES (?, ?, ?, ?, ?)`,
        [
          ep2.id,
          'What is the largest muscle in the posterior thigh region?',
          JSON.stringify(['Biceps Femoris', 'Semitendinosus', 'Semimembranosus', 'Rectus Femoris']),
          0, // 'Biceps Femoris'
          150
        ]
      );

      await db.run(
        `INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward) VALUES (?, ?, ?, ?, ?)`,
        [
          ep3.id,
          'How long does ACL rehabilitation take at minimum to return to the field?',
          JSON.stringify(['1-2 months', '3-4 months', '6-9 months', 'More than 2 years']),
          2, // '6-9 months'
          150
        ]
      );

      // Seed some XP Codes
      // 1. Episode secret code
      await db.run(
        `INSERT INTO xp_codes (code, xp_reward, type, episode_id, max_uses, current_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['EP1_SECRET', 100, 'episode', ep1.id, 200, 0, '2030-12-31', new Date().toISOString()]
      );
      await db.run(
        `INSERT INTO xp_codes (code, xp_reward, type, episode_id, max_uses, current_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        ['EP2_SECRET', 100, 'episode', ep2.id, 200, 0, '2030-12-31', new Date().toISOString()]
      );
      // 2. Social Media Codes
      await db.run(
        `INSERT INTO xp_codes (code, xp_reward, type, max_uses, current_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['INSTA_POST', 50, 'social', 1000, 0, '2030-12-31', new Date().toISOString()]
      );
      await db.run(
        `INSERT INTO xp_codes (code, xp_reward, type, max_uses, current_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        ['FACEBOOK_50', 50, 'social', 1000, 0, '2030-12-31', new Date().toISOString()]
      );

      // Seed a mini game
      await db.run(
        `INSERT INTO mini_games (name, subject, game_type, game_data, created_at) VALUES (?, ?, ?, ?, ?)`,
        [
          'Shoulder Muscles Labeling',
          'Anatomy',
          'trivia',
          JSON.stringify({
            questions: [
              { q: 'Which muscle is responsible for abducting the arm to 90 degrees?', options: ['Deltoid', 'Supraspinatus', 'Infraspinatus', 'Subscapularis'], correct: 0 },
              { q: 'Which of the Rotator Cuff muscles performs Internal Rotation?', options: ['Supraspinatus', 'Infraspinatus', 'Teres Minor', 'Subscapularis'], correct: 3 },
              { q: 'What is the nerve that supplies the Deltoid muscle?', options: ['Axillary nerve', 'Radial nerve', 'Median nerve', 'Ulnar nerve'], correct: 0 }
            ]
          }),
          new Date().toISOString()
        ]
      );

      console.log('Seeding completed successfully.');
    }
  } catch (err) {
    console.error('Error seeding database: ', err.message);
  }
}

// Run Seeder
ensureAdminUser().then(() => {
  return seedDatabase();
}).then(() => {
  seedChat();
});

async function ensureAdminUser() {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('admin123', salt);
    const admins = ['admin', 'admin1', 'admin2', 'admin3'];
    
    for (const adminName of admins) {
      const adminUser = await db.get('SELECT * FROM users WHERE username = ?', [adminName]);
      if (!adminUser) {
        console.log(`Seeding ${adminName} user...`);
        await db.run(
          `INSERT INTO users (username, email, password_hash, batch, total_xp, is_verified, role, created_at) 
           VALUES (?, ?, ?, ?, 0, 1, ?, ?)`,
          [adminName, `${adminName}@physio.com`, passwordHash, 'Admin Staff', 'admin', new Date().toISOString()]
        );
      } else {
        console.log(`${adminName} user already exists. Ensuring correct role and password...`);
        await db.run(
          `UPDATE users SET password_hash = ?, role = ? WHERE username = ?`,
          [passwordHash, 'admin', adminName]
        );
      }
    }
  } catch (err) {
    console.error('Error ensuring admin users:', err.message);
  }
}

async function seedChat() {
  try {
    const chatCount = await db.get('SELECT COUNT(*) as count FROM chat_messages');
    if (chatCount.count === 0) {
      console.log('Seeding mock chat messages...');
      
      const mockUsers = [
        { username: 'nour_rehab', email: 'nour@physio.com', xp: 6200, batch: 'PT 9' },
        { username: 'ahmed_physio', email: 'ahmed@physio.com', xp: 3200, batch: 'PT 10' },
        { username: 'omar_ortho', email: 'omar@physio.com', xp: 1200, batch: 'PT 11' },
        { username: 'sara_anatomy', email: 'sara@physio.com', xp: 250, batch: 'PT 14' }
      ];

      const userIds = {};
      const genericHash = await bcrypt.hash('password123', 10);

      for (const u of mockUsers) {
        let userRow = await db.get('SELECT id FROM users WHERE username = ?', [u.username]);
        if (!userRow) {
          const result = await db.run(
            `INSERT INTO users (username, email, password_hash, batch, total_xp, is_verified, created_at) 
             VALUES (?, ?, ?, ?, ?, 1, ?)`,
            [u.username, u.email, genericHash, u.batch, u.xp, new Date().toISOString()]
          );
          userIds[u.username] = result.id;
        } else {
          userIds[u.username] = userRow.id;
        }
      }

      const msgs = [
        { user: 'sara_anatomy', text: 'Hello everyone! I just registered on the platform today, it is really an amazing idea! 😍' },
        { user: 'omar_ortho', text: 'Welcome Sara! Glad to have you here. Did you find the secret code in Episode 1?' },
        { user: 'sara_anatomy', text: 'No not yet, where is it exactly?' },
        { user: 'ahmed_physio', text: "You will find it at minute 12:45 during Dr. Ahmed Ali's talk about career secrets 😉" },
        { user: 'nour_rehab', text: 'Hey guys! Episode 2 quiz is out with knee biomechanics questions. Who solved it and maxed the XP?' },
        { user: 'omar_ortho', text: 'I solved it Dr. Nour! But the second question about Biceps Femoris got me a bit confused 😂' },
        { user: 'ahmed_physio', text: 'Biceps Femoris does knee flexion and hip extension. Focus Omar, anatomy is the foundation of everything 🦴' }
      ];

      let baseTime = Date.now() - 3600000; // 1 hour ago
      for (const m of msgs) {
        await db.run(
          `INSERT INTO chat_messages (user_id, message, created_at) VALUES (?, ?, ?)`,
          [userIds[m.user], m.text, new Date(baseTime).toISOString()]
        );
        baseTime += 300000; // increment by 5 mins
      }
      console.log('Mock chat messages seeded successfully.');
    }
  } catch (err) {
    console.error('Error seeding chat messages:', err.message);
  }
}

// --- API ROUTES ---

const mongoose = require('mongoose');
app.get('/api/health', async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };
    res.json({
      status: 'OK',
      database: states[dbState] || 'unknown',
      env: {
        PORT: process.env.PORT,
        HAS_MONGO_URI: !!(process.env.MONGODB_URI || process.env.MONGO_URI),
        HAS_EMAIL_USER: !!process.env.EMAIL_USER,
        HAS_EMAIL_PASS: !!process.env.EMAIL_PASS,
        HAS_RESEND_KEY: !!process.env.RESEND_API_KEY,
        EMAIL_USER_VALUE: process.env.EMAIL_USER ? process.env.EMAIL_USER.substring(0, 5) + '***' : 'NOT SET',
        EMAIL_PASS_LENGTH: process.env.EMAIL_PASS ? process.env.EMAIL_PASS.length : 0
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Temporary test email endpoint - REMOVE after debugging
app.get('/api/test-email', async (req, res) => {
  const startTime = Date.now();

  try {
    const { sendVerificationCode } = require('./emailService');
    const recipient = req.query.email || process.env.EMAIL_USER || 'lehphysio@gmail.com';
    const result = await sendVerificationCode(
      recipient,
      '123456',
      'TestUser'
    );
    
    const elapsed = Date.now() - startTime;
    res.json({
      success: result,
      elapsed: elapsed + 'ms',
      recipient: recipient,
      configuredGoogleScript: !!process.env.GOOGLE_SCRIPT_URL
    });
  } catch (err) {
    const elapsed = Date.now() - startTime;
    res.status(500).json({
      success: false,
      elapsed: elapsed + 'ms',
      error: err.message
    });
  }
});



// 1. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, batch } = req.body;

  if (!username || !email || !password || !batch) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username.trim(), email.trim()]);
    if (existingUser) {
      if (existingUser.is_verified === 1) {
        return res.status(400).json({ error: 'Username or email is already registered.' });
      } else {
        // Delete unverified user to allow re-registration
        await db.run('DELETE FROM users WHERE id = ?', [existingUser.id]);
      }
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Generate 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Insert user
    await db.run(
      `INSERT INTO users (username, email, password_hash, batch, verification_code, is_verified, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [username.trim(), email.trim(), passwordHash, batch, verificationCode, 0, new Date().toISOString()]
    );

    // Send email code in background
    sendVerificationCode(email.trim(), verificationCode, username.trim()).catch(err => {
      console.error('Background verification email sending failed:', err);
    });

    res.status(201).json({ message: 'Registration successful. Please check your email for the activation code.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during registration.' });
  }
});

// 2. Auth: Verify Code
app.post('/api/auth/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'Please enter email and activation code.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (!user) {
      return res.status(404).json({ error: 'This account does not exist.' });
    }

    if (user.is_verified === 1) {
      return res.status(400).json({ error: 'This account is already verified.' });
    }

    if (user.verification_code !== code.toString().trim()) {
      return res.status(400).json({ error: 'Invalid activation code.' });
    }

    // Update status
    await db.run('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [user.id]);

    // Issue JWT Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'Account activated successfully!',
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        batch: user.batch,
        total_xp: user.total_xp,
        weekly_xp: user.weekly_xp,
        streak_count: user.streak_count,
        role: user.role || 'user',
        rank: getRank(user.total_xp),
        last_surprise_box_date: user.last_surprise_box_date,
        last_spin_wheel_date: user.last_spin_wheel_date,
        is_muted: user.is_muted || 0,
        mute_expires_at: user.mute_expires_at,
        is_banned: user.is_banned || 0,
        ban_expires_at: user.ban_expires_at
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during account activation.' });
  }
});

// 2.5 Auth: Forgot Password
app.post('/api/auth/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Please enter your email address.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (!user) {
      return res.status(404).json({ error: 'No account registered with this email.' });
    }

    if (user.is_verified === 0) {
      return res.status(400).json({ error: 'This account is not activated yet. Please register again to receive a new activation code.' });
    }

    // Generate 6-digit code
    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Save code
    await db.run('UPDATE users SET verification_code = ? WHERE id = ?', [resetCode, user.id]);

    // Send email in background
    sendResetPasswordCode(email.trim(), resetCode, user.username).catch(err => {
      console.error('Background reset email sending failed:', err);
    });

    res.json({ message: 'Password reset code has been sent to your email.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error occurred while processing request.' });
  }
});

// 2.6 Auth: Reset Password
app.post('/api/auth/reset-password', async (req, res) => {
  const { email, code, newPassword } = req.body;

  if (!email || !code || !newPassword) {
    return res.status(400).json({ error: 'Please fill in all required fields.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (!user) {
      return res.status(404).json({ error: 'Account not found.' });
    }

    if (!user.verification_code || user.verification_code !== code.toString().trim()) {
      return res.status(400).json({ error: 'Reset code is incorrect or expired.' });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    // Update password and clear verification code
    await db.run(
      'UPDATE users SET password_hash = ?, verification_code = ? WHERE id = ?',
      [passwordHash, null, user.id]
    );

    res.json({ message: 'Password reset successfully! You can now log in.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while resetting the password.' });
  }
});

// 3. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Please enter username and password.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username.trim(), username.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'Incorrect username or password.' });
    }

    if (user.is_verified === 0) {
      return res.status(400).json({ error: 'Please activate your account first using the code sent to your email.' });
    }

    // Check ban
    const mod = await checkModerationStatus(user.id);
    if (mod.banned) {
      const expiryText = mod.ban_expires_at ? `until ${new Date(mod.ban_expires_at).toLocaleString()}` : 'permanently';
      return res.status(403).json({ error: `Your account is banned ${expiryText}.` });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Incorrect username or password.' });
    }

    // --- Streak & Daily Login Logic ---
    let updatedTotalXp = user.total_xp;
    let updatedWeeklyXp = user.weekly_xp;
    let updatedStreak = user.streak_count;
    const todayStr = new Date().toISOString().split('T')[0];
    const yesterdayStr = new Date(Date.now() - 86400000).toISOString().split('T')[0];
    let dailyLoginAwarded = false;
    let streakAwarded = false;

    if (user.last_login_date !== todayStr) {
      // 1. Give Daily Login XP (+10 XP)
      updatedTotalXp += 10;
      updatedWeeklyXp += 10;
      dailyLoginAwarded = true;

      // 2. Calculate Streak
      if (user.last_login_date === yesterdayStr) {
        // Consecutive login
        updatedStreak += 1;
        // 7-day Streak Bonus (+70 XP)
        if (updatedStreak % 7 === 0) {
          updatedTotalXp += 70;
          updatedWeeklyXp += 70;
          streakAwarded = true;
        }
      } else {
        // Streak broken or brand new login
        updatedStreak = 1;
      }

      // Save changes to Database
      await db.run(
        'UPDATE users SET total_xp = ?, weekly_xp = ?, streak_count = ?, last_login_date = ? WHERE id = ?',
        [updatedTotalXp, updatedWeeklyXp, updatedStreak, todayStr, user.id]
      );
    }

    // Issue JWT Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        batch: user.batch,
        total_xp: updatedTotalXp,
        weekly_xp: updatedWeeklyXp,
        streak_count: updatedStreak,
        role: user.role || 'user',
        rank: getRank(updatedTotalXp),
        last_surprise_box_date: user.last_surprise_box_date,
        last_spin_wheel_date: user.last_spin_wheel_date,
        is_muted: mod.muted ? 1 : 0,
        mute_expires_at: mod.mute_expires_at,
        is_banned: mod.banned ? 1 : 0,
        ban_expires_at: mod.ban_expires_at
      },
      rewards: {
        daily_login: dailyLoginAwarded,
        streak_bonus: streakAwarded
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during login.' });
  }
});

// 4. Auth: Get Current Profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const mod = await checkModerationStatus(req.user.id);
    if (mod.banned) {
      const expiryText = mod.ban_expires_at ? `until ${new Date(mod.ban_expires_at).toLocaleString()}` : 'permanently';
      return res.status(403).json({ error: `Your account is banned ${expiryText}.` });
    }

    const user = await db.get('SELECT id, username, email, batch, total_xp, weekly_xp, streak_count, last_login_date, role, last_surprise_box_date, last_spin_wheel_date, is_muted, mute_expires_at, is_banned, ban_expires_at FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }

    res.json({
      user: {
        ...user,
        is_muted: mod.muted ? 1 : 0,
        mute_expires_at: mod.mute_expires_at,
        is_banned: mod.banned ? 1 : 0,
        ban_expires_at: mod.ban_expires_at,
        role: user.role || 'user',
        rank: getRank(user.total_xp)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching profile.' });
  }
});

// --- EPISODES ROUTES ---

// Get all episodes
app.get('/api/episodes', async (req, res) => {
  try {
    const episodes = await db.all('SELECT * FROM episodes ORDER BY id DESC');
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while fetching episodes.' });
  }
});

// Get single episode
app.get('/api/episodes/:id', async (req, res) => {
  try {
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [req.params.id]);
    if (!episode) {
      return res.status(404).json({ error: 'Episode not found.' });
    }

    // Get the associated quiz if any
    const quiz = await db.get('SELECT id, question, options, xp_reward FROM quizzes WHERE episode_id = ?', [episode.id]);
    let formattedQuiz = null;
    if (quiz) {
      formattedQuiz = {
        id: quiz.id,
        question: quiz.question,
        options: JSON.parse(quiz.options),
        xp_reward: quiz.xp_reward
      };
    }

    // Check if current user has submitted this quiz (if authenticated)
    let hasSolvedQuiz = false;
    let comments = [];
    let likesCount = 0;
    let sharesCount = 0;
    let hasLiked = false;

    // Get interactions
    const interactions = await db.all(
      `SELECT i.*, u.username FROM interactions i JOIN users u ON i.user_id = u.id WHERE i.episode_id = ?`,
      [episode.id]
    );

    // Optional Auth decoder
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {}
    }

    likesCount = interactions.filter(i => i.type === 'like').length;
    sharesCount = interactions.filter(i => i.type === 'share').length;
    hasLiked = currentUserId ? interactions.some(i => i.type === 'like' && i.user_id === currentUserId) : false;

    // Build hierarchical comments list
    // 1. Get parent comments (where parent_id is null/undefined)
    const parentComments = interactions.filter(i => i.type === 'comment' && !i.parent_id);
    
    // 2. Map comments with their replies and comment likes
    comments = parentComments.map(c => {
      // Find replies to this comment
      const replies = interactions.filter(i => i.type === 'comment' && i.parent_id === c.id).map(r => {
        // Find likes on this reply
        const replyLikes = interactions.filter(i => i.type === 'comment_like' && i.parent_id === r.id);
        return {
          id: r.id,
          user_id: r.user_id,
          username: r.username,
          content: r.content,
          created_at: r.created_at,
          parent_id: r.parent_id,
          likes_count: replyLikes.length,
          has_liked: currentUserId ? replyLikes.some(l => l.user_id === currentUserId) : false
        };
      });

      // Find likes on this parent comment
      const commentLikes = interactions.filter(i => i.type === 'comment_like' && i.parent_id === c.id);

      return {
        id: c.id,
        user_id: c.user_id,
        username: c.username,
        content: c.content,
        created_at: c.created_at,
        likes_count: commentLikes.length,
        has_liked: currentUserId ? commentLikes.some(l => l.user_id === currentUserId) : false,
        replies
      };
    });

    if (currentUserId && quiz) {
      try {
        const submission = await db.get('SELECT * FROM quiz_submissions WHERE user_id = ? AND quiz_id = ?', [currentUserId, quiz.id]);
        hasSolvedQuiz = !!submission;
      } catch (e) {}
    }

    res.json({
      episode,
      quiz: formattedQuiz,
      has_solved_quiz: hasSolvedQuiz,
      likes_count: likesCount,
      shares_count: sharesCount,
      has_liked: hasLiked,
      comments
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching episode details.' });
  }
});

// Create Episode (Admin role)
app.post('/api/episodes', async (req, res) => {
  const { title_ar, title_en, description, thumbnail_url, youtube_url } = req.body;
  if (!title_ar || !title_en) {
    return res.status(400).json({ error: 'Episode title is required.' });
  }

  try {
    const result = await db.run(
      `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [title_ar, title_en, description, thumbnail_url, youtube_url, new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'Episode added successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while adding the episode.' });
  }
});

// --- XP CODES ROUTES ---

// Redeem a Code
app.post('/api/xp-codes/redeem', authMiddleware, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'Please enter the secret code.' });
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    // 1. Check code existence
    const xpCode = await db.get('SELECT * FROM xp_codes WHERE code = ?', [cleanCode]);
    if (!xpCode) {
      return res.status(404).json({ error: 'Secret code is incorrect or does not exist.' });
    }

    // 2. Check Expiry
    if (xpCode.expiry_date) {
      const expiry = new Date(xpCode.expiry_date);
      if (expiry < new Date()) {
        return res.status(400).json({ error: 'Sorry, this code has expired.' });
      }
    }

    // 3. Check Max Uses
    if (xpCode.current_uses >= xpCode.max_uses) {
      return res.status(400).json({ error: 'Sorry, this code has reached its maximum uses.' });
    }

    // 4. Check if User already redeemed it
    const alreadyRedeemed = await db.get('SELECT * FROM code_redemptions WHERE user_id = ? AND code_id = ?', [req.user.id, xpCode.id]);
    if (alreadyRedeemed) {
      return res.status(400).json({ error: 'You have already redeemed this code.' });
    }

    // 5. Redeem: Insert redemption log
    await db.run('INSERT INTO code_redemptions (user_id, code_id, redeemed_at) VALUES (?, ?, ?)', [req.user.id, xpCode.id, new Date().toISOString()]);

    // 6. Update code uses count
    await db.run('UPDATE xp_codes SET current_uses = current_uses + 1 WHERE id = ?', [xpCode.id]);

    // 7. Update User XP
    const user = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
    const newTotalXp = user.total_xp + xpCode.xp_reward;
    const newWeeklyXp = user.weekly_xp + xpCode.xp_reward;

    await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, req.user.id]);

    res.json({
      success: true,
      message: `Code activated successfully! You earned +${xpCode.xp_reward} XP`,
      xp_earned: xpCode.xp_reward,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while processing the code.' });
  }
});

// Create XP Code (Admin role)
app.post('/api/xp-codes', adminMiddleware, async (req, res) => {
  const { code, xp_reward, type, episode_id, max_uses, expiry_date } = req.body;
  if (!code || !xp_reward || !type) {
    return res.status(400).json({ error: 'Code, XP reward, and type are required fields.' });
  }

  try {
    const result = await db.run(
      `INSERT INTO xp_codes (code, xp_reward, type, episode_id, max_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), xp_reward, type, episode_id || null, max_uses || 9999, expiry_date || null, new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'Code created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred while creating the code (it might be a duplicate).' });
  }
});

// --- LEADERBOARD ROUTE ---

// Get Leaderboard Data
app.get('/api/leaderboard', async (req, res) => {
  const { tab, batch } = req.query; // 'weekly', 'all-time', 'batch'
  
  try {
    let query = '';
    let params = [];

    if (tab === 'weekly') {
      query = `SELECT username, batch, weekly_xp as xp, streak_count FROM users WHERE is_verified = 1 ORDER BY weekly_xp DESC, username ASC LIMIT 100`;
    } else if (tab === 'batch') {
      query = `SELECT username, batch, total_xp as xp, streak_count FROM users WHERE is_verified = 1 AND batch = ? ORDER BY total_xp DESC, username ASC LIMIT 100`;
      params.push(batch || '');
    } else {
      // Default: all-time
      query = `SELECT username, batch, total_xp as xp, streak_count FROM users WHERE is_verified = 1 ORDER BY total_xp DESC, username ASC LIMIT 100`;
    }

    const leaderboard = await db.all(query, params);
    
    // Format ranks on server
    const formatted = leaderboard.map((user, idx) => ({
      rank_num: idx + 1,
      username: user.username,
      batch: user.batch,
      xp: user.xp,
      streak_count: user.streak_count,
      rank_badge: getRank(user.xp || 0) // note: for weekly_xp we might use total_xp for rank badge, but we only have weekly_xp in selected fields if tab is weekly. Let's fetch total_xp anyway or calculate by xp. Actually, rank is based on total_xp. Let's make sure we select total_xp in the query!
    }));

    // Let's fix query to always fetch total_xp for rank calculation
    let fixedQuery = '';
    if (tab === 'weekly') {
      fixedQuery = `SELECT username, batch, weekly_xp as xp, total_xp, streak_count FROM users WHERE is_verified = 1 ORDER BY weekly_xp DESC, username ASC LIMIT 100`;
    } else if (tab === 'batch') {
      fixedQuery = `SELECT username, batch, total_xp as xp, total_xp, streak_count FROM users WHERE is_verified = 1 AND batch = ? ORDER BY total_xp DESC, username ASC LIMIT 100`;
    } else {
      fixedQuery = `SELECT username, batch, total_xp as xp, total_xp, streak_count FROM users WHERE is_verified = 1 ORDER BY total_xp DESC, username ASC LIMIT 100`;
    }

    const rows = await db.all(fixedQuery, params);
    const finalLeaderboard = rows.map((user, idx) => ({
      rank_num: idx + 1,
      username: user.username,
      batch: user.batch,
      xp: user.xp,
      streak_count: user.streak_count,
      rank: getRank(user.total_xp)
    }));

    res.json(finalLeaderboard);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching the leaderboard.' });
  }
});
// --- CHAT ROUTES ---

// Get last 50 chat messages
app.get('/api/chat', async (req, res) => {
  try {
    // Expose online users count via headers
    let currentUsername = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUsername = decoded.username;
        if (currentUsername) {
          activeUsers.set(currentUsername, Date.now());
        }
      } catch (e) {}
    }

    // Clean up inactive users (older than 15 seconds)
    const now = Date.now();
    for (const [username, lastActive] of activeUsers.entries()) {
      if (now - lastActive > 15000) {
        activeUsers.delete(username);
      }
    }
    const onlineCount = Math.max(1, activeUsers.size);
    res.setHeader('Access-Control-Expose-Headers', 'X-Online-Count');
    res.setHeader('X-Online-Count', onlineCount.toString());

    const messages = await db.all(
      `SELECT m.id, m.message, m.created_at, m.reply_to_id, m.is_edited, m.user_id,
              u.username, u.batch, u.total_xp,
              rm.message as reply_message, ru.username as reply_username
       FROM chat_messages m 
       JOIN users u ON m.user_id = u.id 
       LEFT JOIN chat_messages rm ON m.reply_to_id = rm.id
       LEFT JOIN users ru ON rm.user_id = ru.id
       ORDER BY m.id DESC LIMIT 50`
    );

    const messageIds = messages.map(m => m.id);
    let reactionsMap = {};
    if (messageIds.length > 0) {
      const reactions = await db.all(
        `SELECT r.message_id, r.emoji, r.user_id, u.username 
         FROM message_reactions r 
         JOIN users u ON r.user_id = u.id
         WHERE r.message_id IN (${messageIds.join(',')})`
      );
      reactions.forEach(r => {
        if (!reactionsMap[r.message_id]) {
          reactionsMap[r.message_id] = [];
        }
        reactionsMap[r.message_id].push({
          emoji: r.emoji,
          user_id: r.user_id,
          username: r.username
        });
      });
    }

    // Decode optional token to identify if current user reacted
    let currentUserId = null;
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {
        // Ignore invalid token
      }
    }

    const formatted = messages.map(m => {
      const rawReactions = reactionsMap[m.id] || [];
      const emojiCounts = {};
      rawReactions.forEach(r => {
        emojiCounts[r.emoji] = (emojiCounts[r.emoji] || 0) + 1;
      });

      const formattedReactions = Object.keys(emojiCounts).map(emoji => ({
        emoji,
        count: emojiCounts[emoji],
        userReacted: rawReactions.some(r => r.emoji === emoji && r.user_id === currentUserId)
      }));

      return {
        id: m.id,
        user_id: m.user_id,
        message: m.message,
        created_at: m.created_at,
        username: m.username,
        batch: m.batch,
        rank: getRank(m.total_xp),
        reply_to: m.reply_to_id ? {
          id: m.reply_to_id,
          username: m.reply_username,
          message: m.reply_message
        } : null,
        reactions: formattedReactions,
        is_edited: m.is_edited
      };
    }).reverse();

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching messages.' });
  }
});

// Post chat message
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, reply_to_id } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Cannot send an empty message.' });
  }

  try {
    const mod = await checkModerationStatus(req.user.id);
    if (mod.banned) {
      return res.status(403).json({ error: 'Your account is banned. You cannot send chat messages.' });
    }
    if (mod.muted) {
      const expiryText = mod.mute_expires_at ? `until ${new Date(mod.mute_expires_at).toLocaleString()}` : 'permanently';
      return res.status(403).json({ error: `You are muted ${expiryText} and cannot send messages.` });
    }
    const result = await db.run(
      `INSERT INTO chat_messages (user_id, message, reply_to_id, created_at) VALUES (?, ?, ?, ?)`,
      [req.user.id, message.trim(), reply_to_id || null, new Date().toISOString()]
    );
    const user = await db.get('SELECT username, batch, total_xp FROM users WHERE id = ?', [req.user.id]);

    let replyToObj = null;
    if (reply_to_id) {
      const repliedMsg = await db.get(
        `SELECT m.message, u.username FROM chat_messages m 
         JOIN users u ON m.user_id = u.id WHERE m.id = ?`,
        [reply_to_id]
      );
      if (repliedMsg) {
        replyToObj = {
          id: reply_to_id,
          username: repliedMsg.username,
          message: repliedMsg.message
        };
      }
    }

    res.status(201).json({
      id: result.id,
      message: message.trim(),
      created_at: new Date().toISOString(),
      username: user.username,
      batch: user.batch,
      rank: getRank(user.total_xp),
      reply_to: replyToObj
    });
  } catch (err) {
  }
});

// Post reaction to a chat message (toggle behavior)
app.post('/api/chat/:messageId/react', authMiddleware, async (req, res) => {
  const { messageId } = req.params;
  const { emoji } = req.body;

  if (!emoji) {
    return res.status(400).json({ error: 'Emoji is required.' });
  }

  try {
    // Check if user has already reacted to this message
    const existing = await db.get(
      'SELECT * FROM message_reactions WHERE message_id = ? AND user_id = ?',
      [messageId, req.user.id]
    );

    if (existing) {
      if (existing.emoji === emoji) {
        // Toggle: remove reaction
        await db.run('DELETE FROM message_reactions WHERE id = ?', [existing.id]);
        return res.json({ success: true, action: 'removed', emoji });
      } else {
        // Update to new emoji
        await db.run('UPDATE message_reactions SET emoji = ? WHERE id = ?', [emoji, existing.id]);
        return res.json({ success: true, action: 'updated', emoji });
      }
    } else {
      // Add new reaction
      await db.run(
        'INSERT INTO message_reactions (message_id, user_id, emoji) VALUES (?, ?, ?)',
        [messageId, req.user.id, emoji]
      );
      return res.json({ success: true, action: 'added', emoji });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving the reaction.' });
  }
});

// Edit a chat message
app.put('/api/chat/:messageId', authMiddleware, async (req, res) => {
  const { messageId } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'Message cannot be empty.' });
  }

  try {
    const existing = await db.get('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
    if (!existing) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'You are not authorized to edit this message.' });
    }

    await db.run(
      'UPDATE chat_messages SET message = ?, is_edited = 1 WHERE id = ?',
      [message.trim(), messageId]
    );

    res.json({ success: true, message: 'Message edited successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while editing the message.' });
  }
});

// Delete a chat message
// Delete a chat message (Only owner or Admin)
app.delete('/api/chat/:messageId', authMiddleware, async (req, res) => {
  const { messageId } = req.params;

  try {
    const existing = await db.get('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
    if (!existing) {
      return res.status(404).json({ error: 'Message not found.' });
    }

    const requester = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const isAdmin = requester && requester.role === 'admin';

    if (existing.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this message.' });
    }

    await db.run('DELETE FROM chat_messages WHERE id = ?', [messageId]);
    res.json({ success: true, message: 'Message deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the message.' });
  }
});

// Delete a comment/reply (Only owner or Admin)
app.delete('/api/comments/:commentId', authMiddleware, async (req, res) => {
  const { commentId } = req.params;

  try {
    const existing = await db.get('SELECT * FROM interactions WHERE id = ? AND (type = "comment" OR type = "reply" OR type = "comment_like")', [commentId]);
    if (!existing) {
      return res.status(404).json({ error: 'Comment not found.' });
    }

    const requester = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const isAdmin = requester && requester.role === 'admin';

    if (existing.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment.' });
    }

    // Delete comment, replies and likes linked to it
    await db.run('DELETE FROM interactions WHERE id = ? OR parent_id = ? OR parent_id IN (SELECT id FROM interactions WHERE parent_id = ?)', [commentId, commentId, commentId]);

    res.json({ success: true, message: 'Comment deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the comment.' });
  }
});

// Delete a suggestion (Only owner or Admin)
app.delete('/api/suggestions/:id', authMiddleware, async (req, res) => {
  const suggestionId = req.params.id;

  try {
    const existing = await db.get('SELECT * FROM suggestions WHERE id = ?', [suggestionId]);
    if (!existing) {
      return res.status(404).json({ error: 'Suggestion not found.' });
    }

    const requester = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const isAdmin = requester && requester.role === 'admin';

    if (existing.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'You are not authorized to delete this suggestion.' });
    }

    await db.run('DELETE FROM suggestions WHERE id = ?', [suggestionId]);
    await db.run('DELETE FROM suggestion_upvotes WHERE suggestion_id = ?', [suggestionId]);

    res.json({ success: true, message: 'Suggestion deleted successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while deleting the suggestion.' });
  }
});

// Bulk delete chat messages
app.post('/api/chat/delete-bulk', authMiddleware, async (req, res) => {
  const { messageIds } = req.body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: 'No messages selected for deletion.' });
  }

  try {
    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `DELETE FROM chat_messages WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...messageIds, req.user.id];

    const result = await db.run(sql, params);
    
    res.json({ 
      success: true, 
      message: 'Selected messages deleted successfully.',
      changes: result.changes 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during bulk deleting messages.' });
  }
});

// --- MINI GAMES ROUTES ---

// Get all mini games
app.get('/api/games', async (req, res) => {
  try {
    const games = await db.all('SELECT id, name, subject, game_type, game_data FROM mini_games');
    const formatted = games.map(g => ({
      id: g.id,
      name: g.name,
      subject: g.subject,
      game_type: g.game_type,
      game_data: JSON.parse(g.game_data)
    }));
    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching games.' });
  }
});

// Play mini game and earn XP (limit 3 times per day)
app.post('/api/games/:id/play', authMiddleware, async (req, res) => {
  const gameId = req.params.id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const game = await db.get('SELECT * FROM mini_games WHERE id = ?', [gameId]);
    if (!game) {
      return res.status(404).json({ error: 'Game not found.' });
    }

    const playCount = await db.get(
      `SELECT COUNT(*) as count FROM game_plays 
       WHERE user_id = ? AND played_at LIKE ?`,
      [req.user.id, `${todayStr}%`]
    );

    if (playCount.count >= 3) {
      return res.status(400).json({ error: 'You have reached the daily limit (3 plays). You can play again tomorrow to earn XP!' });
    }

    const xpReward = 50;

    await db.run(
      `INSERT INTO game_plays (user_id, game_id, score, xp_earned, played_at) VALUES (?, ?, ?, ?, ?)`,
      [req.user.id, gameId, 100, xpReward, new Date().toISOString()]
    );

    const user = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
    const newTotalXp = user.total_xp + xpReward;
    const newWeeklyXp = user.weekly_xp + xpReward;

    await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, req.user.id]);

    res.json({
      success: true,
      message: `Awesome! You completed the game and earned +${xpReward} XP!`,
      xp_earned: xpReward,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp),
      plays_today: playCount.count + 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving game score.' });
  }
});

// --- EPISODE INTERACTIONS (LIKE / COMMENT / SHARE) ---

// Post an interaction on an episode (like, comment, share, comment_like)
app.post('/api/episodes/:id/interact', authMiddleware, async (req, res) => {
  const { id: episodeId } = req.params;
  const { type, content, parent_id } = req.body; // type: 'like' | 'comment' | 'share' | 'comment_like'

  if (!type || !['like', 'comment', 'share', 'comment_like'].includes(type)) {
    return res.status(400).json({ error: 'Type must be like, comment, share, or comment_like.' });
  }
  if (type === 'comment' && (!content || content.trim() === '')) {
    return res.status(400).json({ error: 'Comment content is required.' });
  }
  if (type === 'comment_like' && !parent_id) {
    return res.status(400).json({ error: 'Comment ID (parent_id) is required for liking.' });
  }

  const XP_MAP = { like: 5, comment: 15, share: 25, comment_like: 0 };

  try {
    const mod = await checkModerationStatus(req.user.id);
    if (mod.banned) {
      return res.status(403).json({ error: 'Your account is banned. You cannot interact.' });
    }
    if ((type === 'comment' || type === 'comment_like') && mod.muted) {
      const expiryText = mod.mute_expires_at ? `until ${new Date(mod.mute_expires_at).toLocaleString()}` : 'permanently';
      return res.status(403).json({ error: `You are muted ${expiryText} and cannot comment/reply.` });
    }

    const episode = await db.get('SELECT id FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) return res.status(404).json({ error: 'Episode not found.' });

    // Handle Comment Like (toggle behavior)
    if (type === 'comment_like') {
      const existing = await db.get(
        'SELECT id FROM interactions WHERE user_id = ? AND parent_id = ? AND type = ?',
        [req.user.id, parent_id, 'comment_like']
      );
      if (existing) {
        await db.run('DELETE FROM interactions WHERE id = ?', [existing.id]);
        return res.json({ success: true, action: 'removed', type });
      } else {
        await db.run(
          'INSERT INTO interactions (user_id, episode_id, type, parent_id, created_at) VALUES (?, ?, ?, ?, ?)',
          [req.user.id, episodeId, 'comment_like', parent_id, new Date().toISOString()]
        );
        return res.status(201).json({ success: true, action: 'added', type });
      }
    }

    // For likes, enforce one-per-post. For shares, also once.
    if (type === 'like' || type === 'share') {
      const existing = await db.get(
        'SELECT id FROM interactions WHERE user_id = ? AND episode_id = ? AND type = ?',
        [req.user.id, episodeId, type]
      );
      if (existing) {
        if (type === 'like') {
          // Toggle unlike
          await db.run('DELETE FROM interactions WHERE id = ?', [existing.id]);
          return res.json({ success: true, action: 'removed', type });
        }
        return res.status(400).json({ error: 'You have already performed this action.' });
      }
    }

    // For main comments (parent_id is null/undefined), enforce only one per episode
    if (type === 'comment' && !parent_id) {
      const existingComment = await db.get(
        'SELECT id FROM interactions WHERE user_id = ? AND episode_id = ? AND type = ? AND parent_id IS NULL',
        [req.user.id, episodeId, 'comment']
      );
      if (existingComment) {
        return res.status(400).json({ error: 'You have already commented on this episode.' });
      }
    }

    // Insert interaction
    await db.run(
      'INSERT INTO interactions (user_id, episode_id, type, content, parent_id, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [req.user.id, episodeId, type, content ? content.trim() : null, parent_id || null, new Date().toISOString()]
    );

    // Award XP
    const xpGain = XP_MAP[type];
    let newTotalXp = 0;
    let newWeeklyXp = 0;
    
    if (xpGain > 0) {
      const userRow = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
      newTotalXp = userRow.total_xp + xpGain;
      newWeeklyXp = userRow.weekly_xp + xpGain;
      await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, req.user.id]);
    } else {
      const userRow = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
      newTotalXp = userRow.total_xp;
    }

    res.status(201).json({
      success: true,
      action: 'added',
      type,
      xp_earned: xpGain,
      total_xp: newTotalXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving interaction.' });
  }
});

// Post a referral visit link to credit the sharing user
app.post('/api/episodes/:id/referral', async (req, res) => {
  const { id: episodeId } = req.params;
  const { referrer } = req.body;

  if (!referrer) {
    return res.status(400).json({ error: 'Referrer username is required.' });
  }

  try {
    const referrerUser = await db.get('SELECT id, total_xp, weekly_xp FROM users WHERE username = ?', [referrer]);
    if (!referrerUser) {
      return res.status(404).json({ error: 'Referrer not found.' });
    }

    // Optional auth check to prevent self-referral
    let visitorUserId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        visitorUserId = decoded.id;
      } catch (e) {}
    }

    if (visitorUserId && visitorUserId === referrerUser.id) {
      return res.status(200).json({ success: false, message: 'You cannot refer yourself.' });
    }

    // Check if the referrer has already shared this episode
    const existing = await db.get(
      'SELECT id FROM interactions WHERE user_id = ? AND episode_id = ? AND type = "share"',
      [referrerUser.id, episodeId]
    );

    if (existing) {
      return res.status(200).json({ success: false, message: 'Referral points already awarded.' });
    }

    // Insert interaction
    await db.run(
      'INSERT INTO interactions (user_id, episode_id, type, created_at) VALUES (?, ?, ?, ?)',
      [referrerUser.id, episodeId, 'share', new Date().toISOString()]
    );

    const xpGain = 25; // Share XP is 25
    const newTotalXp = referrerUser.total_xp + xpGain;
    const newWeeklyXp = referrerUser.weekly_xp + xpGain;
    
    await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, referrerUser.id]);

    return res.json({
      success: true,
      message: 'Referral points awarded successfully.',
      referrer: referrer,
      xp_awarded: xpGain
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'An error occurred while processing referral.' });
  }
});

// --- QUIZ SUBMISSION ---

// Submit quiz answer
app.post('/api/episodes/:id/quiz/submit', authMiddleware, async (req, res) => {
  const { id: episodeId } = req.params;
  const { quiz_id, answer_index } = req.body;

  if (quiz_id === undefined || answer_index === undefined) {
    return res.status(400).json({ error: 'Quiz ID and answer are required.' });
  }

  try {
    // Check quiz exists and belongs to episode
    const quiz = await db.get('SELECT * FROM quizzes WHERE id = ? AND episode_id = ?', [quiz_id, episodeId]);
    if (!quiz) return res.status(404).json({ error: 'Quiz not found.' });

    // Check if already submitted
    const already = await db.get('SELECT * FROM quiz_submissions WHERE user_id = ? AND quiz_id = ?', [req.user.id, quiz_id]);
    if (already) {
      return res.status(400).json({
        error: 'You have already answered this quiz.',
        is_correct: already.is_correct === 1,
        correct_option_index: quiz.correct_option_index
      });
    }

    const isCorrect = parseInt(answer_index) === quiz.correct_option_index ? 1 : 0;

    await db.run(
      'INSERT INTO quiz_submissions (user_id, quiz_id, answer_index, is_correct, submitted_at) VALUES (?, ?, ?, ?, ?)',
      [req.user.id, quiz_id, answer_index, isCorrect, new Date().toISOString()]
    );

    let xpEarned = 0;
    let newTotalXp = 0;
    let newWeeklyXp = 0;

    if (isCorrect) {
      xpEarned = quiz.xp_reward || 150;
      const userRow = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
      newTotalXp = userRow.total_xp + xpEarned;
      newWeeklyXp = userRow.weekly_xp + xpEarned;
      await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, req.user.id]);
    } else {
      const userRow = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
      newTotalXp = userRow.total_xp;
      newWeeklyXp = userRow.weekly_xp;
    }

    res.json({
      success: true,
      is_correct: isCorrect === 1,
      correct_option_index: quiz.correct_option_index,
      xp_earned: xpEarned,
      total_xp: newTotalXp,
      rank: getRank(newTotalXp),
      message: isCorrect ? `Correct answer! You earned +${xpEarned} XP 🎉` : 'Incorrect answer. Try again in the next episode!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while saving your answer.' });
  }
});

// --- SUGGESTIONS ROUTES ---

// Get all suggestions (public)
app.get('/api/suggestions', async (req, res) => {
  try {
    const suggestions = await db.all(
      `SELECT s.id, s.title, s.content, s.upvotes, s.status, s.created_at,
              u.username, u.batch
       FROM suggestions s
       JOIN users u ON s.user_id = u.id
       WHERE s.status != 'rejected'
       ORDER BY s.upvotes DESC, s.created_at DESC
       LIMIT 50`
    );

    // Check if current user upvoted (optional auth)
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const jwt = require('jsonwebtoken');
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {}
    }

    let upvotedIds = new Set();
    if (currentUserId) {
      const upvotes = await db.all('SELECT suggestion_id FROM suggestion_upvotes WHERE user_id = ?', [currentUserId]);
      upvotes.forEach(r => upvotedIds.add(r.suggestion_id));
    }

    const formatted = suggestions.map(s => ({
      ...s,
      hasUpvoted: upvotedIds.has(s.id)
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching suggestions.' });
  }
});

// Post a suggestion
app.post('/api/suggestions', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'Title and content are required.' });
  }

  try {
    const result = await db.run(
      'INSERT INTO suggestions (user_id, title, content, created_at) VALUES (?, ?, ?, ?)',
      [req.user.id, title.trim(), content.trim(), new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'Your suggestion was submitted successfully! Thank you for sharing.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while submitting suggestion.' });
  }
});

// Upvote a suggestion (toggle)
app.post('/api/suggestions/:id/upvote', authMiddleware, async (req, res) => {
  const suggestionId = req.params.id;

  try {
    const suggestion = await db.get('SELECT * FROM suggestions WHERE id = ?', [suggestionId]);
    if (!suggestion) return res.status(404).json({ error: 'Suggestion not found.' });

    const existing = await db.get(
      'SELECT id FROM suggestion_upvotes WHERE user_id = ? AND suggestion_id = ?',
      [req.user.id, suggestionId]
    );

    if (existing) {
      await db.run('DELETE FROM suggestion_upvotes WHERE id = ?', [existing.id]);
      await db.run('UPDATE suggestions SET upvotes = upvotes - 1 WHERE id = ?', [suggestionId]);
      const updated = await db.get('SELECT upvotes FROM suggestions WHERE id = ?', [suggestionId]);
      return res.json({ success: true, action: 'removed', upvotes: updated.upvotes });
    } else {
      await db.run(
        'INSERT INTO suggestion_upvotes (user_id, suggestion_id, voted_at) VALUES (?, ?, ?)',
        [req.user.id, suggestionId, new Date().toISOString()]
      );
      await db.run('UPDATE suggestions SET upvotes = upvotes + 1 WHERE id = ?', [suggestionId]);
      const updated = await db.get('SELECT upvotes FROM suggestions WHERE id = ?', [suggestionId]);
      return res.json({ success: true, action: 'added', upvotes: updated.upvotes });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while voting.' });
  }
});

// --- ADMIN ROUTES ---

// Admin: Create Episode + optional quiz + optional XP code
app.post('/api/admin/episode', adminMiddleware, async (req, res) => {
  const { title_ar, title_en, description, thumbnail_url, youtube_url, quiz, xp_code } = req.body;
  if (!title_ar) return res.status(400).json({ error: 'Episode title in English is required.' });

  try {
    const epResult = await db.run(
      'INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)',
      [title_ar, title_en || title_ar, description || '', thumbnail_url || '', youtube_url || '', new Date().toISOString()]
    );
    const episodeId = epResult.id;

    if (quiz && quiz.question && quiz.options && quiz.correct_option_index !== undefined) {
      await db.run(
        'INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward) VALUES (?, ?, ?, ?, ?)',
        [episodeId, quiz.question, JSON.stringify(quiz.options), quiz.correct_option_index, quiz.xp_reward || 150]
      );
    }

    if (xp_code && xp_code.code) {
      await db.run(
        'INSERT INTO xp_codes (code, xp_reward, type, episode_id, max_uses, current_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
        [
          xp_code.code.trim().toUpperCase(),
          xp_code.xp_reward || 100,
          'episode',
          episodeId,
          xp_code.max_uses || 200,
          0,
          xp_code.expiry_date || null,
          new Date().toISOString()
        ]
      );
    }

    res.status(201).json({ success: true, episode_id: episodeId, message: 'Episode created successfully.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while creating the episode.' });
  }
});

// Admin: Get all XP codes
app.get('/api/admin/xp-codes', adminMiddleware, async (req, res) => {
  try {
    const codes = await db.all('SELECT * FROM xp_codes ORDER BY id DESC');
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

// Admin: Get all users summary
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await db.all(
      'SELECT id, username, email, batch, total_xp, weekly_xp, streak_count, is_verified, role, created_at, is_muted, mute_expires_at, is_banned, ban_expires_at FROM users ORDER BY total_xp DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

// Admin: Toggle user role between 'user' and 'admin'
app.patch('/api/admin/users/:id/role', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'The specified role is invalid.' });
  }

  try {
    // Prevent admin from demoting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot change your own role.' });
    }

    const targetUser = await db.get('SELECT username FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    res.json({ success: true, message: `Updated ${targetUser.username}'s role to ${role === 'admin' ? 'Admin' : 'Student'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while updating user role.' });
  }
});

// Admin: Get all suggestions (including rejected)
app.get('/api/admin/suggestions', adminMiddleware, async (req, res) => {
  try {
    const suggestions = await db.all(
      `SELECT s.*, u.username FROM suggestions s JOIN users u ON s.user_id = u.id ORDER BY s.created_at DESC`
    );
    res.json(suggestions);
  } catch (err) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

// Admin: Update suggestion status
app.patch('/api/admin/suggestions/:id', adminMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status.' });
  }
  try {
    await db.run('UPDATE suggestions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

// Admin: Add mini game
app.post('/api/admin/games', adminMiddleware, async (req, res) => {
  const { name, subject, game_type, game_data } = req.body;
  if (!name || !subject || !game_type || !game_data) {
    return res.status(400).json({ error: 'All fields are required.' });
  }
  try {
    const result = await db.run(
      'INSERT INTO mini_games (name, subject, game_type, game_data, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, subject, game_type, JSON.stringify(game_data), new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'Game created successfully.' });
  } catch (err) {
    res.status(500).json({ error: 'An error occurred.' });
  }
});

// Claim Daily Surprise Box
app.post('/api/rewards/surprise-box', authMiddleware, async (req, res) => {
  try {
    const todayStr = req.body.clientDate || getLocalDateString();
    const user = await db.get('SELECT total_xp, weekly_xp, last_surprise_box_date FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (user.last_surprise_box_date === todayStr) {
      return res.status(400).json({ error: 'You have already opened your surprise box today. Resets at midnight 12:00 AM.' });
    }
    
    const xpReward = 50;
    const newTotalXp = user.total_xp + xpReward;
    const newWeeklyXp = user.weekly_xp + xpReward;
    
    await db.run(
      'UPDATE users SET total_xp = ?, weekly_xp = ?, last_surprise_box_date = ? WHERE id = ?',
      [newTotalXp, newWeeklyXp, todayStr, req.user.id]
    );
    
    res.json({
      success: true,
      message: 'Opened daily surprise box! You earned +50 XP ⚡',
      xp_earned: xpReward,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim surprise box.' });
  }
});

// Claim Daily Spin Wheel
app.post('/api/rewards/spin-wheel', authMiddleware, async (req, res) => {
  const { xpAmount, clientDate } = req.body;
  const xpReward = parseInt(xpAmount, 10) || 0;
  
  try {
    const todayStr = clientDate || getLocalDateString();
    const user = await db.get('SELECT total_xp, weekly_xp, last_spin_wheel_date FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    if (user.last_spin_wheel_date === todayStr) {
      return res.status(400).json({ error: 'You have already spun the wheel today. Resets at midnight 12:00 AM.' });
    }
    
    const newTotalXp = user.total_xp + xpReward;
    const newWeeklyXp = user.weekly_xp + xpReward;
    
    await db.run(
      'UPDATE users SET total_xp = ?, weekly_xp = ?, last_spin_wheel_date = ? WHERE id = ?',
      [newTotalXp, newWeeklyXp, todayStr, req.user.id]
    );
    
    res.json({
      success: true,
      message: `Spin Wheel claimed successfully! You earned +${xpReward} XP ⚡`,
      xp_earned: xpReward,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to claim spin wheel.' });
  }
});

// Admin: Mute, unmute, ban, or unban user
app.post('/api/admin/users/:id/moderate', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { action, duration } = req.body; // action: 'mute'|'unmute'|'ban'|'unban', duration: '1h'|'1d'|'1w'|'permanent'
  
  if (!action || !['mute', 'unmute', 'ban', 'unban'].includes(action)) {
    return res.status(400).json({ error: 'Invalid action.' });
  }
  
  try {
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'You cannot moderate yourself.' });
    }
    
    const targetUser = await db.get('SELECT username FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'User not found.' });
    }
    
    const expiresAt = (action === 'mute' || action === 'ban') ? getExpirationDate(duration) : null;
    
    if (action === 'mute') {
      await db.run(
        'UPDATE users SET is_muted = 1, mute_expires_at = ? WHERE id = ?',
        [expiresAt, userId]
      );
      res.json({ success: true, message: `Muted ${targetUser.username} (${duration || 'permanent'}).` });
    } else if (action === 'unmute') {
      await db.run(
        'UPDATE users SET is_muted = 0, mute_expires_at = NULL WHERE id = ?',
        [userId]
      );
      res.json({ success: true, message: `Unmuted ${targetUser.username}.` });
    } else if (action === 'ban') {
      await db.run(
        'UPDATE users SET is_banned = 1, ban_expires_at = ? WHERE id = ?',
        [expiresAt, userId]
      );
      res.json({ success: true, message: `Banned ${targetUser.username} (${duration || 'permanent'}).` });
    } else if (action === 'unban') {
      await db.run(
        'UPDATE users SET is_banned = 0, ban_expires_at = NULL WHERE id = ?',
        [userId]
      );
      res.json({ success: true, message: `Unbanned ${targetUser.username}.` });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred during moderation.' });
  }
});

// Admin: Delete XP code
app.delete('/api/admin/xp-codes/:id', adminMiddleware, async (req, res) => {
  const codeId = req.params.id;
  try {
    const existing = await db.get('SELECT * FROM xp_codes WHERE id = ?', [codeId]);
    if (!existing) {
      return res.status(404).json({ error: 'XP Code not found.' });
    }
    
    await db.run('DELETE FROM xp_codes WHERE id = ?', [codeId]);
    await db.run('DELETE FROM code_redemptions WHERE code_id = ?', [codeId]);
    
    res.json({ success: true, message: `XP Code "${existing.code}" deleted successfully.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete XP code.' });
  }
});

// Server status
app.get('/api/status', (req, res) => {
  res.json({ status: 'running', message: 'Leh Physio? API is online.' });
});

// --- ONLINE ANATOMY GAME SYSTEM ---

const ANATOMY_QUESTIONS = [
  {
    structure: 'Biceps Brachii',
    type: 'muscle',
    hints: [
      'A muscle located in the upper limb (arm region).',
      'It has two main heads (long head and short head).',
      'Its primary action is elbow flexion and forearm supination.',
      'Supplied by the musculocutaneous nerve.'
    ],
    answers: ['biceps brachii', 'biceps', 'biceps muscle', 'bicep']
  },
  {
    structure: 'Femur',
    type: 'bone',
    hints: [
      'A bone located in the lower limb.',
      'It is considered the longest and strongest bone in the entire human body.',
      'Articulates superiorly with the pelvis and inferiorly with the patella and tibia.',
      'Its upper end contains the greater trochanter and the femoral neck.'
    ],
    answers: ['femur', 'thigh bone', 'femur bone']
  },
  {
    structure: 'Radial Nerve',
    type: 'nerve',
    hints: [
      'A major nerve supplying the muscles of the upper limb.',
      'Runs in the spiral groove of the humerus bone.',
      'Supplies the extensor muscles of the forearm, wrist, and fingers.',
      'Its common injury leads to a wrist drop condition.'
    ],
    answers: ['radial nerve', 'radial']
  },
  {
    structure: 'Deltoid',
    type: 'muscle',
    hints: [
      'A muscle located in the shoulder region.',
      'Gives the shoulder its characteristic rounded shape and is divided into three fibers (anterior, middle, posterior).',
      'Middle fibers are responsible for arm abduction from 15 to 90 degrees.',
      'Supplied by the axillary nerve.'
    ],
    answers: ['deltoid', 'delts', 'deltoid muscle']
  },
  {
    structure: 'Sciatic Nerve',
    type: 'nerve',
    hints: [
      'A very large and main nerve in the lower limb.',
      'It is the longest and widest single nerve in the entire human body.',
      'Originates from the sacral plexus, passes behind the hip joint, and under the piriformis muscle.',
      'Its inflammation or compression causes pain radiating along the leg, commonly known as sciatica.'
    ],
    answers: ['sciatic nerve', 'sciatic', 'sciatica']
  },
  {
    structure: 'Gastrocnemius',
    type: 'muscle',
    hints: [
      'A superficial muscle located in the lower limb (posterior calf region).',
      'Commonly called the calf or double muscle because it has two heads (medial and lateral).',
      'Performs plantar flexion of the foot and assists in knee flexion.',
      'Combines with the soleus muscle to form the Achilles tendon.'
    ],
    answers: ['gastrocnemius', 'gastroc', 'calf muscle', 'calf']
  },
  {
    structure: 'Clavicle',
    type: 'bone',
    hints: [
      'A bone located in the upper anterior part of the chest.',
      'It is S-shaped and is the only long horizontal bone in the body.',
      'Connects the upper limb to the axial skeleton, articulating with the sternum and scapula.',
      'Commonly called the collarbone and is one of the most frequently fractured bones.'
    ],
    answers: ['clavicle', 'collarbone']
  },
  {
    structure: 'Median Nerve',
    type: 'nerve',
    hints: [
      'An important nerve running down the middle of the upper limb.',
      'Passes through the carpal tunnel under the wrist flexor retinaculum.',
      'Supplies most of the forearm flexor muscles and the thenar muscles of the thumb.',
      'Compression in the wrist causes Carpal Tunnel Syndrome and numbness in the first three fingers.'
    ],
    answers: ['median nerve', 'median']
  },
  {
    structure: 'Triceps Brachii',
    type: 'muscle',
    hints: [
      'A muscle located in the posterior region of the arm in the upper limb.',
      'Consists of three heads (long head, lateral head, and medial head).',
      'It is the primary extensor of the elbow joint.',
      'Supplied by the radial nerve.'
    ],
    answers: ['triceps brachii', 'triceps', 'tricep']
  },
  {
    structure: 'Patella',
    type: 'bone',
    hints: [
      'A bone located at the front of the knee joint.',
      'It is the largest sesamoid bone in the human body, situated within the quadriceps tendon.',
      'Protects the anterior surface of the knee joint and increases the leverage of the quadriceps muscle.',
      'Commonly called the kneecap.'
    ],
    answers: ['patella', 'kneecap']
  },
  {
    structure: 'Trapezius',
    type: 'muscle',
    hints: [
      'A flat, broad muscle covering the back of the neck and upper back.',
      'It is trapezoid-shaped and is divided into upper, middle, and lower fibers.',
      'Assists in shoulder blade movement (elevation, depression, and rotation) and neck extension.',
      'Supplied by the eleventh accessory nerve (spinal accessory nerve).'
    ],
    answers: ['trapezius', 'trap', 'traps']
  },
  {
    structure: 'Ulnar Nerve',
    type: 'nerve',
    hints: [
      'A nerve supplying the upper limb, running along the inner side of the arm.',
      'Passes behind the medial epicondyle of the humerus, the sensitive area known as the funny bone.',
      'Supplies most of the small intrinsic muscles of the hand and controls fine finger movements.',
      'Injury leads to claw hand deformity and loss of sensation in the pinky and half of the ring finger.'
    ],
    answers: ['ulnar nerve', 'ulnar']
  },
  {
    structure: 'Quadriceps Femoris',
    type: 'muscle',
    hints: [
      'A massive muscle group located in the front of the thigh.',
      'Consists of four heads (rectus femoris, vastus lateralis, vastus medialis, and vastus intermedius).',
      'It is the primary extensor of the knee joint and flexes the hip.',
      'Supplied by the femoral nerve.'
    ],
    answers: ['quadriceps', 'quads', 'quad', 'quadriceps femoris']
  },
  {
    structure: 'Scapula',
    type: 'bone',
    hints: [
      'A flat bone located in the upper posterior part of the trunk.',
      'It is triangular-shaped and is commonly called the shoulder blade.',
      'Articulates with the humerus to form the shoulder joint and with the clavicle.',
      'Contains important landmarks like the acromion and coracoid process.'
    ],
    answers: ['scapula', 'shoulder blade']
  },
  {
    structure: 'Gluteus Maximus',
    type: 'muscle',
    hints: [
      'A large muscle located in the buttocks region.',
      'It is the largest and heaviest muscle in the entire human body.',
      'Its primary function is hip extension and lateral rotation of the thigh at the hip joint.',
      'Supplied by the inferior gluteal nerve.'
    ],
    answers: ['gluteus maximus', 'gluteus', 'glutes']
  },
  {
    structure: 'Pectoralis Major',
    type: 'muscle',
    hints: [
      'A thick, fan-shaped muscle located at the front of the human chest.',
      'Makes up the bulk of the male chest muscles and lies under the breast in females.',
      'Responsible for adduction, internal rotation, and flexion of the humerus bone.',
      'Commonly known as the "pecs" muscle.'
    ],
    answers: ['pectoralis major', 'pectoralis', 'pecs', 'chest muscle']
  },
  {
    structure: 'Humerus',
    type: 'bone',
    hints: [
      'The long bone in the arm of the upper limb.',
      'Runs from the shoulder to the elbow joint.',
      'Articulates superiorly with the scapula and inferiorly with the radius and ulna.',
      'Features the anatomical neck, surgical neck, and greater tubercle.'
    ],
    answers: ['humerus', 'upper arm bone', 'humerus bone']
  },
  {
    structure: 'Tibialis Anterior',
    type: 'muscle',
    hints: [
      'A muscle situated on the lateral side of the tibia bone in the lower limb.',
      'It is the primary dorsiflexor of the foot at the ankle joint.',
      'Also performs inversion of the foot.',
      'Its weakness leads to a condition called foot drop.'
    ],
    answers: ['tibialis anterior', 'tibialis']
  },
  {
    structure: 'Phrenic Nerve',
    type: 'nerve',
    hints: [
      'A major nerve that originates in the neck (C3-C5 spinal levels).',
      'Passes down between the lung and heart to reach the respiratory diaphragm.',
      'It is the sole motor supply to the diaphragm muscle.',
      'Critical for breathing; its irritation can cause hiccups.'
    ],
    answers: ['phrenic nerve', 'phrenic']
  },
  {
    structure: 'Tibia',
    type: 'bone',
    hints: [
      'The larger, stronger, and more anterior of the two bones in the leg below the knee.',
      'Articulates with the femur superiorly and the talus bone inferiorly.',
      'Commonly called the shinbone.',
      'Contains the medial malleolus at its distal end.'
    ],
    answers: ['tibia', 'shinbone', 'shin bone']
  },
  {
    structure: 'Latissimus Dorsi',
    type: 'muscle',
    hints: [
      'A broad, flat muscle on the lumbar and thoracic regions of the back.',
      'Commonly known as the "lats" and is the largest muscle in the upper body.',
      'Responsible for extension, adduction, and internal rotation of the shoulder joint.',
      'Often called the "swimmer\'s muscle" because of its role in pulling the arm down.'
    ],
    answers: ['latissimus dorsi', 'lats', 'latissimus']
  },
  {
    structure: 'Sartorius',
    type: 'muscle',
    hints: [
      'The longest muscle in the entire human body.',
      'A long, thin, band-like muscle that runs obliquely down the anterior thigh.',
      'Performs flexion, abduction, and lateral rotation of the hip, and flexion of the knee.',
      'Often referred to as the tailor\'s muscle.'
    ],
    answers: ['sartorius', 'sartorius muscle']
  },
  {
    structure: 'Fibula',
    type: 'bone',
    hints: [
      'A slender bone located on the lateral side of the leg in the lower limb.',
      'It runs parallel to the shinbone but is much thinner and does not bear weight.',
      'Forms the lateral malleolus at the ankle joint.',
      'Commonly called the calf bone.'
    ],
    answers: ['fibula', 'calf bone', 'fibula bone']
  },
  {
    structure: 'Femoral Nerve',
    type: 'nerve',
    hints: [
      'The largest branch of the lumbar plexus (L2-L4).',
      'Supplies the muscles of the anterior thigh, including the quadriceps.',
      'Provides sensation to the anterior thigh and medial leg.',
      'Injury leads to loss of knee extension.'
    ],
    answers: ['femoral nerve', 'femoral']
  },
  {
    structure: 'Achilles Tendon',
    type: 'tendon',
    hints: [
      'A thick fibrous band of tissue at the back of the lower leg.',
      'Connects the calf muscles (gastrocnemius and soleus) to the heel bone (calcaneus).',
      'It is the thickest and strongest tendon in the human body.',
      'Also known as the calcaneal tendon.'
    ],
    answers: ['achilles tendon', 'achilles', 'calcaneal tendon']
  },
  {
    structure: 'Iliopsoas',
    type: 'muscle',
    hints: [
      'The strongest and primary flexor of the hip joint.',
      'Composed of the psoas major and iliacus muscles joining together.',
      'Originates from the lumbar vertebrae and iliac fossa, inserting into the lesser trochanter.',
      'Crucial for standing, walking, and running.'
    ],
    answers: ['iliopsoas', 'iliopsoas muscle']
  },
  {
    structure: 'Calcaneus',
    type: 'bone',
    hints: [
      'A large tarsal bone located in the posterior foot.',
      'It is the largest bone of the foot and forms the foundation of the heel.',
      'Articulates with the talus and cuboid bones.',
      'Serves as the attachment point for the Achilles tendon.'
    ],
    answers: ['calcaneus', 'heel bone', 'heel']
  },
  {
    structure: 'Sternocleidomastoid',
    type: 'muscle',
    hints: [
      'A prominent superficial muscle in the neck.',
      'Has two heads originating from the sternum and clavicle, inserting into the mastoid process.',
      'Flexes the neck and rotates the head to the opposite side.',
      'Supplied by the accessory nerve.'
    ],
    answers: ['sternocleidomastoid', 'scm', 'scm muscle']
  },
  {
    structure: 'Sternum',
    type: 'bone',
    hints: [
      'A flat bone located in the middle of the anterior chest wall.',
      'Consists of three parts: manubrium, body, and xiphoid process.',
      'Connects to the rib cartilages, forming the front of the rib cage.',
      'Commonly known as the breastbone.'
    ],
    answers: ['sternum', 'breastbone', 'breast bone']
  },
  {
    structure: 'Musculocutaneous Nerve',
    type: 'nerve',
    hints: [
      'A major branch of the lateral cord of the brachial plexus.',
      'Pierces the coracobrachialis muscle to run in the arm.',
      'Supplies the elbow flexor muscles (biceps brachii and brachialis).',
      'Provides sensation to the lateral forearm.'
    ],
    answers: ['musculocutaneous nerve', 'musculocutaneous']
  },
  {
    structure: 'Rectus Abdominis',
    type: 'muscle',
    hints: [
      'A paired muscle running vertically on each side of the anterior wall of the abdomen.',
      'Separated by a midline band of connective tissue called the linea alba.',
      'Responsible for flexing the lumbar spine (crunching).',
      'Commonly referred to as the "abs" or "six-pack".'
    ],
    answers: ['rectus abdominis', 'abs', 'rectus', 'abdominal muscle']
  },
  {
    structure: 'Radius',
    type: 'bone',
    hints: [
      'One of the two long bones of the forearm in the upper limb.',
      'Located on the lateral (thumb) side of the forearm.',
      'Articulates with the humerus at the elbow and the scaphoid/lunate bones at the wrist.',
      'Rotates around the ulna to perform pronation and supination.'
    ],
    answers: ['radius', 'radius bone']
  },
  {
    structure: 'Axillary Nerve',
    type: 'nerve',
    hints: [
      'A nerve originating from the posterior cord of the brachial plexus (C5-C6).',
      'Passes through the quadrangular space of the shoulder.',
      'Supplies the deltoid and teres minor muscles.',
      'Often damaged in shoulder dislocations or surgical neck fractures.'
    ],
    answers: ['axillary nerve', 'axillary']
  },
  {
    structure: 'Soleus',
    type: 'muscle',
    hints: [
      'A broad, flat muscle located beneath the gastrocnemius in the posterior calf.',
      'Performs plantar flexion of the ankle joint only (does not cross the knee).',
      'Crucial for maintaining standing posture by preventing the body from falling forward.',
      'Formed mostly of slow-twitch fibers for endurance.'
    ],
    answers: ['soleus', 'soleus muscle']
  },
  {
    structure: 'Ulna',
    type: 'bone',
    hints: [
      'One of the two long bones of the forearm in the upper limb.',
      'Located on the medial (pinky) side of the forearm.',
      'Contains the olecranon process which forms the bony tip of the elbow.',
      'Runs parallel to the radius and acts as the stabilizing bone of the forearm.'
    ],
    answers: ['ulna', 'ulna bone']
  },
  {
    structure: 'Peroneus Longus',
    type: 'muscle',
    hints: [
      'A superficial muscle in the lateral compartment of the leg.',
      'Also known as the fibularis longus.',
      'Performs plantar flexion and eversion of the foot at the ankle joint.',
      'Helps support the lateral and transverse arches of the foot.'
    ],
    answers: ['peroneus longus', 'fibularis longus', 'peroneus', 'fibularis']
  },
  {
    structure: 'Pelvis',
    type: 'bone',
    hints: [
      'A basin-shaped complex of bones connecting the trunk to the lower limbs.',
      'Composed of the sacrum, coccyx, and hip bones (ilium, ischium, pubis).',
      'Protects pelvic organs and supports the weight of the upper body.',
      'Contains the acetabulum cup for articulating with the femur head.'
    ],
    answers: ['pelvis', 'pelvic bone', 'hip bone']
  },
  {
    structure: 'Infraspinatus',
    type: 'muscle',
    hints: [
      'A thick triangular muscle occupying the infraspinous fossa of the scapula.',
      'One of the four rotator cuff muscles of the shoulder.',
      'Its primary action is external (lateral) rotation of the shoulder joint.',
      'Supplied by the suprascapular nerve.'
    ],
    answers: ['infraspinatus', 'infraspinatus muscle']
  },
  {
    structure: 'Supraspinatus',
    type: 'muscle',
    hints: [
      'A small muscle in the upper back that runs from the supraspinous fossa to the humerus.',
      'One of the four rotator cuff muscles of the shoulder.',
      'Initiates the first 15 degrees of shoulder abduction.',
      'The most commonly injured rotator cuff muscle (tendinitis/tears).'
    ],
    answers: ['supraspinatus', 'supraspinatus muscle']
  },
  {
    structure: 'Subscapularis',
    type: 'muscle',
    hints: [
      'A large triangular muscle that fills the subscapular fossa on the front of the scapula.',
      'The largest and strongest of the four rotator cuff muscles.',
      'Performs internal (medial) rotation of the shoulder joint.',
      'Lies between the shoulder blade and the thoracic ribs.'
    ],
    answers: ['subscapularis', 'subscapularis muscle']
  },
  {
    structure: 'Teres Minor',
    type: 'muscle',
    hints: [
      'A narrow, elongated muscle in the shoulder region.',
      'One of the four rotator cuff muscles.',
      'Assists the infraspinatus in external rotation and adduction of the arm.',
      'Supplied by the axillary nerve.'
    ],
    answers: ['teres minor', 'teres minor muscle']
  },
  {
    structure: 'Biceps Femoris',
    type: 'muscle',
    hints: [
      'A muscle located in the posterior thigh compartment.',
      'One of the three hamstring muscles, having a long and a short head.',
      'Performs knee flexion and hip extension.',
      'Supplied by the sciatic nerve.'
    ],
    answers: ['biceps femoris', 'biceps femoris muscle']
  },
  {
    structure: 'Semitendinosus',
    type: 'muscle',
    hints: [
      'A long superficial muscle in the posterior thigh.',
      'One of the three hamstring muscles, named for its remarkably long tendon of insertion.',
      'Performs hip extension and knee flexion/internal rotation.',
      'Forms part of the pes anserinus tendon group at the medial knee.'
    ],
    answers: ['semitendinosus', 'semitendinosus muscle']
  },
  {
    structure: 'Semimembranosus',
    type: 'muscle',
    hints: [
      'The most medial of the three hamstring muscles in the posterior thigh.',
      'Lies deep to the semitendinosus muscle.',
      'Performs knee flexion and hip extension.',
      'Its tendon insertional expansions reinforce the posterior knee joint capsule.'
    ],
    answers: ['semimembranosus', 'semimembranosus muscle']
  },
  {
    structure: 'Brachioradialis',
    type: 'muscle',
    hints: [
      'A muscle of the forearm that flexes the forearm at the elbow joint.',
      'Unique because it flexes the elbow but is located in the posterior/extensor compartment.',
      'Most effective when the forearm is in a semi-pronation position (hammer grip).',
      'Supplied by the radial nerve.'
    ],
    answers: ['brachioradialis', 'brachioradialis muscle']
  },
  {
    structure: 'Obturator Nerve',
    type: 'nerve',
    hints: [
      'A branch of the lumbar plexus (L2-L4).',
      'Passes through the obturator canal to enter the medial thigh compartment.',
      'Supplies the adductor muscles of the hip (e.g. adductor longus, gracilis).',
      'Provides sensory innervation to the skin of the medial thigh.'
    ],
    answers: ['obturator nerve', 'obturator']
  },
  {
    structure: 'Anterior Cruciate Ligament',
    type: 'ligament',
    hints: [
      'An important stabilizing ligament inside the knee joint capsule.',
      'Prevents the tibia bone from sliding forward relative to the femur bone.',
      'Frequently torn during sports involving sudden pivots, stops, or landing impacts.',
      'Commonly referred to by its 3-letter acronym (ACL).'
    ],
    answers: ['anterior cruciate ligament', 'acl', 'acl ligament']
  }
];

const activeGames = new Map();

function normalizeAnswer(str) {
  if (!str) return '';
  return str
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ةه]/g, 'ه')
    .replace(/[ىي]/g, 'ي')
    .replace(/[-_]/g, '');
}

// Generate unique room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (activeGames.has(code)) return generateRoomCode();
  return code;
}

// Create a new game room
app.post('/api/games/create', authMiddleware, (req, res) => {
  const { rounds, roundDuration } = req.body;
  const username = req.user.username;
  
  const roomRounds = Math.min(10, Math.max(1, parseInt(rounds) || 5));
  const roomDuration = Math.min(120, Math.max(15, parseInt(roundDuration) || 60));
  
  const roomCode = generateRoomCode();
  
  const newRoom = {
    code: roomCode,
    host: username,
    rounds: roomRounds,
    roundDuration: roomDuration,
    status: 'waiting',
    players: [
      { username, score: 0, joinedAt: Date.now() }
    ],
    currentRound: 0,
    currentQuestion: null,
    questionsPool: [...ANATOMY_QUESTIONS],
    roundStartTime: 0,
    roundWinner: null,
    intermissionEndTime: 0,
    answersLog: []
  };
  
  activeGames.set(roomCode, newRoom);
  res.status(201).json(newRoom);
});

// Join an existing room
app.post('/api/games/join', authMiddleware, (req, res) => {
  const { roomCode } = req.body;
  const username = req.user.username;
  
  if (!roomCode) {
    return res.status(400).json({ error: 'Room code is required.' });
  }
  
  const codeNormalized = roomCode.trim().toUpperCase();
  const room = activeGames.get(codeNormalized);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found. Check the code.' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'Cannot join, the game has already started.' });
  }
  
  const isAlreadyIn = room.players.some(p => p.username === username);
  if (!isAlreadyIn) {
    room.players.push({ username, score: 0, joinedAt: Date.now() });
    room.answersLog.push({
      type: 'system',
      text: `Joined ${username} to the room.`
    });
  }
  
  res.json(room);
});

// Start the game (Host only)
app.post('/api/games/start', authMiddleware, (req, res) => {
  const { roomCode } = req.body;
  const username = req.user.username;
  
  const room = activeGames.get(roomCode?.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  
  if (room.host !== username) {
    return res.status(403).json({ error: 'Only the room creator can start the game.' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'The game has already started.' });
  }
  
  // Select first question
  room.status = 'playing';
  room.currentRound = 1;
  
  const questionIdx = Math.floor(Math.random() * room.questionsPool.length);
  room.currentQuestion = room.questionsPool[questionIdx];
  room.questionsPool.splice(questionIdx, 1);
  
  room.roundStartTime = Date.now();
  room.roundWinner = null;
  room.intermissionEndTime = 0;
  room.answersLog = [{
    type: 'system',
    text: 'Game started! Round 1.'
  }];
  
  res.json(room);
});

// Get room status (with dynamic evaluations for time elapsed)
app.get('/api/games/status/:roomCode', authMiddleware, async (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();
  const room = activeGames.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  
  const now = Date.now();
  
  if (room.status === 'playing') {
    if (!room.roundWinner) {
      const elapsedSeconds = (now - room.roundStartTime) / 1000;
      if (elapsedSeconds >= room.roundDuration) {
        room.roundWinner = 'timeout';
        room.intermissionEndTime = now;
        room.answersLog.push({
          type: 'system',
          text: `Time out! Nobody answered in time. The answer was: ${room.currentQuestion.structure}`
        });
      }
    }
  }
  
  const clientRoom = {
    ...room,
    currentQuestion: room.currentQuestion ? {
      type: room.currentQuestion.type,
      hints: room.currentQuestion.hints
    } : null
  };
  
  if (room.currentQuestion && (room.roundWinner || room.status === 'finished')) {
    clientRoom.currentQuestion.structure = room.currentQuestion.structure;
  }
  
  res.json(clientRoom);
});

// Advance to the next round or finish the game (Host only)
app.post('/api/games/next-round', authMiddleware, async (req, res) => {
  const { roomCode } = req.body;
  const username = req.user.username;
  
  const room = activeGames.get(roomCode?.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  
  if (room.host !== username) {
    return res.status(403).json({ error: 'Only the room creator can move to the next round.' });
  }
  
  if (room.status !== 'playing' || !room.roundWinner) {
    return res.status(400).json({ error: 'Cannot move to the next round now.' });
  }
  
  const now = Date.now();
  if (room.currentRound < room.rounds && room.questionsPool.length > 0) {
    room.currentRound += 1;
    const questionIdx = Math.floor(Math.random() * room.questionsPool.length);
    room.currentQuestion = room.questionsPool[questionIdx];
    room.questionsPool.splice(questionIdx, 1);
    
    room.roundStartTime = now;
    room.roundWinner = null;
    room.intermissionEndTime = 0;
    room.answersLog.push({
      type: 'system',
      text: `Round ${room.currentRound} started!`
    });
  } else {
    room.status = 'finished';
    
    let topScore = -1;
    let winnerName = '';
    room.players.forEach(p => {
      if (p.score > topScore) {
        topScore = p.score;
        winnerName = p.username;
      }
    });
    
    room.finalWinner = winnerName;
    
    if (winnerName && topScore > 0) {
      const playerCount = room.players.length;
      const xpRewarded = 30 + (playerCount * 20);
      room.xpRewarded = xpRewarded;
      
      try {
        await db.run(
          'UPDATE users SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ? WHERE username = ?',
          [xpRewarded, xpRewarded, winnerName]
        );
        room.answersLog.push({
          type: 'system',
          text: `Congratulations to the winner ${winnerName}! Received ${xpRewarded} XP 🎉`
        });
      } catch (err) {
        console.error('Failed to reward XP:', err);
      }
    } else {
      room.xpRewarded = 0;
      room.answersLog.push({
        type: 'system',
        text: 'Game ended with no winning players.'
      });
    }
  }
  
  const clientRoom = {
    ...room,
    currentQuestion: room.currentQuestion ? {
      type: room.currentQuestion.type,
      hints: room.currentQuestion.hints
    } : null
  };
  
  if (room.currentQuestion && (room.roundWinner || room.status === 'finished')) {
    clientRoom.currentQuestion.structure = room.currentQuestion.structure;
  }
  
  res.json(clientRoom);
});

// Submit answer
app.post('/api/games/submit-answer', authMiddleware, (req, res) => {
  const { roomCode, answer } = req.body;
  const username = req.user.username;
  
  const room = activeGames.get(roomCode?.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  
  if (room.status !== 'playing' || room.roundWinner) {
    return res.status(400).json({ error: 'There is no active round to receive answers now.' });
  }
  
  const normalizedUserAnswer = normalizeAnswer(answer);
  const isCorrect = room.currentQuestion.answers.some(
    ans => normalizeAnswer(ans) === normalizedUserAnswer
  );
  
  const elapsed = (Date.now() - room.roundStartTime) / 1000;
  
  if (isCorrect) {
    room.roundWinner = username;
    room.intermissionEndTime = Date.now() + 5000;
    
    const timeLeftRatio = Math.max(0, 1 - (elapsed / room.roundDuration));
    const scoreEarned = Math.max(10, Math.round(100 * timeLeftRatio));
    
    const playerIdx = room.players.findIndex(p => p.username === username);
    if (playerIdx > -1) {
      room.players[playerIdx].score += scoreEarned;
    }
    
    room.answersLog.push({
      type: 'correct',
      text: `🎉 Correct answer from ${username}! (+${scoreEarned} points) - The structure is: ${room.currentQuestion.structure}`
    });
    
    res.json({ isCorrect: true, room });
  } else {
    room.answersLog.push({
      type: 'wrong',
      text: `${username}: ${answer}`
    });
    res.json({ isCorrect: false });
  }
});

// Leave room
app.post('/api/games/leave', authMiddleware, (req, res) => {
  const { roomCode } = req.body;
  const username = req.user.username;
  
  const room = activeGames.get(roomCode?.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }
  
  room.players = room.players.filter(p => p.username !== username);
  room.answersLog.push({
    type: 'system',
    text: `Left ${username} the room.`
  });
  
  if (room.players.length === 0) {
    activeGames.delete(room.code);
  } else if (room.host === username) {
    room.host = room.players[0].username;
  }
  
  res.json({ message: 'Left successfully.' });
});

app.post('/api/games/play-again', authMiddleware, (req, res) => {
  const { roomCode } = req.body;
  const username = req.user.username;
  
  const room = activeGames.get(roomCode?.toUpperCase());
  if (!room) {
    return res.status(404).json({ error: 'Room not found.' });
  }

  if (room.host !== username) {
    return res.status(403).json({ error: 'Only the host can replay the game.' });
  }

  room.status = 'waiting';
  room.players.forEach(p => { p.score = 0; });
  room.currentRound = 0;
  room.currentQuestion = null;
  room.questionsPool = [...ANATOMY_QUESTIONS];
  room.roundStartTime = 0;
  room.roundWinner = null;
  room.intermissionEndTime = 0;
  room.answersLog = [];
  room.finalWinner = null;

  activeGames.set(room.code, room);
  res.json(room);
});

// --- WEEKLY XP RESET SCHEDULER ---
// Resets weekly_xp every Sunday at midnight
function scheduleWeeklyReset() {
  function msUntilNextSundayMidnight() {
    const now = new Date();
    const nextSunday = new Date(now);
    const dayOfWeek = now.getDay(); // 0=Sun, 1=Mon, ...
    const daysUntilSunday = dayOfWeek === 0 ? 7 : 7 - dayOfWeek;
    nextSunday.setDate(now.getDate() + daysUntilSunday);
    nextSunday.setHours(0, 0, 0, 0);
    return nextSunday.getTime() - now.getTime();
  }

  function runReset() {
    db.run('UPDATE users SET weekly_xp = 0', [], (err) => {
      if (err) {
        console.error('[Weekly Reset] Failed:', err.message);
      } else {
        console.log(`[Weekly Reset] weekly_xp reset for all users at ${new Date().toISOString()}`);
      }
    });
    // Schedule next reset in 7 days
    setTimeout(runReset, 7 * 24 * 60 * 60 * 1000);
  }

  const msUntil = msUntilNextSundayMidnight();
  console.log(`[Weekly Reset] Next reset in ${Math.round(msUntil / 3600000)} hours`);
  setTimeout(runReset, msUntil);
}

scheduleWeeklyReset();

// --- COMMUNITY POSTS ROUTES ---

// Get all community posts
app.get('/api/community/posts', async (req, res) => {
  try {
    let currentUserId = null;
    const authHeader = req.headers['authorization'];
    if (authHeader) {
      try {
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        currentUserId = decoded.id;
      } catch (e) {}
    }

    const posts = await db.all(`
      SELECT p.*, u.username, u.batch, u.total_xp 
      FROM community_posts p
      JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC
      LIMIT 100
    `);

    const formatted = await Promise.all(posts.map(async (p) => {
      let isLiked = false;
      if (currentUserId) {
        const like = await db.get('SELECT id FROM community_post_likes WHERE user_id = ? AND post_id = ?', [currentUserId, p.id]);
        isLiked = !!like;
      }
      return {
        id: p.id,
        content: p.content,
        likes_count: p.likes_count,
        created_at: p.created_at,
        username: p.username,
        batch: p.batch,
        rank: getRank(p.total_xp),
        isLiked
      };
    }));

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while fetching posts.' });
  }
});

// Post a new message to community feed
app.post('/api/community/posts', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'Cannot publish an empty post.' });
  }

  try {
    const mod = await checkModerationStatus(req.user.id);
    if (mod.banned) {
      return res.status(403).json({ error: 'Your account is banned. You cannot publish community posts.' });
    }
    if (mod.muted) {
      const expiryText = mod.mute_expires_at ? `until ${new Date(mod.mute_expires_at).toLocaleString()}` : 'permanently';
      return res.status(403).json({ error: `You are muted ${expiryText} and cannot publish community posts.` });
    }

    await db.run(
      'INSERT INTO community_posts (user_id, content, likes_count, created_at) VALUES (?, ?, 0, ?)',
      [req.user.id, content.trim(), new Date().toISOString()]
    );

    const user = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
    const newTotalXp = user.total_xp + 10;
    const newWeeklyXp = user.weekly_xp + 10;
    await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, req.user.id]);

    res.status(201).json({ 
      message: 'Published successfully! You earned +10 XP ⚡',
      xp_reward: 10,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while publishing.' });
  }
});

// Like/Unlike post
app.post('/api/community/posts/:id/like', authMiddleware, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const post = await db.get('SELECT id, likes_count FROM community_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'Post not found.' });
    }

    const existingLike = await db.get('SELECT id FROM community_post_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
    
    if (existingLike) {
      await db.run('DELETE FROM community_post_likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      const newLikesCount = Math.max(0, post.likes_count - 1);
      await db.run('UPDATE community_posts SET likes_count = ? WHERE id = ?', [newLikesCount, postId]);
      res.json({ liked: false, likes_count: newLikesCount });
    } else {
      await db.run('INSERT INTO community_post_likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      const newLikesCount = post.likes_count + 1;
      await db.run('UPDATE community_posts SET likes_count = ? WHERE id = ?', [newLikesCount, postId]);
      res.json({ liked: true, likes_count: newLikesCount });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'An error occurred while liking the post.' });
  }
});

// Fallback for React Router (must be AFTER all API routes)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
