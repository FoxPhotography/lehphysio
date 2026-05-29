# PhysioLeague — Website Plan
### "ليه فيزيو؟" Podcast Community Platform
**KafrElsheikh University — Faculty of Physical Therapy**

---

## 🎯 Vision

Transform passive podcast listeners into an active, competitive community. Students earn XP (Experience Points) for engaging with every episode, post, and community activity — then compete on a live leaderboard. The streak mechanic and rank system create a reason to come back every single day.

---

## 🏗️ Core Concept

> **Watch → Earn → Compete → Repeat**

The platform is built around one core loop:
1. A new episode drops on official pages
2. The episode appears as a post on the website
3. Viewers watch to find the **secret XP code** hidden at a random timestamp
4. They enter the code on the website to earn XP
5. They answer the **episode quiz** for bonus XP
6. They interact (like, comment, share) with the episode post for more XP
7. Rankings update live on the **main page leaderboard**

---

## 👤 Registration & Accounts

### Required Fields
| Field | Purpose |
|-------|---------|
| **Username** | Primary login credential + displayed on leaderboard |
| **Email** | Used for confirmation code sent on signup |
| **Password** | Login credential |

### Optional Field
- **Generation / Batch** — Student selects their PT year:
  `PT 9 · PT 10 · PT 11 · PT 12 · PT 13 · PT 14`
  *(Used for batch-filtered leaderboard tab)*

### Email Confirmation Flow
1. User fills registration form
2. System sends a 6-digit code to their email
3. User enters code on a confirmation screen
4. Account is activated

---

## ⚡ XP System

### Ways to Earn XP

| Action | XP | Notes |
|--------|-----|-------|
| 🔑 Enter episode secret code | +100 | Limited uses + time window |
| 📮 Enter social media post code | +50 | Attached to official page posts |
| 🏆 Win / answer episode quiz | +150 | One attempt per episode |
| 🎮 Play a mini game | +50 | Focuses on PT subjects, limit 3/day |
| ❤️ Like an episode post | +5 | Once per post |
| 💬 Comment on an episode post | +15 | Once per post |
| 🔗 Share an episode post | +25 | Once per post |
| 📅 Daily login | +10 | Resets every 24 hours |
| 🔥 7-day streak | +70 | Bonus for consecutive logins |
| 👥 Refer a friend | +100 | When referred user activates account |

---

## 🔑 XP Code System

### Episode Codes
- Every episode has **one unique code** embedded at a **random timestamp**
- The viewer must watch to that moment to discover the code
- Each code has:
  - A **limited number of uses** (e.g., first 200 users)
  - A **time expiry window** (e.g., 72 hours after episode release)
  - **Single-use per account** — cannot be redeemed twice
- Admin panel sets these parameters when uploading an episode

### Social Media Post Codes
- Every official post (Instagram, Facebook, etc.) includes a code
- Same rules: limited uses, time window, one-per-account
- Encourages following the official pages

---

## 📺 Episode Posts

Each episode appears on the website as a **post card** including:

- Thumbnail image
- Episode number + title (Arabic)
- Caption / description
- Post date
- Interaction bar: **❤️ Like · 💬 Comment · 🔗 Share**
- Link to watch the full episode
- Quiz button (unlocked after code is submitted, or always visible)
- Comment section (visible to all, moderated)

> All three interactions (like, comment, share) award XP to the user performing the action.

---

## 🧠 Episode Quiz

- One quiz per episode — **multiple choice or short answer**
- The question is related to the episode content
- Users answer on the website
- First correct answer attempt awards full XP (+150)
- Wrong attempts do not award XP (no penalty)
- Results shown after submission

---

## 🎮 Interactive Mini Games

- Short, fast-paced educational games (similar to Sporcle Party) focused on physical therapy subjects (Anatomy, Physiology, Orthopedics, Neurology, etc.).
- **Goal**: Expand knowledge of physical therapy materials in a highly engaging, game-like format.
- **XP Reward**: +50 XP per game completion (limited to 3 times per day to prevent grinding).
- **Features**:
  - Interactive quizzes, drag-and-drop anatomy diagrams, clinical case matching, and speed trivia.
  - Weekly rotating games based on university courses.

---

## 🏆 Leaderboard

### Displayed on the Main / Home Page — always visible

### Three tabs:
| Tab | Description |
|-----|-------------|
| **أسبوعي** (Weekly) | XP earned in current 7-day window |
| **كل الوقت** (All-Time) | Total XP since account creation |
| **دفعتي** (My Batch) | Filtered by user's PT generation |

### Rank Display
- Top 3 highlighted with gold / silver / bronze treatment
- User's own rank highlighted even if outside top 10
- Avatar initials shown (no profile photos required initially)

---

## 🔥 Rank System (5 Ranks)

*نظام الرتب المتدرجة المستوحى بالكامل من علم وظائف الأعضاء والعلاج الطبيعي (PT-themed Ranks)*

| Tier | Rank Name (Arabic) | Rank Name (English) | Emojis | XP Threshold | Description / Notes |
|------|--------------------|---------------------|--------|--------------|---------------------|
| 1    | **طالب تشريح**     | Anatomy Rookie      | 🧪     | 0 XP         | رتبة البداية لكل طالب يبدأ رحلته في عالم العلاج الطبيعي ويسجل بالمنصة. |
| 2    | **أخصائي الألم**    | Pain Specialist     | ⚡     | 500 XP       | تُمنح للطلاب الذين يثبتون تفاعلهم ويبدأون في فهم مسببات الألم والتخفيف عنه. |
| 3    | **سيد الأورثو**     | Ortho King          | 🦴     | 1,500 XP     | للطلاب المتميزين في حالات العظام وإعادة التأهيل العضلي الحركي. |
| 4    | **النيوروچي**       | Neurogenic          | 🧠     | 3,000 XP     | رتبة متقدمة للطلاب النخبة الذين يفهمون أعماق الجهاز العصبي وميكانيكا التحكم. |
| 5    | **أسطورة الريهاب**  | Rehab Legend        | 👑     | 6,000 XP     | أعلى رتبة في المنصة، لأساطير لوحة الصدارة الذين أصبحوا مرجعاً في التأهيل والتشخيص. |

> Ranks unlock at the specified XP thresholds. Rank name displays next to username on the leaderboard and profile.

---

## 💬 Community Features

### Community Chat
- A general community chat room for all registered members
- Real-time or near-real-time messaging
- Moderated by admins
- Mobile-friendly interface

### Suggestions Channel
- A dedicated space for users to submit ideas or feedback
- Can be a simple form → stored submissions visible to admins
- Or a public channel where all members can see and upvote suggestions

---

## 📱 Design Direction

### Mobile-First (Priority)
- The majority of the audience is on mobile
- All layouts designed for ~390px width first, then scaled up
- Bottom navigation bar for mobile (Home · Episodes · Leaderboard · Profile)
- Touch-friendly tap targets, swipeable cards

### Visual Style (Based on Existing HTML)
- **Dark theme** — near-black background `#0f0a07`
- **Warm amber/orange accents** — `#e8a045`, `#c8621a`
- **Arabic-first** — RTL layout, Cairo font family
- **Animated** — smooth entrance animations, XP pop effects, streak counters
- **Professional + energetic** — not a generic app, feels like a real product

### Animation Priorities
- XP gain: floating "+100 XP" pop animation
- Leaderboard: rank changes animate with slide transitions
- Episode cards: smooth hover/tap states
- Streak counter: fire animation for active streaks
- Page transitions: fade/slide between sections

---

## 🗺️ Pages / Screens

| Page | Description |
|------|-------------|
| **Home** | Hero, stats bar, leaderboard, latest episode, XP ways |
| **Episodes** | Grid of all episode posts with interaction |
| **Single Episode** | Full post, quiz, comment section, code entry |
| **Leaderboard** | Full leaderboard with all tabs |
| **Community Chat** | Real-time chat room |
| **Suggestions** | Submit and browse suggestions |
| **Profile** | User XP, rank, streak, earned codes history |
| **Register** | Sign up form |
| **Login** | Username + password |
| **Email Confirm** | 6-digit code entry screen |
| **Admin Panel** | Upload episodes, create codes, manage quizzes |

---

## 🛠️ Tech Considerations

- **Frontend**: Mobile-first HTML/CSS/JS or React — RTL, Cairo font
- **Backend**: Needs user auth, XP tracking, code validation, leaderboard queries
- **Database**: Users, XP logs, codes, episodes, comments, quiz answers
- **Real-time**: Leaderboard + chat benefit from WebSocket or polling
- **Email**: Transactional email service for confirmation codes

---

## 📋 Phase Rollout Suggestion

### Phase 1 — Core
- Registration + login + email confirmation
- Episode posts (no quiz yet)
- XP codes (episode + social)
- Basic leaderboard (all-time only)

### Phase 2 — Engagement
- Episode quizzes
- Interactive Mini Games (Anatomy labeling, speed trivia, pathology matching) with XP
- Like / comment / share on posts with XP
- Weekly leaderboard tab
- Batch filter tab
- Streaks + daily login XP

### Phase 3 — Community
- Community chat
- Suggestions channel
- Rank system with names
- Profile page with history
- Animations + polish pass

---

*Document created for PhysioLeague — "ليه فيزيو؟" PT Community Platform*
*KafrElsheikh University · Faculty of Physical Therapy*
