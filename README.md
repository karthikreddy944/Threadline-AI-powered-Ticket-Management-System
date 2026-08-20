# Threadline — AI-Powered Ticket Management System

Threadline is a full-stack support ticketing system I built where tickets can be auto-analyzed and auto-assigned using AI, and are tied directly to a GitHub repo so context (commits, code) is never far away.

Live demo: https://threadline-ai-powered-ticket-manage.vercel.app

## Why I built this

Most college ticketing-system projects stop at basic CRUD — create a ticket, assign a ticket, close a ticket. I wanted something closer to what an actual support/eng team would use: AI helping triage and analyze issues, a real assignment engine instead of "pick a name from a dropdown," and GitHub tied in so a ticket isn't floating disconnected from the code it's about.

## Features

- **Role-based access** — separate flows for Admin, Employee, and Client
- **Ticket lifecycle** — create, comment/activity log, escalate, resolve, with file attachments
- **AI-assisted analysis** — tickets can be analyzed against the linked GitHub repo (via Gemini/OpenAI) to help figure out what's actually going on before an engineer even opens it
- **GitHub integration** — connect a GitHub account per user, link repos to tickets, OAuth-based
- **Assignment engine** — Manual or Automatic mode; Automatic supports Round Robin, Priority-Wise, and FIFO strategies, and only considers active employees
- **Analytics** — ticket stats and employee performance stats for admins
- **JWT auth** with bcrypt-hashed passwords

## Tech stack

**Frontend:** React 19, Vite, React Router, Tailwind CSS, lucide-react
**Backend:** Node.js, Express, MongoDB (Mongoose), JWT, Multer
**AI:** Google Gemini (`@google/generative-ai`) + OpenAI SDK
**Deployment:** Vercel (frontend), Render (backend), MongoDB Atlas

## Project structure

```
Threadline-AI-powered-Ticket-Management-System/
├── backend/
│   └── src/
│       ├── controllers/
│       ├── routes/
│       ├── models/
│       ├── services/        # allocation engine, AI analysis, etc.
│       └── middleware/
└── frontend/
    └── ticket-system/       # Vite React app
```

## Running it locally

You'll need Node.js and a MongoDB instance (local or Atlas).

**Backend**

```bash
cd backend
npm install
npm run seed     # optional, seeds an admin + sample data
npm run dev
```

**Frontend**

```bash
cd frontend/ticket-system
npm install
npm run dev
```

The frontend expects the backend at `http://localhost:5000/api` by default — check `frontend/ticket-system/.env` (or the API config file) if you need to point it elsewhere.

### Environment variables

Backend `.env`:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
GEMINI_API_KEY=your_gemini_key
OPENAI_API_KEY=your_openai_key
GITHUB_CLIENT_ID=your_github_oauth_client_id
GITHUB_CLIENT_SECRET=your_github_oauth_client_secret
```

Frontend `.env`:

```
VITE_API_URL=http://localhost:5000/api
```

Never commit `.env` — it's already in `.gitignore`.

## Deployment

- Frontend is deployed on Vercel, root directory set to `frontend/ticket-system`
- Backend is deployed on Render as a standard Node web service
- Database is on MongoDB Atlas
- GitHub OAuth callback URL is registered against the production backend URL

## Status

This is an active college project — the assignment engine, AI analysis, and GitHub integration are functional, but I'm still iterating on edge cases (see `BACKEND_ASSIGNMENT_FIX.md` for a recent example of a bug fix around the auto-assignment logic).

## License

Not licensed for reuse yet — feel free to open an issue if you want to discuss.
