# Ticket System — Backend

Node.js + Express + MongoDB backend for the AI-Powered Ticket Management System
college project. This phase covers the backend foundation, database models,
JWT authentication, role-based access, and ticket APIs. **No LLM/Gemini
integration yet** — the `aiAnalysis` field exists on the Ticket model but is
left `null` until that phase.

## 1. Prerequisites

- Node.js 18+ and npm
- MongoDB running locally, OR a free MongoDB Atlas cluster

## 2. Install

```bash
cd backend
npm install
```

## 3. Configure environment

```bash
cp .env.example .env
```

Edit `.env`:

```
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://127.0.0.1:27017/ticket-system
JWT_SECRET=some_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_ORIGIN=http://localhost:5173
```

### MongoDB setup options

**Option A — Local MongoDB**
1. Install MongoDB Community Server: https://www.mongodb.com/try/download/community
2. Start it: `mongod` (or via your OS service manager)
3. Keep `MONGO_URI=mongodb://127.0.0.1:27017/ticket-system`

**Option B — MongoDB Atlas (free tier)**
1. Create a cluster at https://www.mongodb.com/atlas
2. Add your IP to the access list, create a database user
3. Copy the connection string into `MONGO_URI`, e.g.
   `mongodb+srv://<user>:<password>@<cluster>.mongodb.net/ticket-system`

The server will refuse to start (and log a clear error) if it cannot connect
to MongoDB — see `src/config/db.js`.

## 4. Run

```bash
npm run dev     # nodemon, auto-restarts on file changes
# or
npm start       # plain node
```

The API will be available at `http://localhost:5000`.
CORS is configured to allow requests from `http://localhost:5173` (the Vite
frontend dev server).

## 5. Seed test users (optional but recommended)

```bash
npm run seed
```

Creates one admin and one client account (skips any that already exist):

| Role   | Email                      | Password    |
|--------|-----------------------------|-------------|
| Admin  | admin@ticketsystem.test    | Admin@123   |
| Client | client@ticketsystem.test   | Client@123  |

These are for local development/testing only — not hardcoded into any
production code path.

## 6. Project structure

```
backend/
├── src/
│   ├── app.js                 # Express app (middleware + routes)
│   ├── server.js              # Entry point — connects DB, starts server
│   ├── config/db.js           # Mongoose connection
│   ├── controllers/           # Route handlers
│   ├── middleware/            # auth, role, error handling
│   ├── models/                # User, Ticket, TicketActivity
│   ├── routes/                # Express routers
│   ├── services/ticketService.js
│   └── utils/                 # generateToken, seed script, response helpers
├── .env.example
├── .gitignore
└── package.json
```

## 7. API Reference

All responses follow:
```json
{ "success": true, "data": ... }
{ "success": false, "message": "..." }
```

Protected routes require header: `Authorization: Bearer <token>`

### Auth
| Method | Endpoint             | Access | Description |
|--------|-----------------------|--------|--------------|
| POST   | /api/auth/register     | Public | Register a client account |
| POST   | /api/auth/login         | Public | Login, returns user + JWT |

### Users
| Method | Endpoint      | Access       | Description |
|--------|----------------|--------------|--------------|
| GET    | /api/users/me   | Authenticated | Current user's profile |
| GET    | /api/users      | Admin only    | List users (for assignment) |

### Tickets
| Method | Endpoint                    | Access               | Description |
|--------|------------------------------|-----------------------|--------------|
| POST   | /api/tickets                  | Client (authenticated) | Create a ticket |
| GET    | /api/tickets/my               | Authenticated          | My tickets |
| GET    | /api/tickets/:id               | Owner or Admin          | Get one ticket |
| GET    | /api/tickets                   | Admin only              | All tickets — supports `?search=&status=&priority=&category=&page=&limit=` |
| PUT    | /api/tickets/:id                | Admin only              | Update status/priority/category/assignedTo |
| POST   | /api/tickets/:id/activity        | Owner or Admin          | Add a comment/activity entry |
| GET    | /api/tickets/:id/activity         | Owner or Admin          | Get activity/history timeline |
| GET    | /api/tickets/stats                 | Admin only              | Dashboard stats |

Health check: `GET /api/health`

## 8. Quick manual test (curl)

```bash
# Register a client
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Jane Doe","email":"jane@example.com","password":"secret123"}'

# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"jane@example.com","password":"secret123"}'

# Create a ticket (replace TOKEN)
curl -X POST http://localhost:5000/api/tickets \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"title":"VPN not connecting","description":"Cannot connect to VPN since this morning","category":"Network","priority":"High"}'

# My tickets
curl http://localhost:5000/api/tickets/my -H "Authorization: Bearer TOKEN"
```

Or import the endpoints above into Postman/Insomnia.

## 9. Known limitations (by design, for this phase)

- The Gemini AI engine supports both legacy code attachments and GitHub repository investigations.
- Ticket ID generation (`TKT-000123`) uses a document count and is not
  strictly collision-proof under concurrent writes; acceptable for a college
  demo, would use a dedicated counter collection in production.
- No refresh tokens — JWT simply expires after `JWT_EXPIRES_IN` and the user
  must log in again.
- No rate limiting / helmet hardening — kept minimal on purpose for clarity
  in a viva setting; easy to add later (`express-rate-limit`, `helmet`).
- New ticket creation requires a connected GitHub repository; screenshots/supporting files remain available as attachments.

## 10. What's next

1. Wire the React frontend's mock data calls to these endpoints (see
   suggested `src/lib/api.js` below).
2. Add Gemini/LLM integration for `aiAnalysis` (separate phase, per project
   instructions — not part of this backend build).
3. Optionally add pagination to `GET /api/tickets/my` and file attachments.

## GitHub repository integration

The current workflow requires a client to connect one GitHub repository before creating a new ticket. The backend uses the GitHub web OAuth flow and requests the `repo` scope so private repositories can be read. GitHub documents the web OAuth authorization-code flow and the `repo` scope for public/private repositories.

Set these values in your local `.env`:

```
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
GITHUB_CALLBACK_URL=http://localhost:5000/api/github/callback
GITHUB_TOKEN_ENCRYPTION_KEY=<64 hex characters>
```

Create the GitHub OAuth App callback URL exactly as above. Never commit `.env` or any real GitHub/Gemini/database secrets.

When the client connects GitHub, the app stores the access token encrypted on the server. The frontend only sees the GitHub username and the selected repository. New tickets snapshot the selected repository/branch so later repository changes do not alter historical tickets.

The admin can use **Analyze Repository** on a ticket. The backend reads the GitHub tree, filters generated/vendor/binary files, ranks relevant source files using the ticket title/description, and sends only the selected source text to Gemini. Repository code is read-only and is never executed.
