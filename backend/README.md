# ConnectX Backend

Production-ready Express.js + MongoDB + Socket.io API for the ConnectX
messaging platform. Ships with JWT authentication, Google OAuth, Cloudinary
uploads, structured logging, validation, rate limiting, and a strict
error-handling contract.

> This foundation intentionally ships **no business logic** — no chat, no
> friends, no AI. Those slot into `controllers/`, `services/`, and `socket/`
> in the next iteration.

## Quick start

```bash
cp .env.example .env
# Fill in MONGODB_URI, JWT secrets, Google OAuth, Cloudinary...

npm install
npm run dev            # starts on http://localhost:5000
```

## Folder structure

```
src/
├── config/          # env, db, cloudinary, cors
├── controllers/     # HTTP controllers (thin)
├── middlewares/     # auth, error, rate limit, not-found
├── models/          # Mongoose models (User only for now)
├── routes/          # Express routers
├── services/        # Business logic (auth, tokens)
├── socket/          # Socket.io init + auth handshake
├── utils/           # ApiError, ApiResponse, asyncHandler, logger
├── validators/      # express-validator chains
├── app.js           # Express app assembly (no listen)
└── server.js        # HTTP + Socket.io bootstrap
```

## Available endpoints (foundation)

| Method | Path                       | Notes                                     |
| ------ | -------------------------- | ----------------------------------------- |
| GET    | /api/health                | Liveness probe                            |
| POST   | /api/auth/signup           | Email + password signup                   |
| POST   | /api/auth/login            | Email + password login                    |
| POST   | /api/auth/logout           | Clears refresh cookie                     |
| POST   | /api/auth/refresh          | Rotate tokens                             |
| GET    | /api/auth/me               | Current user (JWT-guarded)                |
| POST   | /api/auth/forgot-password  | Stub — sends reset token payload          |
| POST   | /api/auth/reset-password   | Consume reset token                       |
| POST   | /api/auth/verify-email     | Consume verification token                |
| POST   | /api/auth/google           | Verify Google ID token from client SDK    |
| GET    | /api/auth/google/callback  | Redirect flow (server-side)               |

All responses follow:

```jsonc
{ "success": true, "message": "...", "data": { /* ... */ } }
// or
{ "success": false, "message": "...", "code": "AUTH_INVALID_CREDENTIALS", "fields": { "email": "..." } }
```

## Deployment

- Any Node 20+ host (Render, Fly.io, Railway, EC2). Serverless is not
  supported because Socket.io needs a long-running process.
- Set the same `JWT_*` secrets across replicas.
- Point the frontend at `VITE_API_URL=https://api.yourdomain.com/api` and
  `VITE_SOCKET_URL=https://api.yourdomain.com`.
