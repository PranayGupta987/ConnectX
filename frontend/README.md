# ConnectX

> Where conversations become connections. A production-ready, real-time
> messaging platform with 1:1 chat, friends, WebRTC audio/video calls,
> screen sharing, an integrated AI assistant, and full notification stack.

![Status](https://img.shields.io/badge/status-production--ready-22c55e)
![License](https://img.shields.io/badge/license-MIT-blue)
![Stack](https://img.shields.io/badge/stack-React%20%2B%20Express%20%2B%20MongoDB-6366f1)

---

## ✨ Features

- 🔐 **Authentication** — Email/password, Google OAuth, email verification, password reset, JWT with refresh-token rotation
- 👥 **Friends system** — Search, requests, accept/reject, block, presence
- 💬 **Real-time 1:1 chat** — Text, images, replies, edits, deletes, typing, read receipts (Socket.io)
- 📞 **Calls** — WebRTC audio & video, screen sharing, ringing/incoming HUD, quality sampling, missed-call history
- 🤖 **AI assistant** — Streaming SSE chat, multi-provider (OpenAI / Gemini / Groq / Claude / Mistral), markdown + code highlighting
- 🔔 **Notifications** — Real-time bell, dedicated panel, unread counts, socket-pushed events
- 👤 **Profiles & settings** — Cloudinary avatar/cover uploads, theme, security, account deletion
- 🌗 **Dark / light theme** with premium aurora + glassmorphism design system
- ♿ **Accessible & responsive** — Keyboard nav, ARIA, mobile / tablet / desktop breakpoints

---

## 🏛 Architecture

```
┌──────────────────────────┐        HTTPS / WSS         ┌──────────────────────────┐
│  Frontend (React SPA)    │ ─────────────────────────▶ │  Backend (Express + WS)  │
│  TanStack Router         │  REST /api/v1              │  Socket.io signaling     │
│  TanStack Query          │  Socket.io events          │  JWT auth middleware     │
│  Zustand stores          │                            │  Mongoose models         │
│  WebRTC peers ◀──────────┼── STUN/TURN + signaling ──▶│  Cloudinary uploads      │
└──────────────────────────┘                            └────────────┬─────────────┘
                                                                     │
                                                              ┌──────▼──────┐
                                                              │  MongoDB    │
                                                              │  Atlas      │
                                                              └─────────────┘
```

---

## 🧰 Tech Stack

**Frontend**
- React 19, TanStack Start (Router + Query)
- Tailwind CSS v4, shadcn/ui, Radix primitives
- Zustand (auth, chat, friends, notifications, calls, AI, theme)
- Axios (with 401 refresh interceptor), Socket.io-client
- React Hook Form + Zod
- WebRTC (native `RTCPeerConnection`)

**Backend**
- Node.js 20, Express 4
- MongoDB + Mongoose
- Socket.io (rooms, presence, WebRTC signaling)
- JWT (access + refresh rotation), bcrypt, cookie sessions
- Google OAuth 2.0
- Cloudinary (media uploads)
- Helmet, CORS, compression, express-rate-limit, express-validator
- Winston / Morgan structured logging

---

## 📁 Folder Structure

```
connectx/                      # Frontend
├── public/                    # Static assets, robots, manifest
├── src/
│   ├── components/            # UI: auth, calls, chat, friends, ai, notifications, landing
│   ├── hooks/                 # use-webrtc, use-realtime-sync, ...
│   ├── layouts/               # dashboard-layout
│   ├── lib/                   # api-client, env, constants, utils
│   ├── routes/                # File-based routes (TanStack)
│   ├── services/              # auth / chat / friend / call / user / ai / notification / socket
│   ├── store/                 # Zustand stores
│   ├── styles.css             # Tailwind v4 + design tokens
│   └── types/                 # Shared TS types
├── vercel.json                # Vercel deployment
└── .env.example

connectx-backend/              # Backend (separate repo)
├── src/
│   ├── config/                # env, db, cloudinary, cors
│   ├── controllers/           # auth, user, chat, friend, call, ai, notification
│   ├── middlewares/           # auth, error, rateLimit, upload
│   ├── models/                # User, FriendRequest, Conversation, Message, Call, Notification, AIConversation
│   ├── routes/                # /auth /users /friends /chat /calls /notifications /ai
│   ├── services/              # token, auth, upload, chat, friend, call, ai, notification
│   ├── socket/                # Socket.io init + WebRTC signaling
│   ├── utils/                 # logger, ApiError, ApiResponse, asyncHandler
│   ├── validators/            # express-validator chains
│   ├── app.js
│   └── server.js
├── Dockerfile
├── render.yaml
└── .env.example
```

---

## 🚀 Installation

### Prerequisites
- Node.js 20+
- MongoDB (local or Atlas)
- Cloudinary account
- Google Cloud OAuth client
- (Optional) OpenAI / Gemini / Groq / Claude / Mistral API key

### Frontend

```bash
git clone <frontend-repo>
cd connectx
cp .env.example .env
bun install       # or npm install
bun run dev       # http://localhost:8080
```

### Backend

```bash
cd connectx-backend
cp .env.example .env
npm install
npm run dev       # http://localhost:5000
```

---

## 🔑 Environment Variables

### Frontend (`.env`)

| Key | Description |
|-----|-------------|
| `VITE_API_URL` | Base backend URL, e.g. `http://localhost:5000/api/v1` |
| `VITE_SOCKET_URL` | Socket.io endpoint, e.g. `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth public client ID |
| `VITE_APP_NAME` | Display name (default: `ConnectX`) |

### Backend (`.env`)

| Key | Description |
|-----|-------------|
| `NODE_ENV` | `development` / `production` |
| `PORT` | Default `5000` |
| `API_PREFIX` | Default `/api/v1` |
| `MONGODB_URI` | Mongo Atlas connection string |
| `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` | Long random strings |
| `JWT_ACCESS_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | e.g. `15m` / `30d` |
| `CORS_ORIGINS` | Comma-separated allowed origins |
| `COOKIE_DOMAIN` / `COOKIE_SECURE` | Cross-site refresh-cookie config |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `GOOGLE_CALLBACK_URL` | Google OAuth |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Media uploads |
| `AI_PROVIDER` / `AI_API_KEY` / `AI_MODEL` | AI assistant config |
| `FRONTEND_URL` | Used for OAuth redirects & email links |

---

## ☁️ Deployment

### Frontend → Vercel

1. Import the frontend repo in Vercel.
2. `vercel.json` is preconfigured (framework: Vite, build: `bun run build`, output: `dist`).
3. Add all `VITE_*` env vars in **Project → Settings → Environment Variables**.
4. Deploy.

### Backend → Render

1. Import the backend repo in Render.
2. Render will detect `render.yaml` and provision a Web Service.
3. Fill in all secrets (`MONGODB_URI`, `CORS_ORIGINS=https://your-app.vercel.app`, Cloudinary, Google, AI).
4. Deploy.

Alternatively, the included `Dockerfile` can be deployed to Fly.io, Railway,
DigitalOcean App Platform, ECS, or any container host.

### MongoDB Atlas

1. Create a free M0 cluster.
2. Add a database user + IP allow-list (`0.0.0.0/0` for Render/Vercel dynamic IPs).
3. Copy the `mongodb+srv://` URI into `MONGODB_URI`.

### Cloudinary

1. Sign up at [cloudinary.com](https://cloudinary.com).
2. Copy `Cloud name`, `API key`, `API secret` from the dashboard.

### Google OAuth

1. Open [Google Cloud Console](https://console.cloud.google.com/) → **APIs & Services → Credentials**.
2. Create an OAuth 2.0 Client ID (Web application).
3. Authorized redirect URI: `https://<your-api>/api/v1/auth/google/callback`.
4. Authorized JS origins: your frontend URL.

---

## 📡 REST API (v1)

All routes are prefixed with `/api/v1` and return the envelope
`{ success, message, data }`. Errors follow `{ success: false, message, code, errors? }`.

| Method | Path | Purpose |
|-------:|------|---------|
| POST | `/auth/signup` | Register |
| POST | `/auth/login` | Login |
| POST | `/auth/logout` | Logout (rotates refresh) |
| POST | `/auth/refresh` | Rotate refresh + access token |
| GET  | `/auth/me` | Current session |
| POST | `/auth/forgot-password` | Email reset link |
| POST | `/auth/reset-password` | Reset with token |
| POST | `/auth/verify-email` | Confirm email |
| GET  | `/auth/google` | Google OAuth redirect |
| GET  | `/auth/google/callback` | OAuth return handler |
| GET  | `/users/search?q=` | User search |
| PATCH| `/users/me` | Update profile |
| POST | `/users/me/avatar` | Upload avatar (Cloudinary) |
| POST | `/users/me/cover` | Upload cover |
| POST | `/users/me/password` | Change password |
| DELETE | `/users/me` | Delete account |
| GET  | `/friends` | Friends list |
| GET  | `/friends/requests` | Incoming/outgoing requests |
| POST | `/friends/request/:userId` | Send request |
| POST | `/friends/accept/:requestId` | Accept |
| POST | `/friends/reject/:requestId` | Reject |
| DELETE | `/friends/:userId` | Remove friend |
| GET  | `/chat/conversations` | List conversations |
| GET  | `/chat/conversations/:id/messages` | Paginated messages |
| POST | `/chat/messages` | Send message |
| PATCH| `/chat/messages/:id` | Edit |
| DELETE | `/chat/messages/:id` | Delete |
| POST | `/chat/messages/:id/seen` | Mark seen |
| GET  | `/calls/history` | Call history |
| POST | `/calls` | Record call |
| PATCH| `/calls/:id` | Update call status |
| GET  | `/notifications` | List (paginated) |
| POST | `/notifications/:id/read` | Mark read |
| POST | `/notifications/read-all` | Mark all read |
| DELETE | `/notifications/:id` | Delete |
| POST | `/ai/chat` | Streaming SSE completion |
| GET  | `/ai/conversations` | AI history |

---

## 🗄 Database Collections (MongoDB)

- **users** — auth, profile, presence, tokens, blocked list
- **friendrequests** — from/to, status, timestamps
- **conversations** — participants, lastMessage, unreadCounts (map)
- **messages** — conversation, sender, type, replyTo, seenBy, edits
- **calls** — caller, callee, type (audio/video), status, duration
- **notifications** — user, actor, type, refs, read
- **aiconversations** — user, messages[{ role, content }]

Indexes are declared inline in each Mongoose schema for the hottest access
patterns (conversation lookup by participants, message pagination,
notification unread counts, presence heartbeats).

---

## 🔌 Socket.io Events

**Presence & connection**
- `user:online` / `user:offline`
- `presence:heartbeat`

**Chat**
- `message:new`, `message:edited`, `message:deleted`, `message:seen`
- `typing:start`, `typing:stop`

**Friends**
- `friend:request`, `friend:accepted`, `friend:removed`

**Notifications**
- `notification:new`, `notification:read`, `notification:clear`

**Calls / WebRTC**
- `call:invite`, `call:accept`, `call:reject`, `call:cancel`, `call:end`
- `call:offer`, `call:answer`, `call:ice` (SDP + ICE relay)

---

## ✅ Deployment Checklist

- [ ] MongoDB Atlas cluster provisioned, IP allow-list configured
- [ ] Cloudinary keys added to backend env
- [ ] Google OAuth client authorized redirect/origin URIs
- [ ] `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` are strong random values
- [ ] `CORS_ORIGINS` includes the deployed frontend URL
- [ ] `COOKIE_SECURE=true` and `COOKIE_DOMAIN` set for cross-site refresh
- [ ] Backend deployed to Render/Fly/Railway with `/api/v1/health` responsive
- [ ] Frontend `VITE_API_URL` / `VITE_SOCKET_URL` point at deployed backend
- [ ] Vercel domain added
- [ ] Test signup → login → chat → call end-to-end in production
- [ ] Enable log drains / uptime monitoring

---

## 📸 Screenshots

_Add screenshots of the landing page, dashboard, chat, calls, and AI here._

---

## 🔮 Future Improvements

- Group chats & channels
- End-to-end encryption (Signal protocol)
- TURN server for restrictive NATs
- Message search + full-text indexing
- Push notifications (Web Push + FCM)
- Read-receipt privacy controls
- File attachments beyond images (video, docs)
- Mobile apps via React Native / Capacitor
- Admin dashboard + moderation tools

---

## 📄 License

MIT © ConnectX
