# ReachInbox Email Scheduler 🚀

A production-oriented full-stack email scheduling platform built for the **ReachInbox Software Development Intern Assignment**.

The application allows users to authenticate with Google, create email campaigns, upload recipients through CSV, schedule emails, process them using BullMQ and Redis, enforce campaign-specific hourly limits, receive Slack notifications, and search emails using Elasticsearch.

---

## ✨ Features

- 🔐 Google OAuth 2.0 Authentication
- 📧 Email Campaign Creation & Scheduling
- 📂 CSV Recipient Upload
- ⚡ BullMQ + Redis Job Queue
- ⏱️ Configurable Minimum Email Delay
- 🚦 Campaign-Specific Hourly Rate Limiting
- 🔄 Automatic Job Rescheduling When Rate Limit Is Reached
- 💬 Slack OAuth & Rate-Limit Notifications
- 🔎 Elasticsearch Email Search
- 📊 Bull Board Queue Monitoring
- 💾 PostgreSQL + Prisma
- 🔁 Restart-Persistent Scheduled Jobs
- 🛡️ Idempotency Protection
- ⚙️ Configurable Worker Concurrency
- 📱 Responsive Next.js Dashboard

---

## 🏗️ Architecture

```text
                     ┌───────────────────┐
                     │     Next.js       │
                     │    Frontend       │
                     └─────────┬─────────┘
                               │
                               ▼
                     ┌───────────────────┐
                     │  Express + TS     │
                     │      API          │
                     └──────┬─────┬──────┘
                            │     │
               ┌────────────┘     └──────────────┐
               ▼                                  ▼
       ┌─────────────┐                    ┌─────────────┐
       │ PostgreSQL  │                    │    Redis    │
       │   Prisma    │                    │   BullMQ    │
       └─────────────┘                    └──────┬──────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │ BullMQ      │
                                         │ Worker      │
                                         └──────┬──────┘
                                                │
                                                ▼
                                         ┌─────────────┐
                                         │  Ethereal   │
                                         │    SMTP     │
                                         └─────────────┘

               ┌─────────────────┐      ┌─────────────────┐
               │  Elasticsearch  │      │    Slack API    │
               │     Search      │      │  Notifications  │
               └─────────────────┘      └─────────────────┘
```

---

## 🛠️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js, React, TypeScript, Tailwind CSS |
| Backend | Node.js, Express.js, TypeScript |
| Authentication | Google OAuth 2.0, Passport.js |
| Database | PostgreSQL, Prisma |
| Queue | BullMQ |
| Queue Storage | Redis |
| Email | Nodemailer, Ethereal SMTP |
| Search | Elasticsearch |
| Notifications | Slack Web API |
| Monitoring | Bull Board |
| Infrastructure | Docker |

---

## 📁 Project Structure

```text
reachinbox-assignment/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── queues/
│   │   ├── routes/
│   │   ├── services/
│   │   ├── types/
│   │   ├── utils/
│   │   ├── app.ts
│   │   └── server.ts
│   │
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
│
├── frontend/
│   ├── app/
│   ├── components/
│   ├── lib/
│   └── package.json
│
├── docker-compose.yml
├── .gitignore
└── README.md
```

---

# 🚀 Getting Started

## Prerequisites

- Node.js 18+
- npm
- Docker Desktop
- Google OAuth credentials
- Slack App credentials
- Ethereal Email account

---

## 1. Clone Repository

```bash
git clone https://github.com/rehan-rh/reachinbox-assignment.git
cd reachinbox-assignment
```

---

## 2. Start Infrastructure

Start PostgreSQL, Redis and Elasticsearch:

```bash
docker compose up -d
```

Verify the containers:

```bash
docker ps
```

The application uses:

- PostgreSQL 16
- Redis 7
- Elasticsearch 8.15.0

---

## 3. Configure Backend

Create:

```text
backend/.env
```

Add the required environment variables:

```env
PORT=5000

DATABASE_URL="postgresql://postgres:postgres@localhost:5432/reachinbox?schema=public"

REDIS_HOST=localhost
REDIS_PORT=6379

ELASTICSEARCH_URL=http://localhost:9200

WORKER_CONCURRENCY=5
MIN_EMAIL_DELAY_MS=2000

SESSION_SECRET=your-session-secret

FRONTEND_URL=http://localhost:3000

ETHEREAL_HOST=smtp.ethereal.email
ETHEREAL_PORT=587
ETHEREAL_USER=your-ethereal-user
ETHEREAL_PASSWORD=your-ethereal-password

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GOOGLE_CALLBACK_URL=http://localhost:5000/auth/google/callback

SLACK_CLIENT_ID=your-slack-client-id
SLACK_CLIENT_SECRET=your-slack-client-secret
SLACK_CALLBACK_URL=http://localhost:5000/auth/slack/callback
```

> Never commit real credentials or secrets to GitHub.

---

## 4. Backend Setup

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

Backend:

```text
http://localhost:5000
```

Health check:

```text
http://localhost:5000/health
```

---

## 5. Configure Frontend

Create:

```text
frontend/.env.local
```

Add:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000
```

Install dependencies and start the frontend:

```bash
cd frontend
npm install
npm run dev
```

Frontend:

```text
http://localhost:3000
```

---

# 🔑 OAuth Configuration

## Google OAuth

Create a Google OAuth Web Application and configure the following redirect URI:

```text
http://localhost:5000/auth/google/callback
```

Add the generated Client ID and Client Secret to the backend `.env` file.

---

## Slack OAuth

Create a Slack App and configure the OAuth redirect URL:

```text
http://localhost:5000/auth/slack/callback
```

Required bot scopes:

```text
chat:write
channels:read
```

After connecting Slack from the dashboard, the application stores the user's Slack connection and can send rate-limit notifications.

---

# 📧 Email Scheduling

Users can create campaigns with:

- Sender
- Recipients
- CSV upload
- Subject
- Body
- Start time
- Minimum delay
- Campaign hourly limit

Each recipient becomes an individual BullMQ job.

Example:

```text
Start Time: 10:00:00
Delay: 2 seconds

Recipient 1 → 10:00:00
Recipient 2 → 10:00:02
Recipient 3 → 10:00:04
```

---

# 🚦 Campaign Rate Limiting

Hourly limits are applied **per campaign**.

Example:

```text
Campaign Hourly Limit = 2

Email 1 → SENT
Email 2 → SENT
Email 3 → DELAYED
Email 4 → DELAYED
```

Redis uses an atomic Lua script to maintain the rate-limit counter safely across concurrent workers.

When the limit is reached, jobs are **rescheduled for the next available hour instead of being failed or dropped**.

---

# ⏱️ Send Delay

The system supports a configurable minimum delay between individual emails.

Example:

```env
MIN_EMAIL_DELAY_MS=2000
```

This maintains a minimum two-second interval between sends from the same sender.

---

# ⚡ BullMQ & Redis

BullMQ is used instead of cron jobs for scheduling.

```text
Campaign
   ↓
PostgreSQL Email Records
   ↓
BullMQ Delayed Jobs
   ↓
Redis
   ↓
Worker
   ↓
Email Delivery
```

Worker concurrency is configurable:

```env
WORKER_CONCURRENCY=5
```

This allows the system to process multiple jobs concurrently while maintaining rate and send-delay controls.

---

# 🔄 Restart Persistence

Scheduled jobs are stored in Redis through BullMQ.

Therefore:

```text
Scheduled Jobs
      ↓
Redis
      ↓
Backend Restart
      ↓
BullMQ Reconnects
      ↓
Pending Jobs Continue
```

No cron jobs are used.

---

# 🛡️ Idempotency

Each email has a unique ID and idempotency key.

BullMQ jobs use the email ID as their job ID.

Before sending, the worker checks the email status. Already-sent emails are skipped to reduce the possibility of duplicate sends during retries or restarts.

---

# 💬 Slack Notifications

When a campaign reaches its hourly limit:

```text
Rate Limit Reached
       ↓
Slack Web API
       ↓
Configured Slack Channel
```

If Slack is disconnected, the scheduler continues working normally and skips the notification.

---

# 🔎 Elasticsearch

Sent emails are indexed in Elasticsearch for search.

Search can be performed using:

```text
GET /api/emails/search?q=<query>
```

Indexed information includes:

- Recipient
- Subject
- Body
- Status
- Scheduled time
- Sent time

---

# 📊 Bull Board

Bull Board provides a visual interface for monitoring BullMQ.

Open:

```text
http://localhost:5000/admin/queues
```

It provides visibility into:

- Waiting jobs
- Delayed jobs
- Active jobs
- Completed jobs
- Failed jobs

---

# 🔌 API Endpoints

## Authentication

```text
GET  /auth/google
GET  /auth/google/callback
GET  /auth/me
POST /auth/logout
```

## Slack

```text
GET    /auth/slack
GET    /auth/slack/callback
GET    /auth/slack/status
DELETE /auth/slack
```

## Emails

```text
GET  /api/emails
GET  /api/emails/senders
GET  /api/emails/search?q=<query>
POST /api/emails/schedule
```

## Monitoring

```text
GET /admin/queues
```

---

# 🧪 Key Test Scenarios

## Normal Campaign

```text
3 Emails
Limit = 100/hour

→ 3 Emails Sent
```

## Rate Limit

```text
3 Emails
Limit = 2/hour

→ Email 1 SENT
→ Email 2 SENT
→ Email 3 DELAYED
→ Slack Notification
```

## Restart Persistence

```text
Schedule Emails
      ↓
Restart Backend
      ↓
BullMQ Resumes Pending Jobs
```

## Large Queue

```text
1000+ Scheduled Emails
        ↓
BullMQ + Redis
        ↓
Configurable Worker Concurrency
        ↓
Controlled Processing
```

---

# ⚖️ Design Decisions & Tradeoffs

## Why BullMQ?

BullMQ provides persistent delayed jobs, retries, concurrency and queue management without relying on cron jobs.

## Why Redis?

Redis provides shared state for BullMQ, rate limiting and send throttling. Atomic Lua operations prevent race conditions between workers.

## Why PostgreSQL?

PostgreSQL is the primary source of truth for users, senders, emails and Slack connections.

## Why Elasticsearch?

Elasticsearch provides efficient text search over email records while PostgreSQL remains the transactional data store.

## Why Ethereal?

Ethereal provides a safe fake SMTP environment for testing without sending real emails.

---

# ⚠️ Production Considerations

This project is designed for the assignment and local development.

For production deployment:

- Use a persistent Redis-backed session store.
- Use a production email provider such as Amazon SES or SendGrid.
- Store secrets using a dedicated secrets manager.
- Add production monitoring and metrics.
- Add stronger retry and failure-handling strategies.
- Add recipient deduplication and advanced campaign analytics.

Exactly-once SMTP delivery cannot be absolutely guaranteed because an SMTP provider may accept a message before the application records its final database status. The implementation uses idempotency and status checks to minimize duplicate sends.

---

# 👨‍💻 Author

**Rehan Hussain**

B.Tech Computer Science and Engineering  
RGUKT RK Valley

Software Development Intern Assignment

### Built with

Next.js · React · TypeScript · Node.js · Express · PostgreSQL · Prisma · Redis · BullMQ · Elasticsearch · Nodemailer · Ethereal · Google OAuth · Slack API · Bull Board