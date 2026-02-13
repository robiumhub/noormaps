# Noormaps Deployment Guide

This guide covers how to deploy the Noormaps application to Google Cloud Run and sync the database with Cloud SQL.

## 1. Updating the Application
When you make changes to the code, follows these steps to deploy:

```bash
# Set your Gemini API key locally (if not set in .bashrc)
export GEMINI_API_KEY="..."

# Deploy to Cloud Run
gcloud run deploy noormaps --source .
```
*Note: The first time usually requires setting environment variables, but subsequent runs will keep existing settings.*

## 2. Syncing the Database (Cloud SQL)
To sync your local schema or import fresh data to production:

### Step A: Start the Proxy
The proxy is a bridge to the cloud. Start it and leave the terminal open:
```bash
# This uses port 5433 to avoid conflicts with local Postgres
./cloud-sql-proxy --port 5433 noormaps-production:us-central1:noormaps-db
```

### Step B: Sync Schema and Data (New Tab)
In a fresh terminal tab, run:
```bash
# Point your scripts to the proxy bridge
export DATABASE_URL="postgresql://postgres:Pt36yk87..@127.0.0.1:5433/noormaps"

# Push schema changes (tables)
npm run db:push

# Import restaurant/review data
npm run script:import
```

## 3. Custom Domain
The website is live at: **[https://noormaps.com](https://noormaps.com)**

If DNS records ever need to be updated, log into **Namecheap** and verify that the 'A' records point to the IP addresses provided in the Google Cloud Console (Cloud Run > Manage Custom Domains).

## 5. Recommended Development Workflow

To keep your production data safe and your development fast, follow this pattern:

### Day-to-Day: Local Development
1.  **Work locally**: Run `npm run dev` and connect to your local Postgres (`localhost:5432`).
2.  **Test everything**: Ensure your features work perfectly on your machine first.

### Launching: Pushing Code to Production
When you are ready to update the live website:
1.  **Run the update**:
    ```bash
    gcloud run deploy noormaps --source .
    ```
    This updates the UI and logic but **does not touch your production data**.

### Maintenance: Pushing Data/Schema to Production
Only use the `cloud-sql-proxy` when you need to:
- Sync new table structures (`npm run db:push`).
- Import fresh restaurant data (`npm run script:import`).
- Run AI analysis on the live database (`npm run script:analyze`).

**IMPORTANT**: Always double-check your `DATABASE_URL` before running scripts! Pointing to `127.0.0.1:5433` targets the cloud; pointing to `localhost:5432` targets your machine.
