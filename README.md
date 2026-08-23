# TaskPlanet Mini Social Post Application 🚀

A high-performance, desktop-first social post web application inspired by the **TaskPlanet** social feed. Built with a robust **React + Vite** frontend, **Node.js + Express** backend, and **MongoDB Atlas** database.

---

## ✨ Features Breakdown

### 🔐 Authentication & Profile Identity
- **JWT Authentication**: Secure signup and login with hashed passwords (`bcryptjs`).
- **Profile Customization**: Update display name, bio (160 chars max), location, personal website, and choose avatar color themes with real-time UI synchronization.
- **Account Controls**: Session management, verification badges, and secure logout.

### 📝 Post Creation & Rich Media
- **Text & Image Posting**: Post text, images, or both. Neither is strictly mandatory if the other is present.
- **Client-Side Image Compression**: Automatic canvas-based downscaling & compression before upload to optimize network bandwidth and prevent server strain.
- **Drag-and-Drop Upload**: Drop image files directly onto the composer with visual drop-zone feedback.
- **Image Lightbox**: Click any post image to open a full-resolution, zoom-enabled modal overlay.
- **Author Permissions**: Post authors can edit their post text inline or delete their post with confirmation.

### 💬 Instant Engagement & Interactions
- **Instant Likes**: Heart reaction with optimistic UI updates for zero latency. Displays list of usernames who liked each post.
- **Threaded Comments**: Add comments with instant UI updates.
- **Comment Likes**: Community members can like individual comments.
- **Comment Deletion**: Authors of comments or the post owner can delete comments.
- **Bookmarking / Saved Posts**: Save posts to personal bookmarks and view them under the dedicated "Saved / Bookmarks" tab.
- **Native Web Share & Deep Linking**: Share posts via the native Web Share API or copy direct permalinks (`#post-:id`) to clipboard with instant toast notifications.

### ⚡ Performance & Usability
- **MongoDB Indexing**: Compound and single-field indexes on `Post` (`createdAt`, `author`, `likes.userId`, text search) and `User` models for high-throughput queries.
- **Server & Client Pagination**: Efficient pagination support with `page` and `limit` query parameters.
- **Search & Highlighting**: Search posts by content, author name, or handle with visual keyword highlighting (`<mark>`).
- **Skeleton Loaders**: Polished shimmer pulse loaders during data fetching.
- **Keyboard Shortcuts**:
  - `/` → Focus search bar
  - `C` or `N` → Focus post composer
  - `J` / `K` → Navigate through posts in the feed
  - `Esc` → Dismiss modals, drawers, lightboxes
  - `?` → Open Keyboard Shortcuts Cheat Sheet
- **Modern Toast Notifications**: Animated, floating auto-dismissing toast stack for actions, alerts, and errors.
- **Theme Switcher**: Day and Night mode themes.
- **AI Concierge**: In-app smart assistant support integration for creator tips, engagement insights, and troubleshooting.

---

## 🛠️ Tech Stack

| Layer | Technologies |
|---|---|
| **Frontend** | React 18, Vite 5, Lucide React icons, Custom Responsive CSS |
| **Backend** | Node.js, Express.js, Multer (file uploads), JSONWebToken, Bcrypt.js |
| **Database** | MongoDB Atlas with Mongoose ODM (Strict 2 collections: `users` & `posts`) |
| **Testing** | Node.js Assert Suite |

---

## 🗄️ Database Architecture (2 Collections)

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
  "text": "Hello world! Welcome to the new TaskPlanet social board.",
  "imageUrl": "/uploads/image-12345.jpg",
  "likes": [
    {
      "userId": "ObjectId(User)",
      "username": "Akshat Seth",
      "handle": "akshat"
    }
  ],
  "comments": [
    {
      "_id": "ObjectId",
      "userId": "ObjectId(User)",
      "username": "Akshat Seth",
      "handle": "akshat",
      "text": "Great update!",
      "likes": [],
      "createdAt": "ISODate"
    }
  ],
  "createdAt": "ISODate",
  "updatedAt": "ISODate"
}
```

---

## 📡 REST API Reference

### 🔑 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/signup` | Register new user account | ❌ No |
| `POST` | `/api/auth/login` | Authenticate user & receive JWT token | ❌ No |
| `GET` | `/api/auth/me` | Fetch currently authenticated user | ✅ Yes |
| `PUT` | `/api/auth/profile` | Update profile (name, bio, location, website, avatarColor) | ✅ Yes |

### 📬 Posts (`/api/posts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET` | `/api/posts` | Get posts (supports `page`, `limit`, `search`, `sort`) | ❌ No |
| `GET` | `/api/posts/saved` | Get authenticated user's bookmarked posts | ✅ Yes |
| `POST` | `/api/posts` | Create new post (Multipart: text, image) | ✅ Yes |
| `PUT` | `/api/posts/:postId` | Update post text (Author only) | ✅ Yes |
| `DELETE` | `/api/posts/:postId` | Delete post permanently (Author only) | ✅ Yes |
| `POST` | `/api/posts/:postId/like` | Toggle like on post | ✅ Yes |
| `POST` | `/api/posts/:postId/bookmark` | Toggle bookmark on post | ✅ Yes |
| `POST` | `/api/posts/:postId/comments` | Add comment to post | ✅ Yes |
| `DELETE` | `/api/posts/:postId/comments/:commentId` | Delete comment (Comment or Post author) | ✅ Yes |
| `POST` | `/api/posts/:postId/comments/:commentId/like` | Toggle like on comment | ✅ Yes |

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Database (Local or MongoDB Atlas URI)

### 1. Clone & Checkout Branch
```bash
git clone https://github.com/lxakshaseth/mini-social-post-app.git
cd mini-social-post-app
git checkout akshat
```

### 2. Backend Setup
```bash
cd backend
npm install
cp .env.example .env
# Fill in PORT, MONGO_URI, and JWT_SECRET in .env
npm run dev
```

### 3. Frontend Setup
```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

### 4. Running Backend Tests
```bash
cd backend
npm test
```

---

## 🌐 Deployment Guidelines

- **Frontend**: Deploy on [Vercel](https://vercel.com) or [Netlify](https://netlify.com) with root directory set to `frontend`.
- **Backend**: Deploy on [Render](https://render.com) or [Railway](https://railway.app) with root directory set to `backend`.
- **Database**: Connect to [MongoDB Atlas](https://www.mongodb.com/atlas) cluster.

---

## 👨‍💻 Author
- **GitHub**: [@lxakshaseth](https://github.com/lxakshaseth)


- Frontend and backend are in separate folders as requested.
- The frontend production build was verified successfully.
- The backend booted successfully and connected to MongoDB with the provided values.
