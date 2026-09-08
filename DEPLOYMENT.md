# VOCNIX — PRODUCTION VERCEL & GLOBAL DEPLOYMENT GUIDE

This document guides you through deploying the **VocNix Real-Time Audio Platform** to **Vercel** for a globally accessible production URL.

---

## 1. Prerequisites for Global Live Audio

Because Vercel hosts serverless web applications, WebRTC audio streams (LiveKit SFU) must connect to a globally accessible WebRTC endpoint:
- **LiveKit Cloud (Recommended & Free)**:
  1. Sign up for free at [cloud.livekit.io](https://cloud.livekit.io).
  2. Create a new project (provides 50 GB free WebRTC audio streaming/month).
  3. In **Project Settings → Keys**, copy your:
     - `LIVEKIT_URL` (e.g., `wss://your-project.livekit.cloud`)
     - `LIVEKIT_API_KEY`
     - `LIVEKIT_API_SECRET`

---

## 2. Deploying via Vercel CLI (Quickest)

Open PowerShell or Command Prompt in the project folder (`c:\Users\anand\OneDrive\Desktop\project 1`) and run:

```bash
# Step 1: Log in to your Vercel account (opens browser to authenticate)
npx vercel login

# Step 2: Deploy to Vercel production
npx vercel --prod
```

During the prompt, accept the default settings:
- **Set up and deploy?**: `Y`
- **Which scope?**: Choose your personal or team account
- **Link to existing project?**: `N`
- **Project name**: `vocnix-platform`
- **Directory**: `./`
- **Want to modify settings?**: `N`

---

## 3. Deploying via GitHub & Vercel Dashboard (Recommended for Continuous Deployment)

1. **Create a GitHub Repository**:
   - Create a new repository on GitHub (e.g. `vocnix-platform`).

2. **Push your code to GitHub**:
   ```bash
   git remote add origin https://github.com/<your-username>/vocnix-platform.git
   git branch -M main
   git push -u origin main
   ```

3. **Import to Vercel**:
   - Go to [vercel.com/new](https://vercel.com/new).
   - Select your `vocnix-platform` repository.
   - Framework preset: **Next.js** (auto-detected).
   - Add the Environment Variables (see Section 4).
   - Click **Deploy**.

---

## 4. Production Environment Variables (Set in Vercel Settings)

In your Vercel Project under **Settings → Environment Variables**, add:

| Variable | Example / Description |
| :--- | :--- |
| `NEXT_PUBLIC_APP_URL` | `https://your-project.vercel.app` |
| `NODE_ENV` | `production` |
| `LIVEKIT_URL` | `wss://<your-project>.livekit.cloud` |
| `LIVEKIT_API_KEY` | Your LiveKit API key |
| `LIVEKIT_API_SECRET` | Your LiveKit API secret |
| `NEXT_PUBLIC_LIVEKIT_URL` | `wss://<your-project>.livekit.cloud` |
| `NEXT_PUBLIC_SUPABASE_URL` | `https://<your-project>.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | Your Supabase service role key |
| `SESSION_SECRET` | Any 32-character random string |

---

## 5. Global Verification

Once deployed, your live platform will be available worldwide:
- **Homepage**: `https://<your-project>.vercel.app`
- **Audience Listener (Global)**: `https://<your-project>.vercel.app/listen/<token>`
- **Translator Room (Global)**: `https://<your-project>.vercel.app/translator/room/<token>`
- **Tenant Dashboard**: `https://<your-project>.vercel.app/dashboard`
- **Super Admin Console**: `https://<your-project>.vercel.app/admin`
- **Diagnostics API**: `https://<your-project>.vercel.app/api/health`
