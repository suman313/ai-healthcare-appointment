# MediBook — Multi-Tenant Healthcare SaaS Platform

A production-grade clinic management platform built for multi-clinic SaaS use. Clinics can manage doctors, patients, appointments, billing, prescriptions, and medical records — all isolated per tenant.

**Live Demo:** [https://main.di22mns17ljop.amplifyapp.com](https://main.di22mns17ljop.amplifyapp.com)

**Demo credentials:**
- Email: `admin@test.com`
- Password: `test123`

---

## Features

### Patient-Facing
- **AI-powered booking flow** — 5-step wizard where patients describe symptoms, get a specialist recommendation, pick a doctor, select a time slot, and confirm
- **Appointment self-management** — patients can cancel or reschedule via a secure email token link (no login required)
- **Real-time waiting room display** — live queue screen for clinic TVs, auto-refreshes every 5 seconds

### Clinic Staff Dashboard
- **Receptionist queue** — check patients in, assign queue numbers, call patients to room, mark no-shows
- **Doctor view** — see today's scheduled patients, open visit panel, write SOAP clinical notes
- **Appointments** — create, filter, update status, and delete appointments
- **Doctors** — add/edit/delete doctors, set weekly availability and slot duration
- **Patients** — full patient registry with visit history and medical records
- **Prescriptions** — doctors create and manage patient prescriptions
- **Billing** — create invoices, track payment status, view 6-month revenue chart
- **Staff management** — admin creates/deletes staff accounts with role-based access (Admin / Doctor / Receptionist)
- **Notifications log** — track all sent email and SMS notifications with delivery status
- **Subscription plans** — Free / Basic / Professional / Clinic Chain tiers with usage limits

### Architecture
- **Multi-tenant** — every clinic's data is fully isolated via `clinic_id` scoping on all queries
- **Role-based access control** — route-level and data-level enforcement per role
- **JWT authentication** — stateless auth with configurable expiry

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Authentication | JWT (jsonwebtoken + bcrypt) |
| Email | Nodemailer (Gmail) |
| SMS | Fast2SMS |
| Process Manager | PM2 |
| Reverse Proxy | Nginx |
| SSL | Let's Encrypt (Certbot) |

---

## AWS Infrastructure

```
Users
  │
  ├──► AWS Amplify (Next.js Frontend)
  │         │
  │         │ HTTPS API calls
  │         ▼
  └──► EC2 t2.micro (Express Backend)
            │  Nginx reverse proxy (443 → 3001)
            │  PM2 process management
            │  Elastic IP: 13.63.86.199
            │
            ▼
       RDS db.t3.micro (PostgreSQL)
            eu-north-1 (Stockholm)
```

| Service | Purpose |
|---|---|
| AWS Amplify | Frontend hosting with CI/CD (auto-deploys on git push) |
| AWS EC2 t2.micro | Backend Node.js server |
| AWS RDS db.t3.micro | Managed PostgreSQL database |
| Elastic IP | Static public IP for EC2 |
| Nginx | Reverse proxy + SSL termination |
| Let's Encrypt | Free SSL certificate (auto-renews) |

---

## Project Structure

```
├── backend/
│   ├── src/
│   │   ├── config/          # DB connection, env config
│   │   ├── controllers/     # HTTP request handlers
│   │   ├── services/        # Business logic layer
│   │   ├── routes/          # Express route definitions
│   │   ├── middlewares/     # Auth, error handling
│   │   ├── utils/           # JWT, password hashing
│   │   └── database/
│   │       ├── migrations/  # SQL schema migrations
│   │       └── seeds/       # Seed data
│   ├── app.js
│   └── server.js
│
└── frontend/
    ├── app/                 # Next.js App Router pages
    ├── components/          # Shared UI components
    └── lib/                 # Auth helpers
```

---

## Database Schema

14 tables:

| Table | Purpose |
|---|---|
| `clinics` | Clinic profiles (SaaS tenants) |
| `users` | Staff accounts per clinic |
| `doctors` | Doctor profiles |
| `patients` | Patient registry |
| `appointments` | Appointment records with queue tracking |
| `doctor_availability` | Weekly schedule and slot duration per doctor |
| `appointment_reminders` | Reminder scheduling |
| `ai_symptom_logs` | AI symptom analysis history |
| `notifications` | Email/SMS delivery log |
| `medical_records` | SOAP clinical notes |
| `prescriptions` | Patient prescriptions |
| `billing` | Invoices and payment tracking |
| `subscription_plans` | Available SaaS tiers |
| `clinic_subscriptions` | Current plan per clinic |

---

## API Endpoints

| Method | Endpoint | Access |
|---|---|---|
| POST | `/api/auth/register-clinic` | Public |
| POST | `/api/auth/login` | Public |
| GET/POST | `/api/doctors` | Authenticated |
| GET | `/api/doctors/:id/slots` | Public |
| GET/POST | `/api/patients` | Authenticated |
| GET/POST/PUT/DELETE | `/api/appointments` | Authenticated |
| GET | `/api/manage/:token` | Public (email token) |
| POST | `/api/manage/:token/cancel` | Public (email token) |
| POST | `/api/manage/:token/reschedule` | Public (email token) |
| GET/POST | `/api/medical-records` | Doctor only |
| GET/POST | `/api/prescriptions` | Doctor only |
| GET/POST/PUT | `/api/billing` | Authenticated |
| GET | `/api/billing/stats` | Authenticated |
| POST | `/api/queue/checkin/:id` | Receptionist |
| POST | `/api/queue/call/:id` | Receptionist |
| GET | `/api/queue/display/:clinicId` | Public |
| GET/POST/DELETE | `/api/users` | Admin only |
| GET | `/api/notifications` | Authenticated |
| GET | `/api/subscriptions/plans` | Public |
| GET/POST | `/api/subscriptions` | Authenticated |

---

## Local Development Setup

**Prerequisites:** Node.js 18+, PostgreSQL

```bash
# Clone the repository
git clone https://github.com/suman313/ai-healthcare-appointment.git
cd ai-healthcare-appointment

# Backend setup
cd backend
cp .env.example .env
# Fill in your .env values
npm install
npm run migrate
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev
```

Frontend runs on `http://localhost:3000`, backend on `http://localhost:3001`.

---

## Security

- Passwords hashed with bcrypt
- JWT authentication on all protected routes
- `clinic_id` enforced on every database query (tenant isolation)
- SSL/TLS via Let's Encrypt
- Environment variables for all secrets (never committed)

---

## License

MIT
