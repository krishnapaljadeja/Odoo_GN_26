# PERN Prisma OTP Starter

Hackathon-ready PERN template with a separated frontend and backend:

- `client/` - React frontend
- `server/` - Express backend with Prisma, PostgreSQL, JWT auth, and Nodemailer signup OTP support

The goal of this repo is to remove initial setup work before a hackathon problem statement arrives. You can start from auth, database, frontend routing, protected pages, and a clean client/server split.

## Tech Stack

Frontend:

- React 18
- Vite
- React Router
- Redux Toolkit
- Redux Persist
- Axios
- React Hook Form
- Zod
- Sass
- Tailwind CSS
- shadcn-style reusable UI primitives
- Sonner toasts
- Vercel Analytics
- Lucide React icons
- GSAP with `@gsap/react`

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

- Direct signup with email, username, and password
- Auto-generated integer user IDs through Prisma/PostgreSQL
- Login, logout, and current-user auth routes
- OTP signup backend support remains available for flows that need email verification
- Protected route support on frontend
- Auth state persistence with Redux Persist
- Shared UI components: `Button`, `Input`, `Card`, `Loader`, `Toaster`, and reusable background wrappers
- Shared layout components: `AppShell`, `DashboardLayout`, and `PageHeader`
- Shared data-state components: `DataState`, `EmptyState`, and `StatCard`
- Shared form components: `FormField` and `FormSection`
- Client API helper in `client/src/lib/api.js`
- Copyable frontend route template in `client/src/app/routes/_template`
- Copyable backend route/controller/service/validator template
- Shared animation components: `SmoothScroll` and `Reveal`
- GSAP core setup with common plugins registered centrally
- Lazy GSAP specialty plugin loaders for heavier future animation needs
- Frontend Sonner notification setup
- Vercel Analytics mounted in the app entry
- Prisma models for users and pending signup OTPs
- Nodemailer mail service
- Development fallback that logs OTPs to the server console if SMTP is not configured
- Backend CORS configured with `CLIENT_URL`
- Frontend API base URL configured with `VITE_API_URL`
- Vite dev proxy for `/api` and `/auth` to avoid frontend 404s during local development
- Vite manual chunks for React, Redux, UI, and GSAP vendor bundles
- shadcn-style alias support with `@/*` mapped to `client/src/*`
- Health/status endpoints: `GET /health` and `GET /api/status`

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
|       |-- index.jsx
|       |-- App.jsx
|       |-- app/
|           |-- components/
|           |-- containers/
|           |-- routes/
|           |-- state/
|           |-- styles/
|       |-- components/
|           |-- ui/
|       |-- features/
|       |-- lib/
|-- server/
|   |-- .env.sample
|   |-- package.json
|   |-- server.js
|   |-- prisma/
|   |   |-- schema.prisma
|   |-- src/
|       |-- app.js
|       |-- controllers/
|       |-- db/
|       |-- middleware/
|       |-- routes/
|       |-- services/
|       |-- validators/
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

Direct signup:

1. Frontend collects `email`, `username`, and `password`.
2. Frontend sends the data to `POST /auth/signup`.
3. Backend checks if the email already exists.
4. Backend hashes the password, creates the user with an auto-generated `id`, sets the auth cookie, and returns user data.

Login:

- `POST /auth/login`

Logout:

- `DELETE /auth/logout`

Current user:

- `GET /auth/me`

OTP signup support is still available through `/api/user/signup/request-otp` and `/api/user/signup/verify-otp`.

## API Endpoints

```text
POST   /api/user/signup/request-otp
POST   /api/user/signup/verify-otp
POST   /api/user
GET    /api/user/me
POST   /auth/signup
POST   /auth/login
DELETE /auth/logout
GET    /auth/me
POST   /api/auth/signup
POST   /api/auth/login
DELETE /api/auth/logout
GET    /api/auth/me
POST   /auth/local
DELETE /auth/local
GET    /health
GET    /api/status
GET    /api/template
POST   /api/template
```

## Frontend UI Foundation

Ready-to-use app components live in `client/src/app/components/ui`. shadcn-compatible copy-paste components live in `client/src/components/ui`, so imports like `@/components/ui/grid-background` work out of the box.

- `Button` - variants, sizes, loading state, Lucide spinner
- `Input` - shared form input styling
- `Card` - header/content/footer layout primitives
- `Loader` - reusable loading indicator
- `Toaster` - Sonner notification mount
- `GridBackground` - grid background with a soft magenta glow
- `SoftYellowGlowBackground` - radial yellow glow background
- `NoiseTextureBackground` - subtle dot texture background

Tailwind is configured through `client/tailwind.config.js`, `client/postcss.config.js`, and `client/src/app/styles/tailwind.css`. The Vite alias in `client/vite.config.js` maps `@` to `client/src`, matching common shadcn examples.

Global analytics is mounted in `client/src/index.jsx` through `@vercel/analytics/react`. Use these primitives when planning new screens so feature work can focus on the problem statement instead of rebuilding base UI/auth plumbing.

## Development Scaffolds

Use these when the problem statement arrives:

- Client API helper: `client/src/lib/api.js`
- Example feature API module: `client/src/features/example/api.js`
- Frontend route template: `client/src/app/routes/_template/index.jsx`
- Layout primitives: `client/src/app/components/layout`
- Data-state primitives: `client/src/app/components/data`
- Form primitives: `client/src/app/components/forms`
- Backend route template: `server/src/routes/_template/index.js`
- Backend controller template: `server/src/controllers/templateController.js`
- Backend service template: `server/src/services/templateService.js`
- Backend validator template: `server/src/validators/templateValidator.js`

The template frontend route demonstrates:

- `react-hook-form`
- `zod`
- `@hookform/resolvers/zod`
- loading, empty, and error states
- API calls through `apiClient`
- Sonner success/error toasts

The template backend route demonstrates:

- route/controller/service/validator split
- `GET /api/template`
- `POST /api/template`
- request validation before controller logic

## Animation Foundation

GSAP is installed and centralized in `client/src/lib/gsap.js`:

- `registerGsap()` registers the common animation plugins used across screens.
- `useGSAP` is exported from the same file for React-safe animation lifecycles.
- `ScrollSmoother`, `ScrollTrigger`, `ScrollToPlugin`, `Observer`, `Flip`, `Draggable`, `MotionPathPlugin`, `SplitText`, `TextPlugin`, and common eases are ready.
- `loadGsapExtras()` lazy-loads heavier specialty plugins such as DrawSVG, MorphSVG, Inertia, ScrambleText, Physics, Pixi, CustomBounce, and CustomWiggle.
- `loadGsapDevTools()` lazy-loads GSDevTools and MotionPathHelper when a screen needs animation debugging.

Reusable animation components live in `client/src/app/components/animation`:

- `SmoothScroll` wraps routed page content and enables smooth scrolling while respecting reduced-motion preferences.
- `Reveal` provides a simple scroll-triggered reveal primitive for future sections/cards/headings.

## Planning Prompt Context

Copy this section into the planning prompt when the hackathon/problem statement arrives.

```text
Repo context:
- This is a JavaScript PERN-style starter with separate `client/` and `server/` folders.
- Frontend: React 18, Vite, React Router v5, Redux Toolkit, Redux Persist, Axios, Sass, Tailwind CSS, shadcn-style component paths, Sonner, Lucide React, Vercel Analytics, GSAP, React Hook Form, and Zod.
- Backend: Node.js, Express, Prisma, PostgreSQL, JWT auth, HTTP-only auth cookies, bcryptjs, Nodemailer OTP support, CORS, and route/controller/service/validator scaffolding.
- Auth is ready: direct signup with email + username + password, auto-generated user IDs, login, logout, current user, protected frontend routes.
- Auth endpoints: `POST /auth/signup`, `POST /auth/login`, `DELETE /auth/logout`, `GET /auth/me`, plus `/api/auth/*` aliases. Legacy `/auth/local` and `/api/user` routes still exist.
- Health endpoints: `GET /health` and `GET /api/status`.
- Frontend API helper is `client/src/lib/api.js`; prefer this over raw Axios in new features.
- Reusable app UI is in `client/src/app/components/ui`.
- shadcn-compatible copy-paste UI path is `client/src/components/ui`, with `@/*` mapped to `client/src/*`.
- Layout components are in `client/src/app/components/layout`: `AppShell`, `DashboardLayout`, `PageHeader`.
- Data-state components are in `client/src/app/components/data`: `DataState`, `EmptyState`, `StatCard`.
- Form components are in `client/src/app/components/forms`: `FormField`, `FormSection`.
- Background wrappers are ready: `GridBackground`, `SoftYellowGlowBackground`, `NoiseTextureBackground`.
- Animation wrappers are in `client/src/app/components/animation`: `SmoothScroll`, `Reveal`.
- GSAP setup is centralized in `client/src/lib/gsap.js`; common plugins are registered, heavy specialty plugins can be lazy-loaded.
- Frontend route template is `client/src/app/routes/_template/index.jsx`; copy this for new pages/workflows.
- Example frontend feature API module is `client/src/features/example/api.js`.
- Backend template files are `server/src/routes/_template/index.js`, `server/src/controllers/templateController.js`, `server/src/services/templateService.js`, and `server/src/validators/templateValidator.js`.
- Prisma schema is `server/prisma/schema.prisma`; current models are `User` and `SignupOtp`.
- Add new backend resources by creating a route, controller, service, validator, and Prisma model/migration when persistent data is needed.
- Add new frontend routes under `client/src/app/routes`, shared feature API helpers under `client/src/features/<feature>/api.js`, and reusable UI only when multiple screens need it.
```

## Hackathon Checklist

- Confirm PostgreSQL is running.
- Create `server/.env` and `client/.env`.
- Set a fresh `AUTH_TOKEN_SECRET`.
- Set `DATABASE_URL`.
- Run Prisma migration.
- Start with `npm run dev`.
- Build features inside `client/src/app/routes` and `server/src/routes`.
