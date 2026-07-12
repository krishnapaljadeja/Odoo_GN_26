# PERN Prisma OTP Starter

Hackathon-ready PERN template with a separated frontend and backend:

- `client/` - React frontend
- `server/` - Express backend with Prisma, PostgreSQL, JWT auth, and Nodemailer signup OTP

The goal of this repo is to remove initial setup work before a hackathon problem statement arrives. You can start from auth, database, frontend routing, protected pages, and a clean client/server split.

## Tech Stack

Frontend:

- React 17
- Vite
- React Router
- Redux Toolkit
- Redux Persist
- Axios
- Sass

Backend:

- Node.js
- Express
- PostgreSQL
- Prisma ORM
- JWT auth
- HTTP-only auth cookies
- bcryptjs password hashing
- Nodemailer signup OTP emails
- CORS for frontend/backend local development

Tooling:

- Vite frontend bundler/dev server
- Root workspace scripts for running both apps
- Prisma migrations and Prisma Studio
- Separate env files for frontend and backend

## What Is Already Included

- Signup with OTP flow
- Login and logout
- Protected route support on frontend
- Auth state persistence with Redux Persist
- Prisma models for users and pending signup OTPs
- Nodemailer mail service
- Development fallback that logs OTPs to the server console if SMTP is not configured
- Backend CORS configured with `CLIENT_URL`
- Frontend API base URL configured with `VITE_API_URL`

## Directory Structure

```text
root
|-- package.json
|-- readme.md
|-- SERVER_CLIENT_SETUP.md
|-- client/
|   |-- .env.sample
|   |-- package.json
|   |-- public/
|   |-- src/
|       |-- index.js
|       |-- App.js
|       |-- app/
|           |-- components/
|           |-- containers/
|           |-- routes/
|           |-- state/
|           |-- styles/
|-- server/
|   |-- .env.sample
|   |-- package.json
|   |-- server.js
|   |-- prisma/
|   |   |-- schema.prisma
|   |-- src/
|       |-- app.js
|       |-- db/
|       |-- middleware/
|       |-- routes/
|       |-- services/
```

## Environment Files

Create separate env files for frontend and backend:

```bash
cp server/.env.sample server/.env
cp client/.env.sample client/.env
```

On Windows PowerShell, use:

```powershell
Copy-Item server\.env.sample server\.env
Copy-Item client\.env.sample client\.env
```

### `server/.env`

```env
AUTH_TOKEN_SECRET="replace_with_a_strong_secret"
AUTH_EXPIRES_IN_SECONDS=604800
PORT=8080
CLIENT_URL="http://localhost:3000"
DATABASE_URL="postgresql://postgres:password@localhost:5432/hackathon_app?schema=public"

SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your_email@gmail.com"
SMTP_PASS="your_email_app_password"
MAIL_FROM="PERN Hackathon Starter <your_email@gmail.com>"
OTP_EXPIRES_IN_MINUTES=10
```

Notes:

- `DATABASE_URL` is used by Prisma.
- `CLIENT_URL` must match the frontend URL for CORS.
- For Gmail, use an app password, not your normal account password.
- If SMTP values are missing in development, OTPs are printed in the backend console.

### `client/.env`

```env
VITE_DEFAULT_LOGIN_REDIRECT="/dashboard"
VITE_API_URL="http://localhost:8080"
```

Notes:

- `VITE_API_URL` tells Axios where the backend is running.
- If you change the backend port, update this value.

## Setup

1. Install dependencies:

   ```bash
   npm run get-started
   ```

   On Windows PowerShell, if `npm` is blocked by execution policy, use:

   ```powershell
   npm.cmd run get-started
   ```

   If the old CRA lockfile is still present, regenerate it during install from the repo root:

   ```bash
   npm install --prefix client
   ```

2. Create the env files:

   ```bash
   cp server/.env.sample server/.env
   cp client/.env.sample client/.env
   ```

3. Update `server/.env` with your local PostgreSQL credentials.

4. Create the PostgreSQL database from your `DATABASE_URL`.

   Example:

   ```sql
   CREATE DATABASE hackathon_app;
   ```

5. Run Prisma migration:

   ```bash
   npm run prisma:migrate -- --name init
   ```

6. Start both frontend and backend:

   ```bash
   npm run dev
   ```

Backend: `http://localhost:8080`

Frontend: `http://localhost:3000`

## Available Commands

Run from the repo root:

```bash
npm run get-started      # Install server/client deps and generate Prisma client
npm run dev              # Run backend and frontend together
npm run server           # Run backend only
npm run client           # Run frontend only
npm run build            # Build frontend with Vite
npm run prisma:migrate   # Run Prisma migration from server/
npm run prisma:studio    # Open Prisma Studio from server/
```

Run from `server/`:

```bash
npm run start
npm run dev
npm run prisma:generate
npm run prisma:migrate
npm run prisma:studio
```

Run from `client/`:

```bash
npm start
npm run dev
npm run build
npm run preview
```

## Prisma

Prisma schema lives at:

```text
server/prisma/schema.prisma
```

Current models:

- `User` - registered users
- `SignupOtp` - temporary pending signup details and OTP hashes

Useful flow after changing Prisma schema:

```bash
npm run prisma:migrate -- --name your_change_name
```

## Authentication Flow

Signup with OTP:

1. Frontend sends signup details to `POST /api/user/signup/request-otp`.
2. Backend checks if the user exists.
3. Backend hashes the password and OTP.
4. Backend stores pending signup data in `signup_otp`.
5. Backend sends the OTP through Nodemailer.
6. Frontend sends `login_id` and `otp` to `POST /api/user/signup/verify-otp`.
7. Backend verifies OTP, creates the user, deletes the pending OTP, sets the auth cookie, and returns user data.

Login:

- `POST /auth/local`

Logout:

- `DELETE /auth/local`

Current user:

- `GET /api/user/me`

## API Endpoints

```text
POST   /api/user/signup/request-otp
POST   /api/user/signup/verify-otp
POST   /api/user
GET    /api/user/me
POST   /auth/local
DELETE /auth/local
```

## Hackathon Checklist

- Confirm PostgreSQL is running.
- Create `server/.env` and `client/.env`.
- Set a fresh `AUTH_TOKEN_SECRET`.
- Set `DATABASE_URL`.
- Run Prisma migration.
- Start with `npm run dev`.
- Build features inside `client/src/app/routes` and `server/src/routes`.
