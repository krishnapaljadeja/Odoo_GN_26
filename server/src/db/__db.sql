--To connect locally to postgres--
--psql -U postgres;

--To connect to external postgres db--
--psql -h hostname -d databasename -U username;


-- CREATE DATABASE cumin; --Create a new database named cumin

-- \c cumin; --Change the location to the newly created cumin database

-- This project now uses Prisma migrations instead of hand-written table setup.
-- Run this after setting DATABASE_URL in .env:
-- npx prisma migrate dev --name init

