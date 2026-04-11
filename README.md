# AI Healthcare Appointment SaaS (MVP)

## Objective

Build a **multi-clinic SaaS platform** where clinics can manage doctors, patients, and appointments.
The system must support **AI-assisted doctor recommendation based on symptoms**.

This is a **minimal MVP focused only on appointment management**.

---

# Tech Stack

Frontend

* Next.js 14
* TailwindCSS
* Axios

Backend

* Node.js
* Express.js

Database

* PostgreSQL

Authentication

* JWT

AI Service

* Ollama (local AI model such as llama3 or mistral)

Environment

* Docker compatible
* Node 18+

---

# High Level Architecture

Client (Browser)

↓

Next.js Frontend

↓

Express API Server

↓

PostgreSQL Database

↓

AI Service (Ollama)

---

# Project Structure

backend/

src/

config/
database/
controllers/
services/
routes/
middlewares/
utils/
ai/

app.js
server.js

frontend/

app/
components/
services/
pages/
styles/

---

# Backend Folder Responsibilities

## config

Environment configuration

Example files

db.js
env.js

---

## database

Contains:

* SQL migrations
* seed scripts

---

## controllers

Handles HTTP request logic.

Example:

authController.js
doctorController.js
appointmentController.js

Controllers should call services.

---

## services

Business logic layer.

Example:

doctorService.js
appointmentService.js
patientService.js

Services communicate with database.

---

## routes

Express route definitions.

Example:

authRoutes.js
doctorRoutes.js
appointmentRoutes.js

Routes connect controllers.

---

## middlewares

Authentication middleware
Error handling middleware

Example:

authMiddleware.js
errorMiddleware.js

---

## utils

Reusable utilities.

Examples:

jwt.js
hashPassword.js

---

## ai

AI integration module.

Example:

symptomService.js

Uses Ollama API.

---

# Database Schema

## clinics

Columns

id SERIAL PRIMARY KEY
name TEXT
address TEXT
phone TEXT
email TEXT
created_at TIMESTAMP

---

## users

id SERIAL PRIMARY KEY
clinic_id INTEGER REFERENCES clinics(id)
name TEXT
email TEXT UNIQUE
password_hash TEXT
role TEXT
created_at TIMESTAMP

role values:

admin
doctor
receptionist

---

## doctors

id SERIAL PRIMARY KEY
clinic_id INTEGER REFERENCES clinics(id)
name TEXT
specialization TEXT
phone TEXT
email TEXT
created_at TIMESTAMP

---

## patients

id SERIAL PRIMARY KEY
clinic_id INTEGER REFERENCES clinics(id)
name TEXT
phone TEXT
email TEXT
date_of_birth DATE
created_at TIMESTAMP

---

## doctor_availability

id SERIAL PRIMARY KEY
doctor_id INTEGER REFERENCES doctors(id)
day_of_week INTEGER
start_time TIME
end_time TIME
slot_duration INTEGER

slot_duration stored in minutes

---

## appointments

id SERIAL PRIMARY KEY
clinic_id INTEGER REFERENCES clinics(id)
doctor_id INTEGER REFERENCES doctors(id)
patient_id INTEGER REFERENCES patients(id)
appointment_time TIMESTAMP
status TEXT
symptoms TEXT
created_at TIMESTAMP

status values

booked
completed
cancelled
no_show

---

## appointment_reminders

id SERIAL PRIMARY KEY
appointment_id INTEGER REFERENCES appointments(id)
reminder_time TIMESTAMP
sent_status BOOLEAN

---

## ai_symptom_logs

id SERIAL PRIMARY KEY
patient_id INTEGER REFERENCES patients(id)
symptoms TEXT
ai_response TEXT
created_at TIMESTAMP

---

## notifications

id SERIAL PRIMARY KEY
patient_id INTEGER REFERENCES patients(id)
type TEXT
message TEXT
sent_at TIMESTAMP
status TEXT

---

# API Endpoints

## Auth

POST /api/auth/register-clinic
POST /api/auth/login

---

## Doctors

GET /api/doctors
POST /api/doctors
PUT /api/doctors/:id
DELETE /api/doctors/:id

---

## Patients

GET /api/patients
POST /api/patients

---

## Appointments

GET /api/appointments
POST /api/appointments
PUT /api/appointments/:id
DELETE /api/appointments/:id

---

## AI Symptom Check

POST /api/ai/symptom-check

Example request

{
"symptoms": "fever and headache"
}

Example response

{
"recommended_specialist": "General Physician",
"urgency": "medium"
}

---

# AI Integration

Use Ollama API.

Endpoint

POST http://localhost:11434/api/generate

Example prompt

Patient symptoms: fever and cough.
Suggest suitable medical specialist.

The system must return:

* specialist
* urgency level

Store the full response in ai_symptom_logs.

---

# Appointment Booking Logic

1. Patient selects doctor
2. System fetches availability
3. System generates available time slots
4. Patient selects slot
5. Appointment created
6. Reminder scheduled

---

# Slot Generation Logic

Slots are created based on:

doctor_availability.start_time
doctor_availability.end_time
doctor_availability.slot_duration

Example

10:00 - 12:00
slot_duration = 15 minutes

Generated slots

10:00
10:15
10:30
10:45
11:00
11:15
11:30
11:45

---

# Security Requirements

Passwords must be hashed using bcrypt.

All API routes must verify JWT.

All queries must enforce clinic_id filtering.

Users must never access another clinic's data.

---

# Frontend Pages

Public

/
/booking
/confirmation

Dashboard

/dashboard
/doctors
/patients
/appointments
/schedule

---

# MVP Constraints

Do NOT implement

payments
prescriptions
insurance integration
pharmacy systems

Focus only on appointment scheduling.

---

# Development Steps

1. Setup Node.js + Express backend
2. Setup PostgreSQL connection
3. Create database migrations
4. Implement authentication
5. Implement doctor CRUD
6. Implement patient CRUD
7. Implement appointment booking
8. Implement slot generation
9. Integrate AI symptom check
10. Build frontend dashboard

---

# Legal Disclaimer

The AI assistant does not provide medical diagnosis.
It only recommends doctor types based on symptoms.

---

# Expected Outcome

A working MVP that allows clinics to:

* create doctors
* add patients
* manage appointments
* receive AI doctor suggestions
