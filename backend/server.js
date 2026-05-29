require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./database');
const { authMiddleware, JWT_SECRET } = require('./authMiddleware');
const { sendVerificationCode } = require('./emailService');

const activeUsers = new Map(); // username -> timestamp


// Admin Authentication Middleware (Loads role dynamically from database)
const adminMiddleware = [authMiddleware, async (req, res, next) => {
  try {
    const user = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'غير مسموح. هذه الصفحة مخصصة للمسؤولين فقط.' });
    }
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء التحقق من الصلاحيات.' });
  }
}];

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Dynamic Rank Calculator Helper
function getRank(xp) {
  if (xp >= 6000) return { name_ar: 'أسطورة الريهاب', name_en: 'Rehab Legend', emoji: '👑', tier: 5 };
  if (xp >= 3000) return { name_ar: 'النيوروچي', name_en: 'Neurogenic', emoji: '🧠', tier: 4 };
  if (xp >= 1500) return { name_ar: 'سيد الأورثو', name_en: 'Ortho King', emoji: '🦴', tier: 3 };
  if (xp >= 500) return { name_ar: 'أخصائي الألم', name_en: 'Pain Specialist', emoji: '⚡', tier: 2 };
  return { name_ar: 'طالب تشريح', name_en: 'Anatomy Rookie', emoji: '🧪', tier: 1 };
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
          'الحلقة الأولى: مقدمة في العلاج الطبيعي وسر المهنة',
          'Episode 1: Intro to Physical Therapy & Career Secrets',
          'في هذه الحلقة نتحدث مع الدكتور أحمد علي حول أساسيات العلاج الطبيعي والمفاهيم الخاطئة الشائعة.',
          'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=600&q=80',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Placeholder
          new Date().toISOString()
        ]
      );

      const ep2 = await db.run(
        `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'الحلقة الثانية: تشريح الطرف السفلي والميكانيكا الحيوية',
          'Episode 2: Lower Limb Anatomy & Biomechanics',
          'شرح تفصيلي لتشريح الركبة والكاحل وأهم الإصابات التي تواجه الرياضيين وطرق علاجها.',
          'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&w=600&q=80',
          'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
          new Date().toISOString()
        ]
      );

      const ep3 = await db.run(
        `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [
          'الحلقة الثالثة: تأهيل إصابات الملاعب والرباط الصليبي',
          'Episode 3: Sports Injuries & ACL Rehabilitation',
          'رحلة التعافي الكامل بعد عملية الرباط الصليبي من اليوم الأول وحتى العودة للملعب.',
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
          'ما هو أول خط دفاع في الجسم لعلاج المشاكل الحركية؟',
          JSON.stringify(['الأدوية المسكنة', 'الراحة التامة', 'التمارين العلاجية والتشخيص الصحيح', 'العمليات الجراحية']),
          2, // 'التمارين العلاجية والتشخيص الصحيح'
          150
        ]
      );

      await db.run(
        `INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward) VALUES (?, ?, ?, ?, ?)`,
        [
          ep2.id,
          'ما هي أكبر عضلة في منطقة الفخذ الخلفية؟',
          JSON.stringify(['Biceps Femoris', 'Semitendinosus', 'Semimembranosus', 'Rectus Femoris']),
          0, // 'Biceps Femoris'
          150
        ]
      );

      await db.run(
        `INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward) VALUES (?, ?, ?, ?, ?)`,
        [
          ep3.id,
          'كم يستغرق تأهيل الرباط الصليبي كحد أدنى للعودة للملاعب؟',
          JSON.stringify(['من شهر لشهرين', 'من 3 لـ 4 أشهر', 'من 6 لـ 9 أشهر', 'أكثر من سنتين']),
          2, // 'من 6 لـ 9 أشهر'
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
          'تسمية عضلات الكتف',
          'Anatomy',
          'trivia',
          JSON.stringify({
            questions: [
              { q: 'ما هي العضلة المسؤولة عن رفع الذراع جانباً بزاوية 90 درجة؟', options: ['Deltoid', 'Supraspinatus', 'Infraspinatus', 'Subscapularis'], correct: 0 },
              { q: 'أي من عضلات الـ Rotator Cuff تقوم بعمل Internal Rotation؟', options: ['Supraspinatus', 'Infraspinatus', 'Teres Minor', 'Subscapularis'], correct: 3 },
              { q: 'ما هو العصب المغذي لعضلة الـ Deltoid؟', options: ['Axillary nerve', 'Radial nerve', 'Median nerve', 'Ulnar nerve'], correct: 0 }
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
seedDatabase().then(() => {
  seedChat();
});

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
        { user: 'sara_anatomy', text: 'سلام عليكم يا جماعة، أنا لسة مسجلة في المنصة النهاردة بجد فكرة خرافية! 😍' },
        { user: 'omar_ortho', text: 'وعليكم السلام يا سارة! منورة المنصة.. شفتي كود الحلقة الأولى السري؟' },
        { user: 'sara_anatomy', text: 'لا لسة، هو فين بالظبط؟' },
        { user: 'ahmed_physio', text: 'هتلاقيه في الدقيقة 12:45 وسط كلام الدكتور أحمد علي عن سر المهنة 😉' },
        { user: 'nour_rehab', text: 'منورين يا شباب! كويز الحلقة التانية نزل وفيه أسئلة ميكانيكا حيوية عن الركبة.. مين حله وقفل الـ XP؟' },
        { user: 'omar_ortho', text: 'أنا حليته يا دكتورة نور! بس السؤال التاني لفّفني شوية عن الـ Biceps Femoris 😂' },
        { user: 'ahmed_physio', text: 'الـ Biceps Femoris دي بتعمل Flexion للركبة و Extension للفخذ.. ركز يا عمر التشريح أساس كل حاجة 🦴' }
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

// 1. Auth: Register
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password, batch } = req.body;

  if (!username || !email || !password || !batch) {
    return res.status(400).json({ error: 'الرجاء ملء جميع الحقول المطلوبة.' });
  }

  try {
    // Check if user already exists
    const existingUser = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username.trim(), email.trim()]);
    if (existingUser) {
      return res.status(400).json({ error: 'اسم المستخدم أو البريد الإلكتروني مسجل بالفعل.' });
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

    // Send email code
    await sendVerificationCode(email.trim(), verificationCode, username.trim());

    res.status(201).json({ message: 'تم التسجيل بنجاح. يرجى التحقق من بريدك الإلكتروني للحصول على رمز التفعيل.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ في الخادم أثناء التسجيل.' });
  }
});

// 2. Auth: Verify Code
app.post('/api/auth/verify', async (req, res) => {
  const { email, code } = req.body;

  if (!email || !code) {
    return res.status(400).json({ error: 'الرجاء إدخال البريد الإلكتروني وكود التفعيل.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE email = ?', [email.trim()]);
    if (!user) {
      return res.status(404).json({ error: 'هذا الحساب غير موجود.' });
    }

    if (user.is_verified === 1) {
      return res.status(400).json({ error: 'تم تفعيل هذا الحساب بالفعل.' });
    }

    if (user.verification_code !== code.toString().trim()) {
      return res.status(400).json({ error: 'رمز التفعيل غير صحيح.' });
    }

    // Update status
    await db.run('UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?', [user.id]);

    // Issue JWT Token
    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '7d' });

    res.json({
      message: 'تم تفعيل الحساب بنجاح!',
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
        rank: getRank(user.total_xp)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تفعيل الحساب.' });
  }
});

// 3. Auth: Login
app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'الرجاء إدخال اسم المستخدم وكلمة المرور.' });
  }

  try {
    const user = await db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username.trim(), username.trim()]);
    if (!user) {
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
    }

    if (user.is_verified === 0) {
      return res.status(400).json({ error: 'يرجى تفعيل الحساب أولاً باستخدام الكود المرسل لبريدك الإلكتروني.' });
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(400).json({ error: 'اسم المستخدم أو كلمة المرور غير صحيحة.' });
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
        rank: getRank(updatedTotalXp)
      },
      rewards: {
        daily_login: dailyLoginAwarded,
        streak_bonus: streakAwarded
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الدخول.' });
  }
});

// 4. Auth: Get Current Profile
app.get('/api/auth/me', authMiddleware, async (req, res) => {
  try {
    const user = await db.get('SELECT id, username, email, batch, total_xp, weekly_xp, streak_count, last_login_date, role FROM users WHERE id = ?', [req.user.id]);
    if (!user) {
      return res.status(404).json({ error: 'المستخدم غير موجود.' });
    }

    res.json({
      user: {
        ...user,
        role: user.role || 'user',
        rank: getRank(user.total_xp)
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الملف الشخصي.' });
  }
});

// --- EPISODES ROUTES ---

// Get all episodes
app.get('/api/episodes', async (req, res) => {
  try {
    const episodes = await db.all('SELECT * FROM episodes ORDER BY id DESC');
    res.json(episodes);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الحلقات.' });
  }
});

// Get single episode
app.get('/api/episodes/:id', async (req, res) => {
  try {
    const episode = await db.get('SELECT * FROM episodes WHERE id = ?', [req.params.id]);
    if (!episode) {
      return res.status(404).json({ error: 'الحلقة غير موجودة.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء جلب تفاصيل الحلقة.' });
  }
});

// Create Episode (Admin role)
app.post('/api/episodes', async (req, res) => {
  const { title_ar, title_en, description, thumbnail_url, youtube_url } = req.body;
  if (!title_ar || !title_en) {
    return res.status(400).json({ error: 'عنوان الحلقة مطلوب.' });
  }

  try {
    const result = await db.run(
      `INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [title_ar, title_en, description, thumbnail_url, youtube_url, new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'تم إضافة الحلقة بنجاح.' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء إضافة الحلقة.' });
  }
});

// --- XP CODES ROUTES ---

// Redeem a Code
app.post('/api/xp-codes/redeem', authMiddleware, async (req, res) => {
  const { code } = req.body;
  if (!code) {
    return res.status(400).json({ error: 'الرجاء إدخال الرمز السري.' });
  }

  const cleanCode = code.trim().toUpperCase();

  try {
    // 1. Check code existence
    const xpCode = await db.get('SELECT * FROM xp_codes WHERE code = ?', [cleanCode]);
    if (!xpCode) {
      return res.status(404).json({ error: 'الرمز السري غير صحيح أو غير موجود.' });
    }

    // 2. Check Expiry
    if (xpCode.expiry_date) {
      const expiry = new Date(xpCode.expiry_date);
      if (expiry < new Date()) {
        return res.status(400).json({ error: 'عذرًا، انتهت صلاحية هذا الرمز.' });
      }
    }

    // 3. Check Max Uses
    if (xpCode.current_uses >= xpCode.max_uses) {
      return res.status(400).json({ error: 'عذرًا، وصل هذا الرمز إلى الحد الأقصى للاستخدام.' });
    }

    // 4. Check if User already redeemed it
    const alreadyRedeemed = await db.get('SELECT * FROM code_redemptions WHERE user_id = ? AND code_id = ?', [req.user.id, xpCode.id]);
    if (alreadyRedeemed) {
      return res.status(400).json({ error: 'لقد قمت باستخدام هذا الرمز مسبقاً.' });
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
      message: `تم تفعيل الرمز بنجاح! حصلت على +${xpCode.xp_reward} XP`,
      xp_earned: xpCode.xp_reward,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء معالجة الرمز السري.' });
  }
});

// Create XP Code (Admin role)
app.post('/api/xp-codes', adminMiddleware, async (req, res) => {
  const { code, xp_reward, type, episode_id, max_uses, expiry_date } = req.body;
  if (!code || !xp_reward || !type) {
    return res.status(400).json({ error: 'الرمز وقيمة النقاط والنوع حقول مطلوبة.' });
  }

  try {
    const result = await db.run(
      `INSERT INTO xp_codes (code, xp_reward, type, episode_id, max_uses, expiry_date, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [code.trim().toUpperCase(), xp_reward, type, episode_id || null, max_uses || 9999, expiry_date || null, new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'تم إنشاء الرمز بنجاح.' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الرمز (ربما الرمز مكرر).' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء جلب لوحة الصدارة.' });
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
      `SELECT m.id, m.message, m.created_at, m.reply_to_id, m.is_edited,
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
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الرسائل.' });
  }
});

// Post chat message
app.post('/api/chat', authMiddleware, async (req, res) => {
  const { message, reply_to_id } = req.body;
  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'لا يمكن إرسال رسالة فارغة.' });
  }

  try {
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
    return res.status(400).json({ error: 'الرمز التعبيري مطلوب.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء حفظ التفاعل.' });
  }
});

// Edit a chat message
app.put('/api/chat/:messageId', authMiddleware, async (req, res) => {
  const { messageId } = req.params;
  const { message } = req.body;

  if (!message || message.trim() === '') {
    return res.status(400).json({ error: 'الرسالة لا يمكن أن تكون فارغة.' });
  }

  try {
    const existing = await db.get('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
    if (!existing) {
      return res.status(404).json({ error: 'الرسالة غير موجودة.' });
    }

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ error: 'غير مصرح لك بتعديل هذه الرسالة.' });
    }

    await db.run(
      'UPDATE chat_messages SET message = ?, is_edited = 1 WHERE id = ?',
      [message.trim(), messageId]
    );

    res.json({ success: true, message: 'تم تعديل الرسالة بنجاح.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تعديل الرسالة.' });
  }
});

// Delete a chat message
// Delete a chat message (Only owner or Admin)
app.delete('/api/chat/:messageId', authMiddleware, async (req, res) => {
  const { messageId } = req.params;

  try {
    const existing = await db.get('SELECT * FROM chat_messages WHERE id = ?', [messageId]);
    if (!existing) {
      return res.status(404).json({ error: 'الرسالة غير موجودة.' });
    }

    const requester = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const isAdmin = requester && requester.role === 'admin';

    if (existing.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذه الرسالة.' });
    }

    await db.run('DELETE FROM chat_messages WHERE id = ?', [messageId]);
    res.json({ success: true, message: 'تم حذف الرسالة بنجاح.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الرسالة.' });
  }
});

// Delete a comment/reply (Only owner or Admin)
app.delete('/api/comments/:commentId', authMiddleware, async (req, res) => {
  const { commentId } = req.params;

  try {
    const existing = await db.get('SELECT * FROM interactions WHERE id = ? AND (type = "comment" OR type = "reply" OR type = "comment_like")', [commentId]);
    if (!existing) {
      return res.status(404).json({ error: 'التعليق غير موجود.' });
    }

    const requester = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const isAdmin = requester && requester.role === 'admin';

    if (existing.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذا التعليق.' });
    }

    // Delete comment, replies and likes linked to it
    await db.run('DELETE FROM interactions WHERE id = ? OR parent_id = ? OR parent_id IN (SELECT id FROM interactions WHERE parent_id = ?)', [commentId, commentId, commentId]);

    res.json({ success: true, message: 'تم حذف التعليق بنجاح.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف التعليق.' });
  }
});

// Delete a suggestion (Only owner or Admin)
app.delete('/api/suggestions/:id', authMiddleware, async (req, res) => {
  const suggestionId = req.params.id;

  try {
    const existing = await db.get('SELECT * FROM suggestions WHERE id = ?', [suggestionId]);
    if (!existing) {
      return res.status(404).json({ error: 'الاقتراح غير موجود.' });
    }

    const requester = await db.get('SELECT role FROM users WHERE id = ?', [req.user.id]);
    const isAdmin = requester && requester.role === 'admin';

    if (existing.user_id !== req.user.id && !isAdmin) {
      return res.status(403).json({ error: 'غير مصرح لك بحذف هذا الاقتراح.' });
    }

    await db.run('DELETE FROM suggestions WHERE id = ?', [suggestionId]);
    await db.run('DELETE FROM suggestion_upvotes WHERE suggestion_id = ?', [suggestionId]);

    res.json({ success: true, message: 'تم حذف الاقتراح بنجاح.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء حذف الاقتراح.' });
  }
});

// Bulk delete chat messages
app.post('/api/chat/delete-bulk', authMiddleware, async (req, res) => {
  const { messageIds } = req.body;

  if (!Array.isArray(messageIds) || messageIds.length === 0) {
    return res.status(400).json({ error: 'لم يتم تحديد رسائل للحذف.' });
  }

  try {
    const placeholders = messageIds.map(() => '?').join(',');
    const sql = `DELETE FROM chat_messages WHERE id IN (${placeholders}) AND user_id = ?`;
    const params = [...messageIds, req.user.id];

    const result = await db.run(sql, params);
    
    res.json({ 
      success: true, 
      message: 'تم حذف الرسائل المحددة بنجاح.',
      changes: result.changes 
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء الحذف الجماعي للرسائل.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الألعاب.' });
  }
});

// Play mini game and earn XP (limit 3 times per day)
app.post('/api/games/:id/play', authMiddleware, async (req, res) => {
  const gameId = req.params.id;
  const todayStr = new Date().toISOString().split('T')[0];

  try {
    const game = await db.get('SELECT * FROM mini_games WHERE id = ?', [gameId]);
    if (!game) {
      return res.status(404).json({ error: 'اللعبة غير موجودة.' });
    }

    const playCount = await db.get(
      `SELECT COUNT(*) as count FROM game_plays 
       WHERE user_id = ? AND played_at LIKE ?`,
      [req.user.id, `${todayStr}%`]
    );

    if (playCount.count >= 3) {
      return res.status(400).json({ error: 'لقد وصلت للحد الأقصى للعب اليوم (3 مرات). يمكنك اللعب غداً لكسب الـ XP!' });
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
      message: `رائع! أنهيت اللعبة بنجاح وحصلت على +${xpReward} XP!`,
      xp_earned: xpReward,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp),
      plays_today: playCount.count + 1
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل نقاط اللعبة.' });
  }
});

// --- EPISODE INTERACTIONS (LIKE / COMMENT / SHARE) ---

// Post an interaction on an episode (like, comment, share, comment_like)
app.post('/api/episodes/:id/interact', authMiddleware, async (req, res) => {
  const { id: episodeId } = req.params;
  const { type, content, parent_id } = req.body; // type: 'like' | 'comment' | 'share' | 'comment_like'

  if (!type || !['like', 'comment', 'share', 'comment_like'].includes(type)) {
    return res.status(400).json({ error: 'النوع يجب أن يكون like أو comment أو share أو comment_like.' });
  }
  if (type === 'comment' && (!content || content.trim() === '')) {
    return res.status(400).json({ error: 'محتوى التعليق مطلوب.' });
  }
  if (type === 'comment_like' && !parent_id) {
    return res.status(400).json({ error: 'معرّف التعليق (parent_id) مطلوب للإعجاب.' });
  }

  const XP_MAP = { like: 5, comment: 15, share: 25, comment_like: 0 };

  try {
    const episode = await db.get('SELECT id FROM episodes WHERE id = ?', [episodeId]);
    if (!episode) return res.status(404).json({ error: 'الحلقة غير موجودة.' });

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
        return res.status(400).json({ error: 'لقد قمت بهذا الإجراء مسبقاً.' });
      }
    }

    // For main comments (parent_id is null/undefined), enforce only one per episode
    if (type === 'comment' && !parent_id) {
      const existingComment = await db.get(
        'SELECT id FROM interactions WHERE user_id = ? AND episode_id = ? AND type = ? AND parent_id IS NULL',
        [req.user.id, episodeId, 'comment']
      );
      if (existingComment) {
        return res.status(400).json({ error: 'لقد علقت على هذه الحلقة مسبقاً.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل التفاعل.' });
  }
});

// Post a referral visit link to credit the sharing user
app.post('/api/episodes/:id/referral', async (req, res) => {
  const { id: episodeId } = req.params;
  const { referrer } = req.body;

  if (!referrer) {
    return res.status(400).json({ error: 'اسم المحيل (referrer) مطلوب.' });
  }

  try {
    const referrerUser = await db.get('SELECT id, total_xp, weekly_xp FROM users WHERE username = ?', [referrer]);
    if (!referrerUser) {
      return res.status(404).json({ error: 'المحيل غير موجود.' });
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
      return res.status(200).json({ success: false, message: 'لا يمكن إحالة نفسك.' });
    }

    // Check if the referrer has already shared this episode
    const existing = await db.get(
      'SELECT id FROM interactions WHERE user_id = ? AND episode_id = ? AND type = "share"',
      [referrerUser.id, episodeId]
    );

    if (existing) {
      return res.status(200).json({ success: false, message: 'تم احتساب نقاط المشاركة للمحيل مسبقاً.' });
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
      message: 'تم منح نقاط المشاركة للمحيل بنجاح.',
      referrer: referrer,
      xp_awarded: xpGain
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: 'حدث خطأ في معالجة الإحالة.' });
  }
});

// --- QUIZ SUBMISSION ---

// Submit quiz answer
app.post('/api/episodes/:id/quiz/submit', authMiddleware, async (req, res) => {
  const { id: episodeId } = req.params;
  const { quiz_id, answer_index } = req.body;

  if (quiz_id === undefined || answer_index === undefined) {
    return res.status(400).json({ error: 'معرّف الكويز والإجابة مطلوبان.' });
  }

  try {
    // Check quiz exists and belongs to episode
    const quiz = await db.get('SELECT * FROM quizzes WHERE id = ? AND episode_id = ?', [quiz_id, episodeId]);
    if (!quiz) return res.status(404).json({ error: 'الكويز غير موجود.' });

    // Check if already submitted
    const already = await db.get('SELECT * FROM quiz_submissions WHERE user_id = ? AND quiz_id = ?', [req.user.id, quiz_id]);
    if (already) {
      return res.status(400).json({
        error: 'لقد أجبت على هذا الكويز مسبقاً.',
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
      message: isCorrect ? `إجابة صحيحة! حصلت على +${xpEarned} XP 🎉` : 'إجابة خاطئة. حاول مجدداً في الحلقة القادمة!'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الإجابة.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء جلب الاقتراحات.' });
  }
});

// Post a suggestion
app.post('/api/suggestions', authMiddleware, async (req, res) => {
  const { title, content } = req.body;
  if (!title || !content) {
    return res.status(400).json({ error: 'العنوان والمحتوى مطلوبان.' });
  }

  try {
    const result = await db.run(
      'INSERT INTO suggestions (user_id, title, content, created_at) VALUES (?, ?, ?, ?)',
      [req.user.id, title.trim(), content.trim(), new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'تم إرسال اقتراحك بنجاح! شكراً لمشاركتك.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء إرسال الاقتراح.' });
  }
});

// Upvote a suggestion (toggle)
app.post('/api/suggestions/:id/upvote', authMiddleware, async (req, res) => {
  const suggestionId = req.params.id;

  try {
    const suggestion = await db.get('SELECT * FROM suggestions WHERE id = ?', [suggestionId]);
    if (!suggestion) return res.status(404).json({ error: 'الاقتراح غير موجود.' });

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
    res.status(500).json({ error: 'حدث خطأ أثناء التصويت.' });
  }
});

// --- ADMIN ROUTES ---

// Admin: Create Episode + optional quiz + optional XP code
app.post('/api/admin/episode', adminMiddleware, async (req, res) => {
  const { title_ar, title_en, description, thumbnail_url, youtube_url, quiz, xp_code } = req.body;
  if (!title_ar) return res.status(400).json({ error: 'عنوان الحلقة بالعربية مطلوب.' });

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

    res.status(201).json({ success: true, episode_id: episodeId, message: 'تم إنشاء الحلقة بنجاح.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء إنشاء الحلقة.' });
  }
});

// Admin: Get all XP codes
app.get('/api/admin/xp-codes', adminMiddleware, async (req, res) => {
  try {
    const codes = await db.all('SELECT * FROM xp_codes ORDER BY id DESC');
    res.json(codes);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ.' });
  }
});

// Admin: Get all users summary
app.get('/api/admin/users', adminMiddleware, async (req, res) => {
  try {
    const users = await db.all(
      'SELECT id, username, email, batch, total_xp, weekly_xp, streak_count, is_verified, role, created_at FROM users ORDER BY total_xp DESC'
    );
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ.' });
  }
});

// Admin: Toggle user role between 'user' and 'admin'
app.patch('/api/admin/users/:id/role', adminMiddleware, async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  if (!role || !['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'الصلاحية المحددة غير صالحة.' });
  }

  try {
    // Prevent admin from demoting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ error: 'لا يمكنك تغيير صلاحية حسابك بنفسك.' });
    }

    const targetUser = await db.get('SELECT username FROM users WHERE id = ?', [userId]);
    if (!targetUser) {
      return res.status(404).json({ error: 'المستخدم غير موجود.' });
    }

    await db.run('UPDATE users SET role = ? WHERE id = ?', [role, userId]);
    res.json({ success: true, message: `تم تحديث صلاحية ${targetUser.username} إلى ${role === 'admin' ? 'مشرف' : 'طالب'}.` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء تحديث صلاحية المستخدم.' });
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
    res.status(500).json({ error: 'حدث خطأ.' });
  }
});

// Admin: Update suggestion status
app.patch('/api/admin/suggestions/:id', adminMiddleware, async (req, res) => {
  const { status } = req.body;
  if (!['pending', 'approved', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'الحالة غير صالحة.' });
  }
  try {
    await db.run('UPDATE suggestions SET status = ? WHERE id = ?', [status, req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ.' });
  }
});

// Admin: Add mini game
app.post('/api/admin/games', adminMiddleware, async (req, res) => {
  const { name, subject, game_type, game_data } = req.body;
  if (!name || !subject || !game_type || !game_data) {
    return res.status(400).json({ error: 'جميع الحقول مطلوبة.' });
  }
  try {
    const result = await db.run(
      'INSERT INTO mini_games (name, subject, game_type, game_data, created_at) VALUES (?, ?, ?, ?, ?)',
      [name, subject, game_type, JSON.stringify(game_data), new Date().toISOString()]
    );
    res.status(201).json({ id: result.id, message: 'تم إنشاء اللعبة بنجاح.' });
  } catch (err) {
    res.status(500).json({ error: 'حدث خطأ.' });
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
      'عضلة تقع في الطرف العلوي من الجسم (منطقة العضد).',
      'لها رأسان أساسيان (رأس طويل ورأس قصير).',
      'الحركة الأساسية لها هي ثني الكوع (Flexion) واستلقاء الساعد (Supination).',
      'يغذيها العصب العضلي الجلدي (Musculocutaneous nerve).'
    ],
    answers: ['biceps brachii', 'biceps', 'البايسبس', 'العضلة ذات الرأسين العضدية', 'ذات الرأسين العضدية', 'العضلة ذات الرأسين']
  },
  {
    structure: 'Femur',
    type: 'bone',
    hints: [
      'عظمة تقع في الطرف السفلي من الجسم.',
      'تعتبر أطول وأقوى عظمة في جسم الإنسان بالكامل.',
      'تتمفصل من الأعلى مع عظم الحوض ومن الأسفل مع الرضفة والظنبوب.',
      'تحتوي نهايتها العلوية على المدور الكبير (Greater trochanter) وعنق عظمة الفخذ.'
    ],
    answers: ['femur', 'الفخذ', 'عظم الفخذ', 'عظمة الفخذ']
  },
  {
    structure: 'Radial Nerve',
    type: 'nerve',
    hints: [
      'عصب رئيسي وهام يغذي عضلات الطرف العلوي.',
      'يسير في الأخدود الحلزوني (Spiral groove) لعظمة العضد.',
      'يغذي العضلات الباسطة (Extensors) للساعد والمعصم والأصابع.',
      'إصابته الشائعة تؤدي إلى حالة تدلي أو سقوط الرسغ (Wrist drop).'
    ],
    answers: ['radial nerve', 'radial', 'العصب الكعبري', 'الكعبري', 'عصب كعبري']
  },
  {
    structure: 'Deltoid',
    type: 'muscle',
    hints: [
      'عضلة تقع في منطقة الكتف.',
      'تعطي الكتف شكله المستدير المميز وتنقسم إلى ثلاثة ألياف (أمامية، وسطى، خلفية).',
      'الألياف الوسطى هي المسؤولة عن تبعيد الذراع (Abduction) جانباً من 15 إلى 90 درجة.',
      'يغذيها العصب الإبطي (Axillary nerve).'
    ],
    answers: ['deltoid', 'الدالية', 'العضلة الدالية', 'الكتف', 'عضلة الكتف']
  },
  {
    structure: 'Sciatic Nerve',
    type: 'nerve',
    hints: [
      'عصب رئيسي وضخم جداً في الطرف السفلي.',
      'هو أطول وأعرض عصب منفرد في جسم الإنسان بالكامل.',
      'يخرج من الضفيرة العجزية ويمر خلف مفصل الفخذ وتحت العضلة الكمثرية (Piriformis).',
      'التهابه أو الضغط عليه يسبب ألماً يمتد على طول الساق ويسمى شعبياً (عرق النسا).'
    ],
    answers: ['sciatic nerve', 'sciatic', 'العصب الوركي', 'الوركي', 'عرق النسا', 'السيياتيك']
  },
  {
    structure: 'Gastrocnemius',
    type: 'muscle',
    hints: [
      'عضلة سطحية تقع في الطرف السفلي (منطقة الساق الخلفية).',
      'تسمى شعبياً عضلة السمانة أو التوأمية لأن لها رأسان (إنسي ووحشي).',
      'تقوم بعمل ثني أخمصي للقدم (Plantar flexion) وتساعد في ثني الركبة.',
      'تتحد مع العضلة النعلية (Soleus) لتشكل وتر أكيليس (Achilles tendon).'
    ],
    answers: ['gastrocnemius', 'gastroc', 'السمانة', 'العضلة التوأمية', 'العضلة بطنية الساق', 'بطنية الساق', 'توأمية الساق']
  },
  {
    structure: 'Clavicle',
    type: 'bone',
    hints: [
      'عظمة تقع في الجزء العلوي الأمامي من الصدر.',
      'تأخذ شكل حرف S وهي العظمة الوحيدة الأفقية الطويلة في الجسم.',
      'تربط الطرف العلوي بالهيكل العظمي المحوري وتتمفصل مع عظمة القص ولوح الكتف.',
      'تسمى شعبياً بعظمة الترقوة وتعتبر من أكثر العظام عرضة للكسر.'
    ],
    answers: ['clavicle', 'الترقوة', 'عظمة الترقوة', 'عظم الترقوة']
  },
  {
    structure: 'Median Nerve',
    type: 'nerve',
    hints: [
      'عصب هام يسير في منتصف الطرف العلوي.',
      'يمر عبر نفق الرسغ (Carpal tunnel) تحت رباط المعصم.',
      'يغذي معظم عضلات الساعد المثنية (Flexors) وعضلات ركبة الإبهام (Thenar muscles).',
      'انضغاطه في المعصم يسبب متلازمة نفق الرسغ (Carpal Tunnel Syndrome) وتنميل الأصابع الثلاثة الأولى.'
    ],
    answers: ['median nerve', 'median', 'العصب المتوسط', 'المتوسط', 'عصب متوسط']
  },
  {
    structure: 'Triceps Brachii',
    type: 'muscle',
    hints: [
      'عضلة تقع في الجزء الخلفي من العضد بالطرف العلوي.',
      'تتكون من ثلاثة رؤوس (رأس طويل، ورأس وحشي، ورأس إنسي).',
      'هي الباسط الأساسي (Extensor) لمفصل الكوع.',
      'يغذيها العصب الكعبري (Radial nerve).'
    ],
    answers: ['triceps brachii', 'triceps', 'الترايسبس', 'العضلة ذات الرؤوس الثلاثة العضدية', 'ذات الرؤوس الثلاثة', 'ذات الثلاثة رؤوس']
  },
  {
    structure: 'Patella',
    type: 'bone',
    hints: [
      'عظمة تقع في مقدمة مفصل الركبة.',
      'هي أكبر عظمة سمسمية (Sesamoid bone) في جسم الإنسان وتوجد داخل وتر العضلة رباعية الرؤوس.',
      'تحمي السطح الأمامي لمفصل الركبة وتزيد من كفاءة ورافعة العضلة رباعية الرؤوس.',
      'تسمى شعبياً بالرضفة أو صابونة الركبة.'
    ],
    answers: ['patella', 'الرضفة', 'الصابونة', 'صابونة الركبة', 'صابونة']
  },
  {
    structure: 'Trapezius',
    type: 'muscle',
    hints: [
      'عضلة مسطحة وعريضة تغطي الجزء الخلفي من الرقبة وأعلى الظهر.',
      'تأخذ شكل شبه منحرف وتنقسم لألياف علوية ووسطى وسفلية.',
      'تساعد في حركة لوح الكتف (رفع، خفض، وتدوير لوح الكتف) ومد الرقبة للخلف.',
      'يغذيها العصب الشوكي الإضافي (Accessory nerve) الحادي عشر.'
    ],
    answers: ['trapezius', 'trap', 'traps', 'شبه المنحرفة', 'العضلة شبه المنحرفة', 'الترابيس']
  },
  {
    structure: 'Ulnar Nerve',
    type: 'nerve',
    hints: [
      'عصب يغذي الطرف العلوي ويسير في الجانب الداخلي (إيجابياً) للذراع.',
      'يمر خلف اللقيمة الإنسية لعظمة العضد وهي المنطقة الحساسة التي نطلق عليها "عظمة الفكاهة" (Funny bone) عند الاصطدام.',
      'يغذي معظم عضلات اليد الصغيرة (Intrinsic muscles) ويتحكم في الحركات الدقيقة للأصابع.',
      'إصابته تؤدي إلى حالة اليد المخلبية (Claw hand) وفقدان الإحساس في الخنصر ونصف البنصر.'
    ],
    answers: ['ulnar nerve', 'ulnar', 'العصب الزندي', 'الزندى', 'الزند', 'عصب زندي']
  },
  {
    structure: 'Quadriceps Femoris',
    type: 'muscle',
    hints: [
      'مجموعة عضلية ضخمة تقع في الجزء الأمامي من الفخذ.',
      'تتكون من أربعة رؤوس (المستقيمة الفخذية، والمتسعة الوحشية، والمتسعة الإنسية، والمتسعة الوسطى).',
      'هي الباسط الأساسي (Extensor) لمفصل الركبة وثاني للفخذ.',
      'يغذيها العصب الفخذي (Femoral nerve).'
    ],
    answers: ['quadriceps', 'quads', 'quad', 'الرباعية', 'العضلة رباعية الرؤوس', 'العضلة رباعية الرؤوس الفخذية']
  },
  {
    structure: 'Scapula',
    type: 'bone',
    hints: [
      'عظمة مسطحة تقع في الجزء الخلفي العلوي من الجذع.',
      'تأخذ شكلاً مثلثاً وتسمى شعبياً بعظمة لوح الكتف.',
      'تتمفصل مع عظمة العضد لتشكل مفصل الكتف ومع عظمة الترقوة.',
      'تحتوي على نتوءات هامة مثل الأخرم (Acromion) والنتوء الغرابي (Coracoid process).'
    ],
    answers: ['scapula', 'لوح الكتف', 'عظمة لوح الكتف', 'عظم لوح الكتف', 'اللوح']
  },
  {
    structure: 'Gluteus Maximus',
    type: 'muscle',
    hints: [
      'عضلة كبيرة تقع في منطقة الأرداف.',
      'هي أكبر وأثقل عضلة في جسم الإنسان بالكامل.',
      'الوظيفة الأساسية لها هي بسط الفخذ (Extension) وتدويره للخارج عند مفصل الفخذ.',
      'يغذيها العصب الألوي السفلي (Inferior gluteal nerve).'
    ],
    answers: ['gluteus maximus', 'gluteus', 'glutes', 'الألوية الكبرى', 'العضلة الألوية الكبرى', 'الألوية عظمى']
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
    return res.status(400).json({ error: 'كود الغرفة مطلوب.' });
  }
  
  const codeNormalized = roomCode.trim().toUpperCase();
  const room = activeGames.get(codeNormalized);
  
  if (!room) {
    return res.status(404).json({ error: 'الغرفة غير موجودة. تأكد من الكود.' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'لا يمكن الانضمام، اللعبة بدأت بالفعل.' });
  }
  
  const isAlreadyIn = room.players.some(p => p.username === username);
  if (!isAlreadyIn) {
    room.players.push({ username, score: 0, joinedAt: Date.now() });
    room.answersLog.push({
      type: 'system',
      text: `انضم ${username} إلى الغرفة.`
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
    return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  }
  
  if (room.host !== username) {
    return res.status(403).json({ error: 'منشئ الغرفة فقط من يمكنه بدء اللعب.' });
  }
  
  if (room.status !== 'waiting') {
    return res.status(400).json({ error: 'اللعبة بدأت بالفعل.' });
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
    text: 'بدأت اللعبة! الجولة الأولى.'
  }];
  
  res.json(room);
});

// Get room status (with dynamic evaluations for time elapsed)
app.get('/api/games/status/:roomCode', authMiddleware, async (req, res) => {
  const roomCode = req.params.roomCode.toUpperCase();
  const room = activeGames.get(roomCode);
  
  if (!room) {
    return res.status(404).json({ error: 'الغرفة غير موجودة.' });
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
          text: `انتهى الوقت! لم يجب أحد في الوقت المحدد. الإجابة هي: ${room.currentQuestion.structure}`
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
    return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  }
  
  if (room.host !== username) {
    return res.status(403).json({ error: 'منشئ الغرفة فقط من يمكنه الانتقال للجولة التالية.' });
  }
  
  if (room.status !== 'playing' || !room.roundWinner) {
    return res.status(400).json({ error: 'لا يمكن الانتقال للجولة التالية الآن.' });
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
      text: `الجولة ${room.currentRound} بدأت!`
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
          text: `مبروك للفائز ${winnerName}! حصل على ${xpRewarded} XP 🎉`
        });
      } catch (err) {
        console.error('Failed to reward XP:', err);
      }
    } else {
      room.xpRewarded = 0;
      room.answersLog.push({
        type: 'system',
        text: 'انتهت اللعبة بدون فائز يحمل نقاط.'
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
    return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  }
  
  if (room.status !== 'playing' || room.roundWinner) {
    return res.status(400).json({ error: 'لا توجد جولة نشطة لاستقبال الإجابات حالياً.' });
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
      text: `🎉 إجابة صحيحة من ${username}! (+${scoreEarned} نقطة) - الهيكل هو: ${room.currentQuestion.structure}`
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
    return res.status(404).json({ error: 'الغرفة غير موجودة.' });
  }
  
  room.players = room.players.filter(p => p.username !== username);
  room.answersLog.push({
    type: 'system',
    text: `غادر ${username} الغرفة.`
  });
  
  if (room.players.length === 0) {
    activeGames.delete(room.code);
  } else if (room.host === username) {
    room.host = room.players[0].username;
  }
  
  res.json({ message: 'تمت المغادرة بنجاح.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء جلب المنشورات.' });
  }
});

// Post a new message to community feed
app.post('/api/community/posts', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content || content.trim() === '') {
    return res.status(400).json({ error: 'لا يمكن إضافة منشور فارغ.' });
  }

  try {
    await db.run(
      'INSERT INTO community_posts (user_id, content, likes_count, created_at) VALUES (?, ?, 0, ?)',
      [req.user.id, content.trim(), new Date().toISOString()]
    );

    const user = await db.get('SELECT total_xp, weekly_xp FROM users WHERE id = ?', [req.user.id]);
    const newTotalXp = user.total_xp + 10;
    const newWeeklyXp = user.weekly_xp + 10;
    await db.run('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?', [newTotalXp, newWeeklyXp, req.user.id]);

    res.status(201).json({ 
      message: 'تم النشر بنجاح! حصلت على +10 XP ⚡',
      xp_reward: 10,
      total_xp: newTotalXp,
      weekly_xp: newWeeklyXp,
      rank: getRank(newTotalXp)
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'حدث خطأ أثناء النشر.' });
  }
});

// Like/Unlike post
app.post('/api/community/posts/:id/like', authMiddleware, async (req, res) => {
  const postId = parseInt(req.params.id);
  const userId = req.user.id;

  try {
    const post = await db.get('SELECT id, likes_count FROM community_posts WHERE id = ?', [postId]);
    if (!post) {
      return res.status(404).json({ error: 'المنشور غير موجود.' });
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
    res.status(500).json({ error: 'حدث خطأ أثناء الإعجاب بالمنشور.' });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
