# Vercel Deployment Guide - Digital Graveyard

This guide explains how to deploy Digital Graveyard to Vercel with full database persistence and automated cron timers.

---

## 1. Prerequisites Check (Already Configured)

The repository is now pre-configured for Vercel:
- **`package.json`**: Configured with `"postinstall": "prisma generate"` so Vercel builds the Prisma engine for Linux.
- **`vercel.json`**: Pre-configured with the daily cron check for `/api/cron/timeout-check`.
- **`.gitignore`**: Added to protect `.env`, `node_modules`, and `.next`.

---

## 2. Choosing Your Database

Because Vercel runs Next.js on Serverless Functions with a read-only, ephemeral filesystem, local SQLite (`dev.db`) cannot persist new claims, users, or deliverables in production.

### Recommended: Free PostgreSQL (Neon, Supabase, or Vercel Postgres)
1. Create a free database on **[Neon.tech](https://neon.tech)**, **[Supabase.com](https://supabase.com)**, or directly inside your **[Vercel Dashboard](https://vercel.com/dashboard/stores)** ("Storage" -> "Postgres").
2. Copy your PostgreSQL connection string:
   ```
   postgresql://user:password@host/neondb?sslmode=require
   ```
3. Update `prisma/schema.prisma` datasource provider:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Push the schema and seed the initial testing personas:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

*(Note: If you just want an instant prototype demo on Vercel without setting up a remote DB yet, you can deploy with SQLite, but note that database writes will not persist between cold starts).*

---

## 3. Deploying to Vercel

### Option A: Using the Vercel CLI (Fastest)

1. Open your terminal in `d:\GRAVFIN` and run:
   ```bash
   npx vercel
   ```
2. Follow the prompts:
   - **Log in**: Follow the browser login prompt.
   - **Set up and deploy?**: `Y`
   - **Which scope?**: Choose your personal or team account.
   - **Link to existing project?**: `N`
   - **Project name?**: `digital-graveyard` (or press Enter)
   - **Directory located?**: `./` (press Enter)
   - **Want to modify build settings?**: `N`
3. Set your environment variables when prompted or in the Vercel project dashboard:
   - `DATABASE_URL`: your PostgreSQL connection string (or `./prisma/dev.db` for demo).
   - `CRON_SECRET`: `graveyard_secret_key`
4. To deploy to production:
   ```bash
   npx vercel --prod
   ```

---

### Option B: Deploying via GitHub (Recommended for Teams & Continuous Deployment)

1. Initialize git and commit:
   ```bash
   git init
   git add .
   git commit -m "feat: initial Digital Graveyard release"
   ```
2. Create and push to a new GitHub repository:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/digital-graveyard.git
   git branch -M main
   git push -u origin main
   ```
3. Go to [vercel.com/new](https://vercel.com/new):
   - Import your `digital-graveyard` repository.
   - In **Environment Variables**, add:
     - `DATABASE_URL`
     - `CRON_SECRET`
   - Click **Deploy**.

---

## 4. Automatic Cron Configuration

Vercel will automatically read `vercel.json` and schedule the daily automated timeout check:
- **Path**: `/api/cron/timeout-check`
- **Schedule**: Every day at midnight UTC (`0 0 * * *`)
- **Action**: Deterministically checks for 14-day taker timeouts and 7-day owner review timeouts.
