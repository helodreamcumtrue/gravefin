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
1. Your project is already fully migrated to **PostgreSQL**. The production connection string is configured in `.env`:
   ```env
   DATABASE_URL="postgresql://neondb_owner:npg_vHQ8zBbadc2E@ep-shy-frost-avcr8pe6-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require"
   ```
2. In `prisma/schema.prisma`, PostgreSQL is already set as the datasource provider, with Linux binary targets pre-configured for Vercel serverless execution:
   ```prisma
   generator client {
     provider      = "prisma-client-js"
     binaryTargets = ["native", "rhel-openssl-1.0.x", "rhel-openssl-3.0.x", "debian-openssl-3.0.x"]
   }

   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. To push the schema and seed the initial testing personas locally if needed:
   ```bash
   npx prisma db push
   node prisma/seed.js
   ```

*(Note: The platform features resilient fallbacks across all REST and GraphQL endpoints, so even if `DATABASE_URL` is not yet configured in Vercel, the platform loads the preserved mock specimen catalog seamlessly).*

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
   - `GITHUB_TOKEN`: a GitHub fine-grained personal access token with read-only public repository metadata access.
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
   - Import your `gravefin` repository (`https://github.com/helodreamcumtrue/gravefin`).
   - In **Environment Variables**, add:
     - `DATABASE_URL`: `postgresql://neondb_owner:npg_vHQ8zBbadc2E@ep-shy-frost-avcr8pe6-pooler.c-11.us-east-1.aws.neon.tech/neondb?sslmode=require`
     - `CRON_SECRET`: `graveyard_secret_key`
     - `NEXT_PUBLIC_APP_NAME`: `Digital Graveyard`
     - `NEXT_PUBLIC_BASE_URL`: `https://your-project-name.vercel.app` (replace with your Vercel URL)
     - `GITHUB_TOKEN`: `<YOUR_GITHUB_PAT_OR_FINE_GRAINED_TOKEN>` (optional, for live repo autopsies)
   - Click **Deploy**.

---

## 4. Automatic Cron Configuration

Vercel will automatically read `vercel.json` and schedule the daily automated timeout check:
- **Path**: `/api/cron/timeout-check`
- **Schedule**: Every day at midnight UTC (`0 0 * * *`)
- **Action**: Deterministically checks for 14-day taker timeouts and 7-day owner review timeouts.

The same daily job refreshes only projects that already have both `githubRepoUrl` and `githubAnalyzedAt`. It uses the GitHub GraphQL API to update repository metrics, recalculate the revival score, regenerate the autopsy report, and update peak activity data.
