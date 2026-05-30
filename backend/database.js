const mongoose = require('mongoose');
const {
  User,
  Episode,
  XpCode,
  CodeRedemption,
  Quiz,
  QuizSubmission,
  Interaction,
  MiniGame,
  GamePlay,
  ChatMessage,
  MessageReaction,
  Suggestion,
  SuggestionUpvote,
  CommunityPost,
  CommunityPostLike
} = require('./models');

const mongoURI = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/physioleague';

console.log('Connecting to MongoDB...');

mongoose.connect(mongoURI)
  .then(() => {
    console.log('Connected to MongoDB successfully.');
  })
  .catch((err) => {
    console.error('Error connecting to MongoDB:', err.message);
  });

function toSQLRow(doc) {
  if (!doc) return null;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  if (obj._id !== undefined) {
    obj.id = obj._id;
  }
  delete obj.__v;
  return obj;
}

const db = {
  // Helper to get single row
  get: async (sql, params = []) => {
    sql = sql.trim().replace(/\s+/g, ' ');
    // console.log('[DB GET]', sql, params);

    try {
      // 1. SELECT * FROM users WHERE username = ? OR email = ?
      if (sql.includes('FROM users WHERE username = ? OR email = ?')) {
        const uVal = params[0]?.trim();
        const eVal = params[1]?.trim() || uVal;
        const user = await User.findOne({ $or: [{ username: uVal }, { email: eVal }] }).lean();
        return toSQLRow(user);
      }

      // 2. SELECT * FROM users WHERE email = ?
      if (sql.includes('FROM users WHERE email = ?')) {
        const user = await User.findOne({ email: params[0]?.trim() }).lean();
        return toSQLRow(user);
      }

      // 3. SELECT * FROM users WHERE username = ?
      if (sql.includes('FROM users WHERE username = ?')) {
        const user = await User.findOne({ username: params[0]?.trim() }).lean();
        return toSQLRow(user);
      }

      // 4. SELECT id FROM users WHERE username = ?
      if (sql.includes('SELECT id FROM users WHERE username = ?')) {
        const user = await User.findOne({ username: params[0]?.trim() }).select('_id').lean();
        return toSQLRow(user);
      }

      // 5. SELECT id, username, email, batch, total_xp, ... FROM users WHERE id = ?
      if (sql.includes('FROM users WHERE id = ?') && sql.includes('SELECT')) {
        // This handles queries fetching details of user
        const user = await User.findById(params[0]).lean();
        return toSQLRow(user);
      }

      // 6. SELECT total_xp, weekly_xp FROM users WHERE id = ? (and related surprise box/spin wheel claims)
      if (sql.includes('SELECT total_xp') && sql.includes('FROM users WHERE id = ?')) {
        const user = await User.findById(params[0]).lean();
        return toSQLRow(user);
      }

      // 7. SELECT * FROM episodes WHERE id = ?
      if (sql.includes('FROM episodes WHERE id = ?')) {
        const ep = await Episode.findById(params[0]).lean();
        return toSQLRow(ep);
      }

      // 8. SELECT id, question, options, xp_reward FROM quizzes WHERE episode_id = ?
      if (sql.includes('FROM quizzes WHERE episode_id = ?')) {
        const quiz = await Quiz.findOne({ episode_id: params[0] }).lean();
        if (quiz) {
          const row = toSQLRow(quiz);
          row.options = JSON.stringify(row.options);
          return row;
        }
        return null;
      }

      // 9. SELECT * FROM quizzes WHERE id = ? AND episode_id = ?
      if (sql.includes('FROM quizzes WHERE id = ? AND episode_id = ?')) {
        const quiz = await Quiz.findOne({ _id: params[0], episode_id: params[1] }).lean();
        return toSQLRow(quiz);
      }

      // 10. SELECT * FROM quiz_submissions WHERE user_id = ? AND quiz_id = ?
      if (sql.includes('FROM quiz_submissions WHERE user_id = ? AND quiz_id = ?')) {
        const sub = await QuizSubmission.findOne({ user_id: params[0], quiz_id: params[1] }).lean();
        return toSQLRow(sub);
      }

      // 11. SELECT * FROM xp_codes WHERE code = ?
      if (sql.includes('FROM xp_codes WHERE code = ?')) {
        const xc = await XpCode.findOne({ code: params[0] }).lean();
        return toSQLRow(xc);
      }

      // 12. SELECT * FROM xp_codes WHERE id = ?
      if (sql.includes('FROM xp_codes WHERE id = ?')) {
        const xc = await XpCode.findById(params[0]).lean();
        return toSQLRow(xc);
      }

      // 13. SELECT * FROM code_redemptions WHERE user_id = ? AND code_id = ?
      if (sql.includes('FROM code_redemptions WHERE user_id = ? AND code_id = ?')) {
        const cr = await CodeRedemption.findOne({ user_id: params[0], code_id: params[1] }).lean();
        return toSQLRow(cr);
      }

      // 14. SELECT m.message, u.username FROM chat_messages m JOIN users u ... WHERE m.id = ?
      if (sql.includes('JOIN users u ON m.user_id = u.id WHERE m.id = ?')) {
        const msg = await ChatMessage.findById(params[0]).populate('user_id').lean();
        if (msg) {
          return {
            message: msg.message,
            username: msg.user_id?.username || 'Unknown'
          };
        }
        return null;
      }

      // 15. SELECT * FROM chat_messages WHERE id = ?
      if (sql.includes('FROM chat_messages WHERE id = ?')) {
        const msg = await ChatMessage.findById(params[0]).lean();
        return toSQLRow(msg);
      }

      // 16. SELECT * FROM message_reactions WHERE message_id = ? AND user_id = ?
      if (sql.includes('FROM message_reactions WHERE message_id = ? AND user_id = ?')) {
        const rx = await MessageReaction.findOne({ message_id: params[0], user_id: params[1] }).lean();
        return toSQLRow(rx);
      }

      // 17. SELECT * FROM interactions WHERE id = ? AND (type = "comment" OR type = "reply" OR type = "comment_like")
      if (sql.includes('FROM interactions WHERE id = ?')) {
        const inter = await Interaction.findById(params[0]).lean();
        return toSQLRow(inter);
      }

      // 18. SELECT * FROM suggestions WHERE id = ?
      if (sql.includes('FROM suggestions WHERE id = ?')) {
        const sug = await Suggestion.findById(params[0]).lean();
        return toSQLRow(sug);
      }

      // 19. SELECT id FROM suggestion_upvotes WHERE user_id = ? AND suggestion_id = ?
      if (sql.includes('FROM suggestion_upvotes WHERE user_id = ? AND suggestion_id = ?')) {
        const up = await SuggestionUpvote.findOne({ user_id: params[0], suggestion_id: params[1] }).lean();
        return toSQLRow(up);
      }

      // 20. SELECT upvotes FROM suggestions WHERE id = ?
      if (sql.includes('SELECT upvotes FROM suggestions WHERE id = ?')) {
        const sug = await Suggestion.findById(params[0]).select('upvotes').lean();
        return toSQLRow(sug);
      }

      // 21. SELECT * FROM mini_games WHERE id = ?
      if (sql.includes('FROM mini_games WHERE id = ?')) {
        const game = await MiniGame.findById(params[0]).lean();
        return toSQLRow(game);
      }

      // 22. SELECT COUNT(*) as count FROM game_plays WHERE user_id = ? AND played_at LIKE ?
      if (sql.includes('COUNT(*) as count FROM game_plays')) {
        const prefix = params[1].replace('%', '');
        const count = await GamePlay.countDocuments({ user_id: params[0], played_at: { $regex: '^' + prefix } });
        return { count };
      }

      // 23. SELECT COUNT(*) as count FROM episodes
      if (sql.includes('COUNT(*) as count FROM episodes')) {
        const count = await Episode.countDocuments();
        return { count };
      }

      // 24. SELECT COUNT(*) as count FROM chat_messages
      if (sql.includes('COUNT(*) as count FROM chat_messages')) {
        const count = await ChatMessage.countDocuments();
        return { count };
      }

      // 25. SELECT COUNT(*) as count FROM suggestions
      if (sql.includes('COUNT(*) as count FROM suggestions')) {
        const count = await Suggestion.countDocuments();
        return { count };
      }

      // 26. SELECT COUNT(*) as count FROM community_posts
      if (sql.includes('COUNT(*) as count FROM community_posts')) {
        const count = await CommunityPost.countDocuments();
        return { count };
      }

      // 27. SELECT id FROM community_post_likes WHERE user_id = ? AND post_id = ?
      if (sql.includes('FROM community_post_likes WHERE user_id = ? AND post_id = ?')) {
        const like = await CommunityPostLike.findOne({ user_id: params[0], post_id: params[1] }).lean();
        return toSQLRow(like);
      }

      // 28. SELECT id, likes_count FROM community_posts WHERE id = ?
      if (sql.includes('FROM community_posts WHERE id = ?')) {
        const post = await CommunityPost.findById(params[0]).lean();
        return toSQLRow(post);
      }

      console.warn('Unhandled SQL get query:', sql);
      return null;
    } catch (err) {
      console.error('Error in db.get translation:', err);
      throw err;
    }
  },

  // Helper to run query and modify database
  run: async (sql, params = []) => {
    sql = sql.trim().replace(/\s+/g, ' ');
    // console.log('[DB RUN]', sql, params);

    try {
      // 1. UPDATE users SET total_xp = ?, weekly_xp = ?, streak_count = ?, last_login_date = ? WHERE id = ?
      if (sql.includes('UPDATE users SET total_xp = ?, weekly_xp = ?, streak_count = ?, last_login_date = ?')) {
        await User.updateOne(
          { _id: params[4] },
          { total_xp: params[0], weekly_xp: params[1], streak_count: params[2], last_login_date: params[3] }
        );
        return { changes: 1 };
      }

      // 2. UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?
      if (sql.includes('UPDATE users SET total_xp = ?, weekly_xp = ? WHERE id = ?')) {
        await User.updateOne({ _id: params[2] }, { total_xp: params[0], weekly_xp: params[1] });
        return { changes: 1 };
      }

      // 3. UPDATE users SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ? WHERE username = ?
      if (sql.includes('UPDATE users SET total_xp = total_xp + ?, weekly_xp = weekly_xp + ?')) {
        await User.updateOne({ username: params[2] }, { $inc: { total_xp: params[0], weekly_xp: params[1] } });
        return { changes: 1 };
      }

      // 4. UPDATE users SET is_verified = 1, verification_code = NULL WHERE id = ?
      if (sql.includes('UPDATE users SET is_verified = 1, verification_code = NULL')) {
        await User.updateOne({ _id: params[0] }, { is_verified: 1, verification_code: null });
        return { changes: 1 };
      }

      // 5. UPDATE users SET total_xp = ?, weekly_xp = ?, last_surprise_box_date = ? WHERE id = ?
      if (sql.includes('last_surprise_box_date = ?')) {
        await User.updateOne(
          { _id: params[3] },
          { total_xp: params[0], weekly_xp: params[1], last_surprise_box_date: params[2] }
        );
        return { changes: 1 };
      }

      // 6. UPDATE users SET total_xp = ?, weekly_xp = ?, last_spin_wheel_date = ? WHERE id = ?
      if (sql.includes('last_spin_wheel_date = ?')) {
        await User.updateOne(
          { _id: params[3] },
          { total_xp: params[0], weekly_xp: params[1], last_spin_wheel_date: params[2] }
        );
        return { changes: 1 };
      }

      // 7. UPDATE users SET is_muted = 1, mute_expires_at = ? WHERE id = ?
      if (sql.includes('is_muted = 1')) {
        await User.updateOne({ _id: params[1] }, { is_muted: 1, mute_expires_at: params[0] });
        return { changes: 1 };
      }

      // 8. UPDATE users SET is_muted = 0, mute_expires_at = NULL WHERE id = ?
      if (sql.includes('is_muted = 0')) {
        await User.updateOne({ _id: params[0] }, { is_muted: 0, mute_expires_at: null });
        return { changes: 1 };
      }

      // 8.5 DELETE FROM users WHERE id = ?
      if (sql.includes('DELETE FROM users WHERE id = ?')) {
        await User.deleteOne({ _id: params[0] });
        return { changes: 1 };
      }

      // 8.6 UPDATE users SET verification_code = ? WHERE id = ?
      if (sql.includes('UPDATE users SET verification_code = ? WHERE id = ?')) {
        await User.updateOne({ _id: params[1] }, { verification_code: params[0] });
        return { changes: 1 };
      }

      // 8.7 UPDATE users SET password_hash = ?, verification_code = ? WHERE id = ?
      if (sql.includes('UPDATE users SET password_hash = ?, verification_code = ? WHERE id = ?')) {
        await User.updateOne({ _id: params[2] }, { password_hash: params[0], verification_code: params[1] });
        return { changes: 1 };
      }

      // 9. UPDATE users SET is_banned = 1, ban_expires_at = ? WHERE id = ?
      if (sql.includes('is_banned = 1')) {
        await User.updateOne({ _id: params[1] }, { is_banned: 1, ban_expires_at: params[0] });
        return { changes: 1 };
      }

      // 10. UPDATE users SET is_banned = 0, ban_expires_at = NULL WHERE id = ?
      if (sql.includes('is_banned = 0')) {
        await User.updateOne({ _id: params[0] }, { is_banned: 0, ban_expires_at: null });
        return { changes: 1 };
      }

      // 11. UPDATE users SET role = ? WHERE id = ?
      if (sql.includes('UPDATE users SET role = ? WHERE id = ?')) {
        await User.updateOne({ _id: params[1] }, { role: params[0] });
        return { changes: 1 };
      }

      // 12. UPDATE users SET password_hash = ?, role = ? WHERE username = ?
      if (sql.includes('UPDATE users SET password_hash = ?, role = ? WHERE username = ?')) {
        await User.updateOne({ username: params[2] }, { password_hash: params[0], role: params[1] });
        return { changes: 1 };
      }

      // 13. UPDATE users SET role = 'admin' WHERE username = 'admin'
      if (sql.includes("UPDATE users SET role = 'admin'")) {
        await User.updateOne({ username: 'admin' }, { role: 'admin' });
        return { changes: 1 };
      }

      // 14. INSERT INTO users (username, email, password_hash, batch, verification_code, is_verified, created_at)
      if (sql.includes('INSERT INTO users')) {
        if (sql.includes('verification_code')) {
          const user = new User({
            username: params[0],
            email: params[1],
            password_hash: params[2],
            batch: params[3],
            verification_code: params[4],
            is_verified: params[5],
            created_at: params[6]
          });
          await user.save();
          return { id: user._id };
        } else {
          // Admin seeder insert
          const user = new User({
            username: params[0],
            email: params[1],
            password_hash: params[2],
            batch: params[3],
            total_xp: params[4] || 0,
            is_verified: params[5] || 1,
            role: params[6] || 'user',
            created_at: params[7] || new Date().toISOString()
          });
          await user.save();
          return { id: user._id };
        }
      }

      // 15. INSERT INTO episodes (title_ar, title_en, description, thumbnail_url, youtube_url, created_at)
      if (sql.includes('INSERT INTO episodes')) {
        const ep = new Episode({
          title_ar: params[0],
          title_en: params[1],
          description: params[2],
          thumbnail_url: params[3],
          youtube_url: params[4],
          created_at: params[5]
        });
        await ep.save();
        return { id: ep._id };
      }

      // 16. INSERT INTO quizzes (episode_id, question, options, correct_option_index, xp_reward)
      if (sql.includes('INSERT INTO quizzes')) {
        const opts = JSON.parse(params[2]);
        const quiz = new Quiz({
          episode_id: params[0],
          question: params[1],
          options: opts,
          correct_option_index: params[3],
          xp_reward: params[4]
        });
        await quiz.save();
        return { id: quiz._id };
      }

      // 17. INSERT INTO xp_codes (code, xp_reward, type, episode_id, max_uses, current_uses, expiry_date, created_at)
      if (sql.includes('INSERT INTO xp_codes')) {
        let code, xp_reward, type, episode_id, max_uses, current_uses, expiry_date, created_at;
        if (params.length === 8) {
          [code, xp_reward, type, episode_id, max_uses, current_uses, expiry_date, created_at] = params;
        } else {
          [code, xp_reward, type, max_uses, current_uses, expiry_date, created_at] = params;
          episode_id = null;
        }
        const xc = new XpCode({
          code,
          xp_reward,
          type,
          episode_id,
          max_uses,
          current_uses,
          expiry_date,
          created_at
        });
        await xc.save();
        return { id: xc._id };
      }

      // 18. INSERT INTO code_redemptions (user_id, code_id, redeemed_at)
      if (sql.includes('INSERT INTO code_redemptions')) {
        const cr = new CodeRedemption({
          user_id: params[0],
          code_id: params[1],
          redeemed_at: params[2]
        });
        await cr.save();
        return { id: cr._id };
      }

      // 19. UPDATE xp_codes SET current_uses = current_uses + 1 WHERE id = ?
      if (sql.includes('UPDATE xp_codes SET current_uses = current_uses + 1')) {
        await XpCode.updateOne({ _id: params[0] }, { $inc: { current_uses: 1 } });
        return { changes: 1 };
      }

      // 20. DELETE FROM xp_codes WHERE id = ?
      if (sql.includes('DELETE FROM xp_codes WHERE id = ?')) {
        await XpCode.deleteOne({ _id: params[0] });
        return { changes: 1 };
      }

      // 21. DELETE FROM code_redemptions WHERE code_id = ?
      if (sql.includes('DELETE FROM code_redemptions WHERE code_id = ?')) {
        await CodeRedemption.deleteMany({ code_id: params[0] });
        return { changes: 1 };
      }

      // 22. INSERT INTO quiz_submissions (user_id, quiz_id, answer_index, is_correct, submitted_at)
      if (sql.includes('INSERT INTO quiz_submissions')) {
        const qs = new QuizSubmission({
          user_id: params[0],
          quiz_id: params[1],
          answer_index: params[2],
          is_correct: params[3],
          submitted_at: params[4]
        });
        await qs.save();
        return { id: qs._id };
      }

      // 23. INSERT INTO mini_games (name, subject, game_type, game_data, created_at)
      if (sql.includes('INSERT INTO mini_games')) {
        const game = new MiniGame({
          name: params[0],
          subject: params[1],
          game_type: params[2],
          game_data: JSON.parse(params[3]),
          created_at: params[4]
        });
        await game.save();
        return { id: game._id };
      }

      // 24. INSERT INTO game_plays (user_id, game_id, score, xp_earned, played_at)
      if (sql.includes('INSERT INTO game_plays')) {
        const gp = new GamePlay({
          user_id: params[0],
          game_id: params[1],
          score: params[2],
          xp_earned: params[3],
          played_at: params[4]
        });
        await gp.save();
        return { id: gp._id };
      }

      // 25. INSERT INTO chat_messages (user_id, message, reply_to_id, created_at)
      if (sql.includes('INSERT INTO chat_messages')) {
        const cm = new ChatMessage({
          user_id: params[0],
          message: params[1],
          reply_to_id: params[2] || null,
          created_at: params[3]
        });
        await cm.save();
        return { id: cm._id };
      }

      // 26. UPDATE chat_messages SET message = ?, is_edited = 1 WHERE id = ?
      if (sql.includes('UPDATE chat_messages SET message = ?, is_edited = 1')) {
        await ChatMessage.updateOne({ _id: params[1] }, { message: params[0], is_edited: 1 });
        return { changes: 1 };
      }

      // 27. DELETE FROM chat_messages WHERE id = ?
      if (sql.includes('DELETE FROM chat_messages WHERE id = ?')) {
        await ChatMessage.deleteOne({ _id: params[0] });
        // Also delete reactions associated with it
        await MessageReaction.deleteMany({ message_id: params[0] });
        return { changes: 1 };
      }

      // 28. DELETE FROM chat_messages WHERE id IN (...) AND user_id = ?
      if (sql.includes('DELETE FROM chat_messages WHERE id IN')) {
        const userId = params[params.length - 1];
        const messageIds = params.slice(0, -1);
        await ChatMessage.deleteMany({ _id: { $in: messageIds }, user_id: userId });
        await MessageReaction.deleteMany({ message_id: { $in: messageIds } });
        return { changes: messageIds.length };
      }

      // 29. INSERT INTO message_reactions (message_id, user_id, emoji)
      if (sql.includes('INSERT INTO message_reactions')) {
        const mr = new MessageReaction({
          message_id: params[0],
          user_id: params[1],
          emoji: params[2]
        });
        await mr.save();
        return { id: mr._id };
      }

      // 30. DELETE FROM message_reactions WHERE id = ?
      if (sql.includes('DELETE FROM message_reactions WHERE id = ?')) {
        await MessageReaction.deleteOne({ _id: params[0] });
        return { changes: 1 };
      }

      // 31. UPDATE message_reactions SET emoji = ? WHERE id = ?
      if (sql.includes('UPDATE message_reactions SET emoji = ? WHERE id = ?')) {
        await MessageReaction.updateOne({ _id: params[1] }, { emoji: params[0] });
        return { changes: 1 };
      }

      // 32. INSERT INTO interactions (user_id, episode_id, type, content, parent_id, created_at)
      if (sql.includes('INSERT INTO interactions')) {
        const inter = new Interaction({
          user_id: params[0],
          episode_id: params[1],
          type: params[2],
          content: params[3] || null,
          parent_id: params[4] || null,
          created_at: params[5]
        });
        await inter.save();
        return { id: inter._id };
      }

      // 33. DELETE FROM interactions WHERE id = ? OR parent_id = ? ...
      if (sql.includes('DELETE FROM interactions WHERE id = ? OR parent_id = ?')) {
        const commentId = params[0];
        // Delete comment and replies
        await Interaction.deleteMany({ $or: [{ _id: commentId }, { parent_id: commentId }] });
        return { changes: 1 };
      }
      if (sql.includes('DELETE FROM interactions WHERE id = ?')) {
        await Interaction.deleteOne({ _id: params[0] });
        return { changes: 1 };
      }

      // 34. INSERT INTO suggestions (user_id, title, content, created_at)
      if (sql.includes('INSERT INTO suggestions')) {
        const sug = new Suggestion({
          user_id: params[0],
          title: params[1],
          content: params[2],
          created_at: params[3]
        });
        await sug.save();
        return { id: sug._id };
      }

      // 35. DELETE FROM suggestions WHERE id = ?
      if (sql.includes('DELETE FROM suggestions WHERE id = ?')) {
        await Suggestion.deleteOne({ _id: params[0] });
        await SuggestionUpvote.deleteMany({ suggestion_id: params[0] });
        return { changes: 1 };
      }

      // 36. DELETE FROM suggestion_upvotes WHERE suggestion_id = ?
      if (sql.includes('DELETE FROM suggestion_upvotes WHERE suggestion_id = ?')) {
        await SuggestionUpvote.deleteMany({ suggestion_id: params[0] });
        return { changes: 1 };
      }

      // 37. UPDATE suggestions SET upvotes = upvotes + 1 WHERE id = ?
      if (sql.includes('UPDATE suggestions SET upvotes = upvotes + 1')) {
        await Suggestion.updateOne({ _id: params[0] }, { $inc: { upvotes: 1 } });
        return { changes: 1 };
      }

      // 38. UPDATE suggestions SET upvotes = upvotes - 1 WHERE id = ?
      if (sql.includes('UPDATE suggestions SET upvotes = upvotes - 1')) {
        await Suggestion.updateOne({ _id: params[0] }, { $inc: { upvotes: -1 } });
        return { changes: 1 };
      }

      // 39. INSERT INTO suggestion_upvotes (user_id, suggestion_id, voted_at)
      if (sql.includes('INSERT INTO suggestion_upvotes')) {
        const up = new SuggestionUpvote({
          user_id: params[0],
          suggestion_id: params[1],
          voted_at: params[2]
        });
        await up.save();
        return { id: up._id };
      }

      // 40. DELETE FROM suggestion_upvotes WHERE id = ?
      if (sql.includes('DELETE FROM suggestion_upvotes WHERE id = ?')) {
        await SuggestionUpvote.deleteOne({ _id: params[0] });
        return { changes: 1 };
      }

      // 41. UPDATE suggestions SET status = ? WHERE id = ?
      if (sql.includes('UPDATE suggestions SET status = ? WHERE id = ?')) {
        await Suggestion.updateOne({ _id: params[1] }, { status: params[0] });
        return { changes: 1 };
      }

      // 42. UPDATE users SET weekly_xp = 0
      if (sql.includes('UPDATE users SET weekly_xp = 0')) {
        await User.updateMany({}, { weekly_xp: 0 });
        return { changes: 1 };
      }

      // 43. INSERT INTO community_posts (user_id, content, likes_count, created_at)
      if (sql.includes('INSERT INTO community_posts')) {
        const cp = new CommunityPost({
          user_id: params[0],
          content: params[1],
          likes_count: params[2] || 0,
          created_at: params[3]
        });
        await cp.save();
        return { id: cp._id };
      }

      // 44. INSERT INTO community_post_likes (user_id, post_id)
      if (sql.includes('INSERT INTO community_post_likes')) {
        const cpl = new CommunityPostLike({
          user_id: params[0],
          post_id: params[1]
        });
        await cpl.save();
        return { id: cpl._id };
      }

      // 45. DELETE FROM community_post_likes WHERE user_id = ? AND post_id = ?
      if (sql.includes('DELETE FROM community_post_likes')) {
        await CommunityPostLike.deleteOne({ user_id: params[0], post_id: params[1] });
        return { changes: 1 };
      }

      // 46. UPDATE community_posts SET likes_count = ? WHERE id = ?
      if (sql.includes('UPDATE community_posts SET likes_count = ?')) {
        await CommunityPost.updateOne({ _id: params[1] }, { likes_count: params[0] });
        return { changes: 1 };
      }

      console.warn('Unhandled SQL run query:', sql);
      return { id: null, changes: 0 };
    } catch (err) {
      console.error('Error in db.run translation:', err);
      throw err;
    }
  },

  // Helper to get all rows
  all: async (sql, params = []) => {
    sql = sql.trim().replace(/\s+/g, ' ');
    // console.log('[DB ALL]', sql, params);

    try {
      // 1. SELECT * FROM episodes ORDER BY id DESC
      if (sql.includes('FROM episodes ORDER BY id DESC')) {
        const eps = await Episode.find().sort({ _id: -1 }).lean();
        return eps.map(toSQLRow);
      }

      // 2. SELECT i.*, u.username FROM interactions i JOIN users u ON i.user_id = u.id WHERE i.episode_id = ?
      if (sql.includes('JOIN users u ON i.user_id = u.id WHERE i.episode_id = ?')) {
        const inters = await Interaction.find({ episode_id: params[0] }).populate('user_id').lean();
        return inters.map(i => {
          const row = toSQLRow(i);
          return {
            ...row,
            user_id: i.user_id?._id || row.user_id,
            username: i.user_id?.username || 'Unknown',
            batch: i.user_id?.batch || '',
            total_xp: i.user_id?.total_xp || 0
          };
        });
      }

      // 3. Leaderboards
      if (sql.includes('weekly_xp as xp, total_xp, streak_count FROM users WHERE is_verified = 1 ORDER BY weekly_xp DESC')) {
        const users = await User.find({ is_verified: 1 }).sort({ weekly_xp: -1, username: 1 }).limit(100).lean();
        return users.map(u => ({
          ...toSQLRow(u),
          xp: u.weekly_xp
        }));
      }
      if (sql.includes('total_xp as xp, total_xp, streak_count FROM users WHERE is_verified = 1 AND batch = ?')) {
        const users = await User.find({ is_verified: 1, batch: params[0] }).sort({ total_xp: -1, username: 1 }).limit(100).lean();
        return users.map(u => ({
          ...toSQLRow(u),
          xp: u.total_xp
        }));
      }
      if (sql.includes('total_xp as xp, total_xp, streak_count FROM users WHERE is_verified = 1 ORDER BY total_xp DESC')) {
        const users = await User.find({ is_verified: 1 }).sort({ total_xp: -1, username: 1 }).limit(100).lean();
        return users.map(u => ({
          ...toSQLRow(u),
          xp: u.total_xp
        }));
      }

      // 4. Chat messages list
      if (sql.includes('FROM chat_messages m JOIN users u ON m.user_id = u.id')) {
        const messages = await ChatMessage.find()
          .sort({ _id: -1 })
          .limit(50)
          .populate('user_id')
          .lean();

        // Populate replies manually
        const populated = [];
        for (const m of messages) {
          let replyMessage = null;
          let replyUsername = null;
          if (m.reply_to_id) {
            const rm = await ChatMessage.findById(m.reply_to_id).populate('user_id').lean();
            if (rm) {
              replyMessage = rm.message;
              replyUsername = rm.user_id?.username || null;
            }
          }
          const row = toSQLRow(m);
          populated.push({
            ...row,
            user_id: m.user_id?._id || row.user_id,
            username: m.user_id?.username || 'Unknown',
            batch: m.user_id?.batch || '',
            total_xp: m.user_id?.total_xp || 0,
            reply_message: replyMessage,
            reply_username: replyUsername
          });
        }
        return populated;
      }

      // 5. Message reactions list
      if (sql.includes('FROM message_reactions r JOIN users u ON r.user_id = u.id WHERE r.message_id IN')) {
        const match = sql.match(/IN \(([^)]+)\)/);
        if (match) {
          const ids = match[1].split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
          const reactions = await MessageReaction.find({ message_id: { $in: ids } }).populate('user_id').lean();
          return reactions.map(r => {
            const row = toSQLRow(r);
            return {
              ...row,
              user_id: r.user_id?._id || row.user_id,
              username: r.user_id?.username || 'Unknown'
            };
          });
        }
        return [];
      }

      // 6. Suggestions
      if (sql.includes('FROM suggestions s JOIN users u ON s.user_id = u.id')) {
        let filter = {};
        if (sql.includes("s.status != 'rejected'")) {
          filter.status = { $ne: 'rejected' };
        }
        const sort = sql.includes('s.upvotes DESC') ? { upvotes: -1, created_at: -1 } : { created_at: -1 };
        const suggestions = await Suggestion.find(filter).sort(sort).populate('user_id').lean();
        return suggestions.map(s => {
          const row = toSQLRow(s);
          return {
            ...row,
            user_id: s.user_id?._id || row.user_id,
            username: s.user_id?.username || 'Unknown',
            batch: s.user_id?.batch || ''
          };
        });
      }

      // 7. Suggestion Upvotes list
      if (sql.includes('SELECT suggestion_id FROM suggestion_upvotes WHERE user_id = ?')) {
        const upvotes = await SuggestionUpvote.find({ user_id: params[0] }).select('suggestion_id').lean();
        return upvotes.map(toSQLRow);
      }

      // 8. Admin XP Codes list
      if (sql.includes('FROM xp_codes ORDER BY id DESC')) {
        const codes = await XpCode.find().sort({ _id: -1 }).lean();
        return codes.map(toSQLRow);
      }

      // 9. Admin Users list
      if (sql.includes('FROM users ORDER BY total_xp DESC')) {
        const users = await User.find().sort({ total_xp: -1 }).lean();
        return users.map(toSQLRow);
      }

      // 10. Mini Games list
      if (sql.includes('FROM mini_games')) {
        const games = await MiniGame.find().lean();
        return games.map(g => ({
          ...toSQLRow(g),
          game_data: JSON.stringify(g.game_data)
        }));
      }

      // 11. Community posts list
      if (sql.includes('FROM community_posts p JOIN users u ON p.user_id = u.id')) {
        const posts = await CommunityPost.find().sort({ _id: -1 }).limit(100).populate('user_id').lean();
        return posts.map(p => {
          const row = toSQLRow(p);
          return {
            ...row,
            user_id: p.user_id?._id || row.user_id,
            username: p.user_id?.username || 'Unknown',
            batch: p.user_id?.batch || '',
            total_xp: p.user_id?.total_xp || 0
          };
        });
      }

      console.warn('Unhandled SQL all query:', sql);
      return [];
    } catch (err) {
      console.error('Error in db.all translation:', err);
      throw err;
    }
  }
};

module.exports = {
  db,
  get: db.get,
  run: db.run,
  all: db.all
};
