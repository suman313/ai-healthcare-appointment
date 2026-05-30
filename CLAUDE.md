# MediBook — Project Knowledge Base

This file is for Claude AI and future developers. It contains everything about this project — architecture, deployment, decisions, and how to maintain it.

---

## Project Overview

**MediBook** is a multi-tenant healthcare SaaS platform. Each clinic is a separate tenant. Clinics manage doctors, patients, appointments, billing, prescriptions, and medical records.

**Live URLs:**
- Frontend: `https://main.di22mns17ljop.amplifyapp.com`
- Backend API: `https://healthcare-appointment.duckdns.org`
- Backend direct IP: `http://13.63.86.199:3001` (use domain instead)

**GitHub:** `https://github.com/suman313/ai-healthcare-appointment`

**AWS Region:** `eu-north-1` (Stockholm)

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Frontend | Next.js | 14.2.5 |
| UI | React | 18 |
| Styling | Tailwind CSS | 3.4 |
| HTTP Client | Axios | 1.6 |
| Backend | Node.js | 22 |
| Framework | Express.js | 4.18 |
| Database | PostgreSQL | (RDS managed) |
| Auth | JWT (jsonwebtoken) | 9.0 |
| Password | bcrypt | 5.1 |
| Email | Nodemailer + Gmail | 8.0 |
| SMS | Fast2SMS API | - |
| Process Manager | PM2 | - |
| Reverse Proxy | Nginx | 1.28 |
| SSL | Let's Encrypt (Certbot) | - |

---

## AWS Infrastructure

### Services

| Service | Details | Free Tier |
|---|---|---|
| EC2 | t2.micro, Ubuntu, eu-north-1 | 750 hrs/month (12 months) |
| RDS | db.t3.micro, PostgreSQL, eu-north-1 | 750 hrs/month (12 months) |
| Amplify | Frontend hosting | 1000 build mins, 100GB/month |
| Elastic IP | 13.63.86.199 | Free while attached to running instance |

### EC2 Instance
- **Instance ID:** i-01fff1dd122e50245
- **Public IP (Elastic):** 13.63.86.199
- **Private IP:** 172.31.34.229
- **OS:** Ubuntu
- **Security Group:** sg-0af2dee960b82a91e (launch-wizard-1)
- **Key pair:** healthcare-key.pem (stored at `/home/suman/healthcare-key.pem` on WSL)
- **SSH command:** `ssh -i "/home/suman/healthcare-key.pem" ubuntu@13.63.86.199`
- **Note:** Username is `ubuntu` (not `ec2-user`) — this is an Ubuntu AMI

### RDS Instance
- **Endpoint:** (check AWS Console → RDS → your instance → Connectivity tab)
- **Engine:** PostgreSQL
- **Instance:** db.t3.micro
- **Database name:** healthcare_appointment
- **Master user:** postgres
- **Security Group:** sg-0ec0550576bd04b46 (ec2-rds-1)
- **SSL:** Required (`ssl: { rejectUnauthorized: false }`)

### Security Group Rules

**EC2 (launch-wizard-1):**
| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 22 | TCP | 0.0.0.0/0 | SSH |
| 80 | TCP | 0.0.0.0/0 | HTTP (redirects to HTTPS) |
| 443 | TCP | 0.0.0.0/0 | HTTPS |
| 3001 | TCP | 0.0.0.0/0 | Express direct (legacy) |

**RDS (ec2-rds-1):**
| Port | Protocol | Source | Purpose |
|---|---|---|---|
| 5432 | TCP | Your local IP | Local development access |
| 5432 | TCP | sg-0af2dee960b82a91e | EC2 → RDS connection |

### Amplify
- **App:** ai-healthcare-appointment
- **Branch:** main (auto-deploys on git push)
- **Root directory:** `frontend`
- **Build command:** `npm run build`
- **Environment variable:** `NEXT_PUBLIC_API_URL=https://healthcare-appointment.duckdns.org`

---

## Domain & SSL

- **Domain:** `healthcare-appointment.duckdns.org` (free DuckDNS subdomain)
- **DuckDNS account:** login at duckdns.org with Google
- **IP pointed to:** 13.63.86.199
- **SSL certificate:** Let's Encrypt via Certbot
- **Certificate path:** `/etc/letsencrypt/live/healthcare-appointment.duckdns.org/`
- **Auto-renewal:** Certbot sets up a cron job automatically. Cert expires every 90 days.
- **Nginx config:** `/etc/nginx/sites-enabled/default`

### Nginx Config (current)
```nginx
server {
    listen 80;
    listen [::]:80;
    server_name healthcare-appointment.duckdns.org;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    listen [::]:443 ssl;
    server_name healthcare-appointment.duckdns.org;

    ssl_certificate /etc/letsencrypt/live/healthcare-appointment.duckdns.org/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthcare-appointment.duckdns.org/privkey.pem;
    include /etc/letsencrypt/options-ssl-nginx.conf;
    ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

---

## Backend on EC2

### File Locations
- **Project:** `/home/ubuntu/ai-healthcare-appointment/backend/`
- **PM2 logs:** `/home/ubuntu/.pm2/logs/`
- **Nginx config:** `/etc/nginx/sites-enabled/default`
- **SSL certs:** `/etc/letsencrypt/live/healthcare-appointment.duckdns.org/`

### PM2 Commands
```bash
pm2 status                          # Check if app is running
pm2 logs healthcare-backend         # View live logs
pm2 logs healthcare-backend --lines 50  # Last 50 lines
pm2 restart healthcare-backend      # Restart after code changes
pm2 stop healthcare-backend         # Stop the app
pm2 start server.js --name healthcare-backend  # Start fresh
pm2 save                            # Save process list
pm2 startup                         # Register PM2 on system boot
```

### Deploying Backend Code Changes
```bash
# On EC2:
cd ~/ai-healthcare-appointment
git pull
pm2 restart healthcare-backend
```

### Backend .env on EC2
Located at `/home/ubuntu/ai-healthcare-appointment/backend/.env`

Required variables:
```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://main.di22mns17ljop.amplifyapp.com

DB_HOST=<rds-endpoint>
DB_PORT=5432
DB_NAME=healthcare_appointment
DB_USER=postgres
DB_PASSWORD=<password>

JWT_SECRET=<strong-secret>
JWT_EXPIRES_IN=7d

EMAIL_FROM=sumanmodakofficial@gmail.com
EMAIL_PASSWORD=<gmail-app-password>

FAST2SMS_API_KEY=<api-key>
```

---

## Database

### Running Migrations
```bash
# From local machine (with DB_HOST pointing to RDS):
cd backend
npm run migrate
```

### Running Seeds
```bash
npm run seed
```

### Connecting Locally to RDS
Update `backend/.env` temporarily:
```
DB_HOST=<rds-endpoint>.rds.amazonaws.com
DB_NAME=healthcare_appointment
NODE_ENV=production  # enables SSL
```

### SSL Requirement
RDS requires SSL. The `db.js` config handles this:
```js
ssl: env.nodeEnv === 'production' ? { rejectUnauthorized: false } : false
```

Always set `NODE_ENV=production` when connecting to RDS.

---

## Database Schema (14 tables)

| Table | Purpose |
|---|---|
| `clinics` | SaaS tenants — each clinic is one row |
| `users` | Staff accounts (admin/doctor/receptionist) |
| `doctors` | Doctor profiles linked to clinic |
| `patients` | Patient registry per clinic |
| `appointments` | Bookings with status and queue tracking |
| `doctor_availability` | Weekly schedule + slot duration per doctor |
| `appointment_reminders` | Reminder scheduling |
| `ai_symptom_logs` | AI symptom analysis history |
| `notifications` | Email/SMS delivery log |
| `medical_records` | SOAP clinical notes per visit |
| `prescriptions` | Patient prescriptions by doctor |
| `billing` | Invoices and payment tracking |
| `subscription_plans` | SaaS pricing tiers |
| `clinic_subscriptions` | Current plan per clinic |

Multi-tenancy: every table (except subscription_plans) has `clinic_id` — all queries filter by it.

---

## Frontend

### Key Pages
| Route | Purpose |
|---|---|
| `/` | Landing page |
| `/login` | Clinic staff login + registration |
| `/booking/[clinicId]` | 5-step patient booking wizard |
| `/appointment/[token]` | Patient self-cancel/reschedule |
| `/confirmation` | Booking success page |
| `/display/[clinicId]` | Waiting room TV queue display |
| `/dashboard` | Main dashboard with stats |
| `/dashboard/appointments` | Appointment management |
| `/dashboard/doctors` | Doctor management |
| `/dashboard/patients` | Patient management |
| `/dashboard/doctor` | Doctor's daily schedule view |
| `/dashboard/receptionist` | Queue management |
| `/dashboard/billing` | Invoices and revenue |
| `/dashboard/settings` | Staff account management |
| `/dashboard/subscription` | Plan management |
| `/dashboard/notifications` | Notification log |

### Environment Variables
- `NEXT_PUBLIC_API_URL` — backend API base URL (set in Amplify console)

### Deploying Frontend Changes
Just `git push origin main` — Amplify auto-deploys.

---

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL running locally (or use RDS with VPN/IP whitelist)

### Backend
```bash
cd backend
cp .env.example .env
# Edit .env with local DB credentials
npm install
npm run migrate
npm run seed
npm run dev        # runs on port 3001 with nodemon
```

### Frontend
```bash
cd frontend
cp .env.local.example .env.local
# Set NEXT_PUBLIC_API_URL=http://localhost:3001
npm install
npm run dev        # runs on port 3000
```

---

## Architecture Decisions

### Why separate EC2 + RDS instead of SQLite on EC2?
RDS handles backups, patching, and scaling. If EC2 crashes, data is safe. Also teaches proper cloud architecture.

### Why Nginx in front of Express?
Express alone can't do SSL termination easily. Nginx handles HTTPS on port 443 and proxies to Express on port 3001. Standard production pattern.

### Why PM2?
Without PM2, Node.js process dies when SSH session closes. PM2 keeps it running as a daemon and restarts on crash or server reboot.

### Why DuckDNS?
Free subdomain needed for Let's Encrypt SSL (SSL requires a domain, not just an IP). DuckDNS is free and works with Certbot.

### Why Amplify for frontend?
Auto CI/CD — every `git push` deploys automatically. Free tier is generous. Next.js SSR supported natively.

### AI feature (Ollama) removed
Originally had Ollama-based AI symptom checker. Removed due to:
- US clinic liability and HIPAA concerns
- Ollama requires local GPU/server — not suitable for cloud
- Future AI features should be operational (scheduling, reminders), not clinical

---

## Common Operations

### Stop EC2 to save free tier hours
EC2 Console → Instances → select instance → Instance State → Stop
- Elastic IP stays attached (no charge while stopped)
- RDS can keep running (separate 750hr counter)
- When restarted, IP is still 13.63.86.199

### Check backend health
```
https://healthcare-appointment.duckdns.org/health
```
Returns: `{"status":"ok"}`

### View backend logs
```bash
ssh -i "/home/suman/healthcare-key.pem" ubuntu@13.63.86.199
pm2 logs healthcare-backend --lines 50
```

### Renew SSL manually (if needed)
```bash
sudo certbot renew
sudo systemctl restart nginx
```

### Update Nginx config
```bash
sudo nano /etc/nginx/sites-enabled/default
sudo nginx -t        # test config
sudo systemctl restart nginx
```

### Fix cert permission error
```bash
sudo chmod -R 755 /etc/letsencrypt/live/
sudo chmod -R 755 /etc/letsencrypt/archive/
```

---

## IAM User
- **Username:** suman-dev
- **Account ID:** 150100906396
- **Policy:** AdministratorAccess-Amplify + AdministratorAccess
- Never use root account for daily work

---

## Cost Monitoring
- AWS Console → Billing → Budgets → set $5 alert
- Free tier expires 12 months from account creation
- After free tier: EC2 ~$9/month, RDS ~$15/month, Amplify ~free

---

## Future Improvements
- Custom domain (replace duckdns.org)
- HTTPS enforcement on EC2 direct access
- VPC private subnet for RDS (remove public access)
- Load balancer for scaling
- Automated database backups to S3
- Docker + Docker Compose for local dev
- CI/CD for backend (currently manual git pull on EC2)
- Restrict CORS to specific origin in production
