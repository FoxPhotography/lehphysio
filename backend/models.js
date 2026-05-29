const mongoose = require('mongoose');
const { Schema } = mongoose;

// Counter schema for auto-incrementing IDs
const CounterSchema = new Schema({
  _id: { type: String, required: true },
  seq: { type: Number, default: 0 }
});
const Counter = mongoose.model('Counter', CounterSchema);

async function getNextSequenceValue(sequenceName) {
  const sequenceDocument = await Counter.findByIdAndUpdate(
    sequenceName,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return sequenceDocument.seq;
}

// Helper to attach auto-increment to schema
function autoIncrementId(schema, modelName) {
  schema.add({ _id: { type: Number } });
  schema.pre('save', async function (next) {
    if (this.isNew && this._id === undefined) {
      try {
        this._id = await getNextSequenceValue(modelName);
      } catch (err) {
        return next(err);
      }
    }
    next();
  });
}

// 1. User Schema
const UserSchema = new Schema({
  username: { type: String, unique: true, required: true, trim: true },
  email: { type: String, unique: true, required: true, trim: true },
  password_hash: { type: String, required: true },
  batch: { type: String, required: true },
  total_xp: { type: Number, default: 0 },
  weekly_xp: { type: Number, default: 0 },
  streak_count: { type: Number, default: 0 },
  last_login_date: { type: String },
  verification_code: { type: String },
  is_verified: { type: Number, default: 0 },
  role: { type: String, default: 'user' },
  last_surprise_box_date: { type: String },
  last_spin_wheel_date: { type: String },
  is_banned: { type: Number, default: 0 },
  ban_expires_at: { type: String, default: null },
  is_muted: { type: Number, default: 0 },
  mute_expires_at: { type: String, default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(UserSchema, 'User');

// 2. Episode Schema
const EpisodeSchema = new Schema({
  title_ar: { type: String, required: true },
  title_en: { type: String, required: true },
  description: { type: String },
  thumbnail_url: { type: String },
  youtube_url: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(EpisodeSchema, 'Episode');

// 3. XP Codes Schema
const XpCodeSchema = new Schema({
  code: { type: String, unique: true, required: true, trim: true },
  xp_reward: { type: Number, required: true },
  type: { type: String, required: true }, // 'episode' or 'social'
  episode_id: { type: Number, ref: 'Episode', default: null },
  max_uses: { type: Number, required: true },
  current_uses: { type: Number, default: 0 },
  expiry_date: { type: String },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(XpCodeSchema, 'XpCode');

// 4. Code Redemption Schema
const CodeRedemptionSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  code_id: { type: Number, ref: 'XpCode', required: true },
  redeemed_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(CodeRedemptionSchema, 'CodeRedemption');
CodeRedemptionSchema.index({ user_id: 1, code_id: 1 }, { unique: true });

// 5. Quiz Schema
const QuizSchema = new Schema({
  episode_id: { type: Number, ref: 'Episode', required: true },
  question: { type: String, required: true },
  options: [{ type: String }],
  correct_option_index: { type: Number, required: true },
  xp_reward: { type: Number, default: 150 }
});
autoIncrementId(QuizSchema, 'Quiz');

// 6. Quiz Submission Schema
const QuizSubmissionSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  quiz_id: { type: Number, ref: 'Quiz', required: true },
  answer_index: { type: Number, required: true },
  is_correct: { type: Number, required: true }, // 0 or 1
  submitted_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(QuizSubmissionSchema, 'QuizSubmission');
QuizSubmissionSchema.index({ user_id: 1, quiz_id: 1 }, { unique: true });

// 7. Interaction Schema (likes, comments, shares)
const InteractionSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  episode_id: { type: Number, ref: 'Episode', required: true },
  type: { type: String, required: true }, // 'like', 'comment', 'share', 'comment_like'
  content: { type: String, default: null },
  parent_id: { type: Number, ref: 'Interaction', default: null },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(InteractionSchema, 'Interaction');

// 8. Mini Games Schema
const MiniGameSchema = new Schema({
  name: { type: String, required: true },
  subject: { type: String, required: true },
  game_type: { type: String, required: true },
  game_data: { type: Schema.Types.Mixed, required: true },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(MiniGameSchema, 'MiniGame');

// 9. Game Play Schema
const GamePlaySchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  game_id: { type: Number, ref: 'MiniGame', required: true },
  score: { type: Number, required: true },
  xp_earned: { type: Number, required: true },
  played_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(GamePlaySchema, 'GamePlay');

// 10. Chat Message Schema
const ChatMessageSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  message: { type: String, required: true },
  reply_to_id: { type: Number, ref: 'ChatMessage', default: null },
  is_edited: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(ChatMessageSchema, 'ChatMessage');

// 10.5 Message Reactions Schema
const MessageReactionSchema = new Schema({
  message_id: { type: Number, ref: 'ChatMessage', required: true },
  user_id: { type: Number, ref: 'User', required: true },
  emoji: { type: String, required: true }
});
autoIncrementId(MessageReactionSchema, 'MessageReaction');
MessageReactionSchema.index({ message_id: 1, user_id: 1 }, { unique: true });

// 11. Suggestion Schema
const SuggestionSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  title: { type: String, required: true },
  content: { type: String, required: true },
  upvotes: { type: Number, default: 0 },
  status: { type: String, default: 'pending' }, // 'pending', 'approved', 'rejected'
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(SuggestionSchema, 'Suggestion');

// 11.5 Suggestion Upvotes Schema
const SuggestionUpvoteSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  suggestion_id: { type: Number, ref: 'Suggestion', required: true },
  voted_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(SuggestionUpvoteSchema, 'SuggestionUpvote');
SuggestionUpvoteSchema.index({ user_id: 1, suggestion_id: 1 }, { unique: true });

// 12. Community Post Schema
const CommunityPostSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  content: { type: String, required: true },
  likes_count: { type: Number, default: 0 },
  created_at: { type: String, default: () => new Date().toISOString() }
});
autoIncrementId(CommunityPostSchema, 'CommunityPost');

// 12.5 Community Post Likes Schema
const CommunityPostLikeSchema = new Schema({
  user_id: { type: Number, ref: 'User', required: true },
  post_id: { type: Number, ref: 'CommunityPost', required: true }
});
autoIncrementId(CommunityPostLikeSchema, 'CommunityPostLike');
CommunityPostLikeSchema.index({ user_id: 1, post_id: 1 }, { unique: true });

// Compile models
const User = mongoose.model('User', UserSchema);
const Episode = mongoose.model('Episode', EpisodeSchema);
const XpCode = mongoose.model('XpCode', XpCodeSchema);
const CodeRedemption = mongoose.model('CodeRedemption', CodeRedemptionSchema);
const Quiz = mongoose.model('Quiz', QuizSchema);
const QuizSubmission = mongoose.model('QuizSubmission', QuizSubmissionSchema);
const Interaction = mongoose.model('Interaction', InteractionSchema);
const MiniGame = mongoose.model('MiniGame', MiniGameSchema);
const GamePlay = mongoose.model('GamePlay', GamePlaySchema);
const ChatMessage = mongoose.model('ChatMessage', ChatMessageSchema);
const MessageReaction = mongoose.model('MessageReaction', MessageReactionSchema);
const Suggestion = mongoose.model('Suggestion', SuggestionSchema);
const SuggestionUpvote = mongoose.model('SuggestionUpvote', SuggestionUpvoteSchema);
const CommunityPost = mongoose.model('CommunityPost', CommunityPostSchema);
const CommunityPostLike = mongoose.model('CommunityPostLike', CommunityPostLikeSchema);

module.exports = {
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
};
