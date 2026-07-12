# AssetFlow - Enterprise Asset & Resource Management System
[![Ask DeepWiki](https://devin.ai/assets/askdeepwiki.png)](https://deepwiki.com/krishnapaljadeja/Odoo_GN_26/tree/main)

AssetFlow is a centralized, ERP-style platform for organizations to track, allocate, and maintain physical assets and shared resources. It provides a comprehensive suite of tools for the entire asset lifecycle, from registration to disposal, with robust role-based access control.

The system is built on a PERN (PostgreSQL, Express, React, Node.js) stack with a clean client/server separation, utilizing modern tools like Prisma, Vite, and Tailwind CSS.

## Key Features

*   **Dashboard & KPIs:** Get an at-a-glance overview of asset status, active bookings, pending transfers, and overdue returns.
*   **Organization Setup:** Admins can configure departments, asset categories, and manage the employee directory, including role promotions.
*   **Asset Lifecycle Management:** Register assets with detailed information, track their status (Available, Allocated, Under Maintenance, etc.), and manage their entire lifecycle.
*   **Intelligent Allocation & Transfers:** Allocate assets to employees or departments with double-allocation blocking. A built-in workflow manages transfer requests between users.
*   **Resource Booking:** A calendar-based system for booking shared resources (like conference rooms) with automatic overlap validation to prevent conflicts.
*   **Maintenance Kanban Board:** Raise, approve, and track maintenance requests through a visual Kanban board workflow, automatically updating asset statuses.
*   **Structured Audits:** Create and manage audit cycles for specific departments or locations, assign auditors, and auto-generate discrepancy reports for missing or damaged assets.
*   **Reporting & Analytics:** Generate insightful reports on asset utilization, maintenance frequency, idle assets, and booking heatmaps. Export reports to CSV.
*   **Role-Based Access Control (RBAC):** Granular permissions for four distinct roles:
    *   **Admin:** Full system control.
    *   **Asset Manager:** Manages assets, allocations, and maintenance.
    *   **Department Head:** Manages their department's assets and team requests.
    *   **Employee:** Manages their own allocated assets and bookings.
*   **Notifications & Activity Log:** Real-time notifications for important events and a complete, searchable log of all actions for audit purposes.

## Tech Stack

### Frontend (`client/`)

*   **Framework/Library:** React 18, React Router
*   **Build Tool:** Vite
*   **State Management:** Redux Toolkit, Redux Persist
*   **Styling:** Tailwind CSS, Sass
*   **UI Components:** shadcn-ui style primitives, Sonner (toasts), Lucide Icons
*   **Forms:** React Hook Form with Zod for validation
*   **Data Fetching:** Axios
*   **Animation:** GSAP
*   **Analytics:** Vercel Analytics

### Backend (`server/`)

*   **Framework:** Node.js, Express
*   **Database:** PostgreSQL
*   **ORM:** Prisma
*   **Authentication:** JWT with HTTP-only cookies, bcryptjs for hashing
*   **Email:** Nodemailer for OTP emails (signup, password reset)
*   **File Uploads:** Multer for asset photos

## Getting Started

### Prerequisites

*   Node.js (v18 or higher)
*   npm
*   PostgreSQL

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/krishnapaljadeja/Odoo_GN_26.git
    cd Odoo_GN_26
    ```

2.  **Install dependencies** for both the server and client from the root directory:
    ```bash
    npm run get-started
    ```

3.  **Set up environment variables:**
    Copy the sample environment files for both the server and client.

    ```bash
    # For server
    cp server/.env.sample server/.env

    # For client
    cp client/.env.sample client/.env
    ```

4.  **Configure environment variables:**
    *   Open `server/.env` and update the `DATABASE_URL` with your PostgreSQL connection string and fill in the `AUTH_TOKEN_SECRET`. Configure `SMTP` variables for email functionality.
    *   Open `client/.env` and ensure `VITE_API_URL` points to your backend server (default is `http://localhost:8080`).

5.  **Set up the database:**
    Ensure your PostgreSQL server is running and create the database specified in your `DATABASE_URL`. For example:
    ```sql
    CREATE DATABASE assetflow;
    ```

6.  **Run database migrations:**
    This will create all the necessary tables in your database.
    ```bash
    npm run prisma:migrate
    ```

7.  **Seed the database:**
    This populates the database with essential demo data (users, departments, assets, etc.) for a complete experience. The default password for all seeded users is `Passw0rd1`.
    ```bash
    npm run prisma:seed
    ```
    *Admin login: `admin@assetflow.test`*

8.  **Run the application:**
    This command starts both the backend and frontend development servers concurrently.
    ```bash
    npm run dev
    ```
    *   Frontend will be available at `http://localhost:3000`
    *   Backend will be available at `http://localhost:8080`

## Available Scripts

### Root Directory

*   `npm run get-started`: Installs all dependencies for both client and server.
*   `npm run dev`: Runs both client and server in development mode.
*   `npm run server`: Runs only the backend server.
*   `npm run client`: Runs only the frontend client.
*   `npm run build`: Builds the production-ready client application.
*   `npm run prisma:migrate`: Applies new database migrations.
*   `npm run prisma:studio`: Opens the Prisma Studio GUI to view and edit data.

## Project Structure

The repository is a monorepo with a clear separation between the frontend and backend applications.

```
/
|-- client/         # React frontend application
|   |-- src/
|       |-- app/    # Core application screens, components, and logic
|       |-- features/ # API bindings and schemas for each module
|       |-- lib/    # Shared utilities (API client, GSAP config)
|
`-- server/         # Express backend application
    |-- prisma/     # Prisma schema, migrations, and seed script
    `-- src/
        |-- controllers/
        |-- middleware/
        |-- routes/
        |-- services/   # Business logic for each module
        `-- validators/ # Zod validation schemas for API requests