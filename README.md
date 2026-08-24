# TaskPlanet Mini Social Post Application 🚀

A high-performance, desktop-first social post web application inspired by the **TaskPlanet** social feed. Built with a robust **React + Vite** frontend, **Node.js + Express** backend, and **MongoDB Atlas** database adhering to all assignment requirements with 2 core collections (`users` and `posts`).

---

## 🌟 Comprehensive Feature Set

### 1. 🛡️ System Health & Diagnostics Suite
- **Live Diagnostics API (`GET /api/system/diagnostics`)**: Real-time inspection of server uptime, Node.js memory footprint (Heap used/total, RSS), platform runtime, uploads directory writeability, and database roundtrip ping latency.
- **Interactive UI Diagnostics Modal**: Press `D` or click the Activity pulse button in the top bar / profile menu to inspect system metrics live with interactive re-test capabilities.
- **CLI Integrity Check (`npm run system-check`)**: Automated verification of filesystem storage, schema paths, poll calculations, sanitization, and security rules.

### 2. 📊 Interactive Polls & Community Voting
- **Poll Creator in Composer**: Toggle "Add Poll" to attach interactive community questions with 2 to 4 customizable options.
- **Real-Time Voting & Visual Percentage Bars**: Dynamic progress bars showing live vote distribution, percentage shares, vote counts, and user's selected choice badge.
- **Vote Toggle & Switch**: Community members can vote, change vote, or remove their vote seamlessly with optimistic UI updates.

### 3. 📌 Post Pinning & Priority Feeds
- **Author Post Pinning (`POST /api/posts/:postId/pin`)**: Authors can pin their milestone post to the top of their profile and feed.
- **Visual Pinned Badge**: High-visibility pin indicator with prioritized sorting across feed views.

### 4. 👁️ Post Impression & View Counter
- **Atomic View Tracking (`POST /api/posts/:postId/view`)**: Automatically increments and tracks post view metrics (`viewsCount`) on mount.
- **View Metric Pill**: Displays impression count alongside likes, comments, and engagement score.

### 5. 🔊 Web Audio Micro-Interaction Sound Effects
- **Pure Synthesized Web Audio**: Zero external audio files/dependencies; uses the native browser `AudioContext` for instant 100% offline audio feedback.
- **Haptic Audio Chimes**: Pleasant pops on likes and bookmarks, chord chimes on post/poll submissions, soft swoosh on item deletions, and subtle clicks on theme toggles.

### 6. 🎨 Canvas-Based Post Quote Card Generator
- **Branded Graphic Export**: Uses offscreen HTML Canvas to render high-resolution social share cards with author avatar, username, formatted timestamp, word-wrapped post copy, and metric strip.
- **One-Click Download**: Generates and downloads `taskplanet-post-[id].png` for easy cross-platform sharing on Twitter, Instagram, or WhatsApp.

### 7. 🚩 Content Moderation & Post Reporting
- **In-App Post Reporting (`POST /api/posts/:postId/report`)**: Allows community members to flag posts for spam, inappropriate content, harassment, or misleading information.
- **Duplicate Report Prevention**: Deduplicates submissions per user with user feedback confirmations.

### 8. 🌐 Real-Time Offline Mode & Autosave Recovery
- **Connection Listener**: Detects offline state instantly with an alert banner (`navigator.onLine`).
- **Local Draft Autosave**: Automatically syncs composer drafts to `localStorage` with restoration and character count progress bar.

### 9. 🔒 Security Hardening & Rate Limiting
- **Security Headers Middleware**: Enforces `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-XSS-Protection`, and `Referrer-Policy`.
- **Sliding-Window Rate Limiter**: In-memory rate limiting protection on authentication endpoints to prevent brute-force attacks.
- **Input Sanitization**: XSS defense and HTML tag stripping on all request payloads.

### 10. ⚡ Feed Filtering & Multi-Criteria Sorting
- **Filters**: `All Posts`, `Polls`, `Media`, `Saved`, `For You`, `Most Liked`, `Most Discussed`.
- **Search with Keyword Highlighting**: Real-time search across post text, author name, and handles with visual `<mark>` highlights.

---

## 🛠️ Tech Stack & Architecture

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Lucide React Icons, Custom Responsive CSS (No Tailwind) |
| **Backend** | Node.js, Express 4.21, Multer (uploads), JWT, Bcrypt.js, Mongoose 8 |
| **Database** | MongoDB Atlas (Strict 2 collections: `users` & `posts`) |
| **Audio Engine** | Web Audio API (Synthesized oscillators) |
| **Share Engine** | HTML5 Canvas 2D Rendering Engine |
| **Testing** | Node.js Assert Suite + Custom System Integrity Runner |

---

## 🗄️ Database Architecture (Strict 2 Collections)

### 1. `users` Collection
```json
{
  "_id": "ObjectId",
  "name": "Akshat Seth",
  "email": "akshat@example.com",
  "handle": "akshat",
  "password": "$2a$12$...hashed...",
  "avatarColor": "#1b84ff",
  "bio": "Building full-stack web applications.",
  "location": "India",
  "website": "https://github.com/lxakshaseth",
  "savedPosts": ["ObjectId(Post)"],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

### 2. `posts` Collection
```json
{
  "_id": "ObjectId",
  "author": "ObjectId(User)",
  "authorName": "Akshat Seth",
  "authorHandle": "akshat",
  "authorAvatarColor": "#1b84ff",
  "text": "Excited to launch our new interactive polls feature! 🚀",
  "imageUrl": "/uploads/image-1724458900000.jpg",
  "isPinned": true,
  "viewsCount": 142,
  "poll": {
    "question": "Which tech stack do you prefer for full-stack apps?",
    "options": [
      { "optionText": "MERN Stack", "votes": ["ObjectId(User)"] },
      { "optionText": "Next.js + Postgres", "votes": [] }
    ]
  },
  "likes": [
    { "userId": "ObjectId(User)", "username": "Jane Doe", "handle": "janedoe" }
  ],
  "comments": [
    {
      "_id": "ObjectId",
      "userId": "ObjectId(User)",
      "username": "Jane Doe",
      "handle": "janedoe",
      "text": "Love the clean UI and instant reactions!",
      "createdAt": "ISODate",
      "likes": []
    }
  ],
  "reports": [],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## 📡 API Reference

| Endpoint | Method | Auth | Description |
|---|---|---|---|
| `/api/health` | GET | Public | Quick health check & DB status |
| `/api/system/diagnostics` | GET | Public | Full system check (uptime, memory, latency, storage) |
| `/api/auth/signup` | POST | Public (Rate Limited) | Register a new user |
| `/api/auth/login` | POST | Public (Rate Limited) | Login and receive JWT token |
| `/api/auth/me` | GET | Bearer Token | Fetch current authenticated user |
| `/api/auth/profile` | PUT | Bearer Token | Update user profile, bio, website, avatar |
| `/api/posts` | GET | Public | Fetch feed posts (supports pagination, search, sort, filter) |
| `/api/posts` | POST | Bearer Token | Create new post with text, image, and/or poll |
| `/api/posts/:id` | PUT | Bearer Token | Update post text (Author only) |
| `/api/posts/:id` | DELETE | Bearer Token | Delete post (Author only) |
| `/api/posts/:id/like` | POST | Bearer Token | Toggle like on a post |
| `/api/posts/:id/pin` | POST | Bearer Token | Toggle pin on a post (Author only) |
| `/api/posts/:id/vote` | POST | Bearer Token | Vote / toggle option in a post poll |
| `/api/posts/:id/view` | POST | Public | Atomically increment post view count |
| `/api/posts/:id/bookmark` | POST | Bearer Token | Toggle bookmarking a post |
| `/api/posts/:id/report` | POST | Bearer Token | Submit post moderation report |
| `/api/posts/:id/comments` | POST | Bearer Token | Add comment to a post |
| `/api/posts/:id/comments/:cId` | DELETE | Bearer Token | Delete comment |
| `/api/posts/:id/comments/:cId/like` | POST | Bearer Token | Toggle like on a comment |

---

## ⌨️ Keyboard Shortcuts

| Key | Action |
|---|---|
| `/` | Focus search bar immediately |
| `C` or `N` | Focus composer to create a new post |
| `D` | Open Live System Health & Diagnostics |
| `T` | Toggle Light / Night mode |
| `J` / `K` | Navigate between posts |
| `Esc` | Dismiss open dialogs, drawers, and lightboxes |
| `?` | Show Keyboard Shortcut modal |

---

## 🚀 Running Locally & Testing

### 1. Backend Setup
```bash
cd backend
npm install
npm run test:all       # Runs unit tests & full system integrity validation
npm run dev            # Starts server on http://localhost:5000
```

### 2. Frontend Setup
```bash
cd frontend
npm install
npm run build          # Builds production bundle (Vite)
npm run dev            # Starts dev server on http://localhost:5173
```

---

## 🧪 System Check Command Output
```
=================================================
    TASKPLANET FULL SYSTEM & INTEGRITY CHECK     
=================================================

  [OK] Uploads directory exists and is writable
  [OK] Post schema contains Polls structure with options and votes array
  [OK] Post schema contains isPinned boolean with default false
  [OK] Post schema contains viewsCount metric field with default 0
  [OK] Post schema contains reports subdocument array for content moderation
  [OK] User model defines authentication fields and savedPosts reference array
  [OK] Sanitization middleware cleans malicious HTML tags and scripts
  [OK] Poll vote calculation handles percentage distributions accurately

-------------------------------------------------
System Check Complete: 8 checks passed, 0 failed.
-------------------------------------------------
```
