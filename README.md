# VocNix — Production Real-Time Audio Translation Platform

[![Next.js](https://img.shields.io/badge/Next.js-14.2.15-black?style=flat&logo=next.js)](https://nextjs.org/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC%20SFU-00D26A?style=flat)](https://livekit.io/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?style=flat&logo=typescript)](https://www.typescriptlang.org/)
[![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?style=flat&logo=tailwind-css)](https://tailwindcss.com/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](bin/LICENSE)

**VocNix** is a production-grade, multi-tenant SaaS platform engineered for **real-time, audio-only human translation** across global conferences, summits, and multilingual broadcasts. Built without prototypes, synthetic AI voices, or simulated streams, VocNix provides a sub-second latency WebRTC infrastructure connecting live human translators directly to worldwide audience members.

---

## Architecture Overview

```
+---------------------+           +------------------------+
| Human Translator    |           | Worldwide Audience     |
| (Browser Mic Input) |           | (Any Web Browser)      |
+----------+----------+           +-----------+------------+
           |                                  ^
  Real-Time MediaStream                       | Live WebRTC Audio Track
  Echo/Noise Cancellation                     | "Tap to Listen" Autoplay
           v                                  |
+---------------------+           +-----------+------------+
|  Translator Portal  |           |    Audience Portal     |
|  /translator/room/  |           |     /listen/<token>    |
|   <secure_token>    |           |  (No Login / No App)   |
+----------+----------+           +-----------+------------+
           |                                  ^
   Server-minted JWT                          | Restricted Subscriber JWT
  (canPublish: true)                          | (canPublish: false)
           v                                  |
    +------------------------------------------------+
    |               LIVEKIT SFU ENGINE               |
    |          Dynamic WebRTC Language Room          |
    |          (e.g., evt_ab12_lang_ta)             |
    +------------------------------------------------+
                           ^
                           | Dynamic Provisioning
    +----------------------+-------------------------+
    |         POSTGRESQL & NEXT.JS 14 BACKEND        |
    |  - Authoritative Duration & Usage Billing      |
    |  - Multi-Tenant RLS Data Model (16 Entities)   |
    |  - Tenant Console & Super Admin Command Center |
    +------------------------------------------------+
```

---

## Key Features

### 1. Dynamic Language Rooms (Zero Hardcoding)
- Translation channels are generated dynamically at runtime from database records.
- Scheduling an event with Tamil, Hindi, and French automatically mints isolated WebRTC rooms (`evt_<id>_lang_<code>`).
- Strict cryptographic token scoping guarantees **zero cross-language audio leakage**.

### 2. Real-Time WebRTC Audio Engine
- Captures browser microphone MediaStream with acoustic echo cancellation, noise suppression, and auto-gain control.
- Live **RMS Audio VU Meter** gives translators real-time visual feedback on speech amplitude.
- **Pause & Resume**: Pausing mutes the audio track while maintaining the WebRTC peer connection so listeners receive silence instead of an abrupt disconnection.
- **Audio-Only & Human Only**: Strictly designed for human translation; no AI synthetic audio and no video overhead.

### 3. Frictionless Audience Experience
- **No Login, No Account, No App**: Audience members open a link or scan an auto-generated QR code.
- **Browser Autoplay Compliant**: Explicit **"TAP TO LISTEN"** user interaction unlocks browser audio playback seamlessly.
- Dynamic language switcher connects listeners to their preferred channel in real time.

### 4. Tenant Organization Console
- Schedule and edit events, update status (`scheduled`, `live`, `ended`).
- Dynamically add or remove language channels on existing events.
- Manage translator directories and assign translators to language channels.
- Generate copyable links and high-resolution **QR Codes (PNG download)**.
- Monitor live connected listeners and authoritative translation minute consumption vs. plan quotas.

### 5. Role 1 — Super Admin Platform Command Center
- Global governance for the platform owner:
  - **Platform Revenue & MRR**: Monitor Monthly Recurring Revenue and total invoiced revenue.
  - **All Organizations**: View, search, inspect, suspend, or reactivate any tenant account.
  - **Active Broadcasts**: Real-time monitoring of live events across all organizations.
  - **Subscription Controls**: Switch tenant tiers (Starter, Pro, Enterprise Ultra) and extend customer trials (+30 days).

---

## Project Structure

```
├── app/
│   ├── admin/page.tsx               # Super Admin Command Center (Role 1)
│   ├── api/
│   │   ├── admin/                   # Platform overview, organizations, suspensions
│   │   ├── audience/leave/          # Dynamic listener decrement on disconnect
│   │   ├── billing/                 # Plans, subscriptions, and invoices
│   │   ├── dashboard/stats/         # Tenant dashboard metrics
│   │   ├── events/                  # Event CRUD & dynamic language channels
│   │   ├── health/                  # Health check & diagnostics endpoint
│   │   ├── livekit/                 # Server-minted JWT tokens (publisher/subscriber)
│   │   ├── organization/            # Tenant profile & slug settings
│   │   ├── sessions/                # Translator broadcast lifecycle (pause/resume/stop)
│   │   └── translators/             # Translator roster directory
│   ├── dashboard/page.tsx           # Tenant Organization Console
│   ├── listen/[eventToken]/page.tsx # Audience Live Listening Portal
│   ├── translator/room/[token]/     # Translator Broadcast Console
│   ├── layout.tsx                   # Top navigation bar
│   └── page.tsx                     # Landing page & platform architecture
├── components/
│   └── QRCodeModal.tsx              # Audience QR code generator & PNG download
├── lib/
│   ├── audio/AudioService.ts        # Unified LiveKit WebRTC client & VU meter engine
│   ├── db/
│   │   ├── repository.ts            # Database repository & multi-tenant logic
│   │   └── supabase.ts              # Supabase PostgreSQL client & health checks
│   ├── livekit/tokenService.ts      # Server-side JWT token generation & grants
│   └── logger/logger.ts             # Structured logging without leaking credentials
├── supabase/
│   └── migrations/
│       └── 001_initial_schema.sql   # 16-entity production schema with RLS
├── test_e2e_platform.mjs            # 10-point automated end-to-end integration test
├── test_super_admin.mjs             # Super Admin automated verification test
└── vercel.json                      # Vercel deployment configuration
```

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/raksha932/VocNix.git
cd VocNix
npm install
```

### 2. Environment Configuration

Copy the sample environment file:

```bash
cp .env.example .env.local
```

Configure your credentials:
```env
# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# LiveKit WebRTC Configuration
# For local dev: ws://127.0.0.1:7880
# For LiveKit Cloud: wss://<your-project>.livekit.cloud
LIVEKIT_URL=ws://127.0.0.1:7880
LIVEKIT_API_KEY=devkey
LIVEKIT_API_SECRET=secret
NEXT_PUBLIC_LIVEKIT_URL=ws://127.0.0.1:7880

# Supabase Database Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Run LiveKit Server (Local WebRTC SFU)

If testing locally on Windows:
```bash
.\bin\livekit-server.exe --dev
```
*(Or use [LiveKit Cloud](https://cloud.livekit.io) which offers a free tier with zero installation required).*

### 4. Run Next.js Application

```bash
# Development mode
npm run dev

# Or Production build & run
npm run build
npm start
```

Access the application:
- **Homepage**: [http://localhost:3000](http://localhost:3000)
- **Tenant Dashboard**: [http://localhost:3000/dashboard](http://localhost:3000/dashboard)
- **Super Admin Console**: [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Diagnostics**: [http://localhost:3000/api/health](http://localhost:3000/api/health)

---

## Automated Verification Tests

VocNix includes complete automated end-to-end testing suites:

```bash
# Test 1: Full E2E Platform Test (10 acceptance checks)
node test_e2e_platform.mjs

# Test 2: Super Admin Platform Owner Test
node test_super_admin.mjs
```

---

## Production Deployment (Vercel)

VocNix is configured for instant deployment on [Vercel](https://vercel.com):

1. Push your repository to GitHub.
2. In the Vercel dashboard, click **"Add New Project"** and import the repository.
3. In **Settings → Environment Variables**, add your production variables (`LIVEKIT_URL`, `LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `NEXT_PUBLIC_LIVEKIT_URL`, `NEXT_PUBLIC_APP_URL`).
4. Click **Deploy**.

For detailed deployment instructions, refer to [`DEPLOYMENT.md`](./DEPLOYMENT.md).

---

## License

MIT License. Built for production-grade real-time human audio translation.
