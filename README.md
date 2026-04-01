# TaskPlanet Social Desk

Desktop-first social post application inspired by the TaskPlanet social feed.

## Stack

- Frontend: React + Vite
- Backend: Node.js + Express
- Database: MongoDB Atlas
- Auth: JWT
- Styling: Custom CSS

## Features

- Email/password signup and login
- Public feed with all posts
- Text posts, image posts, or both
- Likes and comments saved directly inside each post document
- Like/comment usernames visible in the UI
- Desktop layout inspired by the TaskPlanet screenshots
- Right-side notifications panel for reactions and comments on your posts

## Collections

Only two MongoDB collections are used:

- `users`
- `posts`

## Local Run

Backend:

```bash
cd backend
npm install
npm run dev
```

Frontend:

```bash
cd frontend
npm install
npm run dev
```

## Environment

Backend values live in `backend/.env`.

Frontend can optionally use:

```bash
VITE_API_BASE_URL=http://localhost:5000/api
VITE_FILE_BASE_URL=http://localhost:5000
```

## Submission Notes

- Frontend and backend are in separate folders as requested.
- The frontend production build was verified successfully.
- The backend booted successfully and connected to MongoDB with the provided values.
