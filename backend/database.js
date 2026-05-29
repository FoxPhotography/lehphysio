const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'physioleague.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err.message);
  } else {
    console.log('Connected to SQLite database at', dbPath);
  }
});

initializeTables();


function initializeTables() {
  db.serialize(() => {
    // 1. Users Table
    db.run(`CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      batch TEXT NOT NULL,
      total_xp INTEGER DEFAULT 0,
      weekly_xp INTEGER DEFAULT 0,
      streak_count INTEGER DEFAULT 0,
      last_login_date TEXT,
      verification_code TEXT,
      is_verified INTEGER DEFAULT 0,
      role TEXT DEFAULT 'user',
      created_at TEXT NOT NULL
    )`);

    // 2. Episodes Table
    db.run(`CREATE TABLE IF NOT EXISTS episodes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title_ar TEXT NOT NULL,
      title_en TEXT NOT NULL,
      description TEXT,
      thumbnail_url TEXT,
      youtube_url TEXT,
      created_at TEXT NOT NULL
    )`);

    // 3. XP Codes Table
    db.run(`CREATE TABLE IF NOT EXISTS xp_codes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      xp_reward INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'episode' or 'social'
      episode_id INTEGER,
      max_uses INTEGER NOT NULL,
      current_uses INTEGER DEFAULT 0,
      expiry_date TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (episode_id) REFERENCES episodes (id) ON DELETE SET NULL
    )`);

    // 4. Code Redemptions Table
    db.run(`CREATE TABLE IF NOT EXISTS code_redemptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      code_id INTEGER NOT NULL,
      redeemed_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (code_id) REFERENCES xp_codes (id) ON DELETE CASCADE,
      UNIQUE(user_id, code_id)
    )`);

    // 5. Quizzes Table
    db.run(`CREATE TABLE IF NOT EXISTS quizzes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      episode_id INTEGER NOT NULL,
      question TEXT NOT NULL,
      options TEXT NOT NULL, -- JSON string array
      correct_option_index INTEGER NOT NULL,
      xp_reward INTEGER DEFAULT 150,
      FOREIGN KEY (episode_id) REFERENCES episodes (id) ON DELETE CASCADE
    )`);

    // 6. Quiz Submissions Table
    db.run(`CREATE TABLE IF NOT EXISTS quiz_submissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      quiz_id INTEGER NOT NULL,
      answer_index INTEGER NOT NULL,
      is_correct INTEGER NOT NULL, -- 0 or 1
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (quiz_id) REFERENCES quizzes (id) ON DELETE CASCADE,
      UNIQUE(user_id, quiz_id)
    )`);

    // 7. Interactions Table (likes, comments, shares)
    db.run(`CREATE TABLE IF NOT EXISTS interactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      episode_id INTEGER NOT NULL,
      type TEXT NOT NULL, -- 'like', 'comment', 'share'
      content TEXT, -- Nullable, used for comment content
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (episode_id) REFERENCES episodes (id) ON DELETE CASCADE
    )`);

    // 8. Mini Games Table
    db.run(`CREATE TABLE IF NOT EXISTS mini_games (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      subject TEXT NOT NULL, -- Anatomy, Physiology, etc.
      game_type TEXT NOT NULL, -- labeling, trivia, matching
      game_data TEXT NOT NULL, -- JSON string
      created_at TEXT NOT NULL
    )`);

    // 9. Game Plays Table
    db.run(`CREATE TABLE IF NOT EXISTS game_plays (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      game_id INTEGER NOT NULL,
      score INTEGER NOT NULL,
      xp_earned INTEGER NOT NULL,
      played_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (game_id) REFERENCES mini_games (id) ON DELETE CASCADE
    )`);

    // 10. Chat Messages Table
    db.run(`CREATE TABLE IF NOT EXISTS chat_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      message TEXT NOT NULL,
      reply_to_id INTEGER,
      is_edited INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (reply_to_id) REFERENCES chat_messages (id) ON DELETE SET NULL
    )`);

    // Migration: add reply_to_id column to existing databases
    db.run(`ALTER TABLE chat_messages ADD COLUMN reply_to_id INTEGER`, (err) => {
      // Ignore error if column already exists
    });

    // Migration: add is_edited column to existing databases
    db.run(`ALTER TABLE chat_messages ADD COLUMN is_edited INTEGER DEFAULT 0`, (err) => {
      // Ignore error if column already exists
    });

    // Migration: add parent_id column to interactions table
    db.run(`ALTER TABLE interactions ADD COLUMN parent_id INTEGER`, (err) => {
      // Ignore error if column already exists
    });

    // Migration: add role column to users table
    db.run(`ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'user'`, (err) => {
      // Ignore error if column already exists
    });

    // Migration: add daily surprise box & spin wheel last date columns to users table
    db.run(`ALTER TABLE users ADD COLUMN last_surprise_box_date TEXT`, (err) => {
      // Ignore error if column already exists
    });
    db.run(`ALTER TABLE users ADD COLUMN last_spin_wheel_date TEXT`, (err) => {
      // Ignore error if column already exists
    });

    // Migration: add ban/mute columns to users table
    db.run(`ALTER TABLE users ADD COLUMN is_banned INTEGER DEFAULT 0`, (err) => {
      // Ignore error if column already exists
    });
    db.run(`ALTER TABLE users ADD COLUMN ban_expires_at TEXT`, (err) => {
      // Ignore error if column already exists
    });
    db.run(`ALTER TABLE users ADD COLUMN is_muted INTEGER DEFAULT 0`, (err) => {
      // Ignore error if column already exists
    });
    db.run(`ALTER TABLE users ADD COLUMN mute_expires_at TEXT`, (err) => {
      // Ignore error if column already exists
    });

    // Seed/Update: ensure username 'admin' has 'admin' role
    db.run(`UPDATE users SET role = 'admin' WHERE username = 'admin'`);

    // 10.5 Message Reactions Table
    db.run(`CREATE TABLE IF NOT EXISTS message_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      message_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      emoji TEXT NOT NULL,
      FOREIGN KEY (message_id) REFERENCES chat_messages (id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      UNIQUE(message_id, user_id)
    )`);

    // 11. Suggestions Table
    db.run(`CREATE TABLE IF NOT EXISTS suggestions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      upvotes INTEGER DEFAULT 0,
      status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // 13. Community Posts Table
    db.run(`CREATE TABLE IF NOT EXISTS community_posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      likes_count INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    )`);

    // 14. Community Post Likes Table
    db.run(`CREATE TABLE IF NOT EXISTS community_post_likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES community_posts (id) ON DELETE CASCADE,
      UNIQUE(user_id, post_id)
    )`);

    // Seed initial community posts if empty
    db.all(`SELECT COUNT(*) as count FROM community_posts`, (err, rows) => {
      if (!err && rows && rows[0].count === 0) {
        console.log('Seeding initial community posts...');
        db.get('SELECT id FROM users WHERE username = ?', ['nour_rehab'], (err, user) => {
          if (!err && user) {
            db.run('INSERT INTO community_posts (user_id, content, likes_count, created_at) VALUES (?, ?, ?, ?)', [
              user.id,
              'Today\'s episode was 🔥! That explanation about spasticity really hit different. Great work team! 💪🧠',
              124,
              new Date(Date.now() - 7200000).toISOString()
            ]);
          }
        });
      }
    });

    console.log('All tables verified/created successfully.');
  });
}

// Helper to run query and return Promise
function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
}

// Helper to get single row
function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

// Helper to get all rows
function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

module.exports = {
  db,
  run,
  get,
  all
};
