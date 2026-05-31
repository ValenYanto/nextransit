# NexTransit AI

> **AI Open Innovation Challenge 2026** — Case 2: Public Transit Optimization and Intermodal Connectivity
> Case Provider: DISHUB DKI Jakarta

NexTransit is an AI-powered public transportation web application for the Greater Jakarta area. It helps everyday commuters find routes, track vehicles in real time, see crowd levels, and get boarding recommendations — across TransJakarta, MRT Jakarta, LRT Jabodebek, and Feeder buses.

---

## Features

### Passenger
- **Mode-first route browser** — pick your transport mode, then find your route
- **Live tracking map** — real-time vehicle positions on OpenStreetMap (CartoDB Voyager tiles)
- **Per-stop ETA** — see which bus/train is coming to each stop and how many minutes away (Mitra Darat style)
- **Crowd level** — Low / Moderate / High with boarding advice
- **Journey planner** — enter origin and destination, get route options (fastest / least crowded / fewer transfers)
- **GPS location** — nearest stop detection, distance to stops
- **Transfer suggestions** — interchange info between TransJakarta, MRT, and LRT

### Operator / Admin
- **Live map** — real-time fleet overview
- **Route management** — create and manage corridors
- **Fleet management** — vehicles with occupancy bars and status
- **Visual path builder** — click on the map to build route geometry; bus/feeder routes auto-snap to roads via OSRM
- **Stop management** — click map to add stops
- **Schedule management** — stop order and timing
- **Simulator** — advance vehicles along routes for testing
- **Case alignment** — DISHUB Case 2 documentation

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14+ (App Router) |
| Language | TypeScript |
| Auth | NextAuth v4 (Credentials) |
| Database | PostgreSQL |
| ORM | Prisma |
| Styling | Tailwind CSS + shadcn/ui |
| Map | React Leaflet + OpenStreetMap |
| Road routing | OSRM (open-source, no API key needed) |
| Icons | lucide-react |
| Theme | next-themes (light + dark) |

---

## Demo Accounts

| Email | Password | Role |
|---|---|---|
| `admin@nextransit.ai` | `password123` | ADMIN |
| `operator@nextransit.ai` | `password123` | OPERATOR |
| `user@nextransit.ai` | `password123` | USER |

---

## Active Demo Routes

| Code | Route | Mode | Notes |
|---|---|---|---|
| K1 | Blok M – Kota | TransJakarta | OSRM road geometry |
| K6 | Ragunan – Dukuh Atas | TransJakarta | OSRM road geometry |
| FDR-CAMPUS | Feeder Campus – Lebak Bulus | Feeder Bus | OSRM road geometry |
| MRT-NS | MRT North-South Line | MRT Jakarta | Curated rail geometry |
| LRT-DJ | LRT Dukuh Atas – Jati Mulya | LRT Jabodebek | Curated rail geometry |

---

## Getting Started (Local Development)

### Prerequisites

- Node.js 18+
- PostgreSQL 14+ running locally (or a remote PostgreSQL URL)
- npm or yarn

### 1. Clone the repository

```bash
git clone https://github.com/YOUR_USERNAME/nextransit.git
cd nextransit
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# Your PostgreSQL connection string
DATABASE_URL="postgresql://postgres:yourpassword@localhost:5432/nextransit"

# Generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-random-secret-at-least-32-characters"

# Local development
NEXTAUTH_URL="http://localhost:3000"

# Leave as SIMULATION for local dev
REALTIME_PROVIDER=SIMULATION
GTFS_RT_VEHICLE_POSITIONS_URL=
```

> **Note on `GTFS_RT_VEHICLE_POSITIONS_URL`:** This is reserved for future integration with official GTFS-Realtime feeds from TransJakarta/MRT/LRT operators. For this MVP, leave it empty and keep `REALTIME_PROVIDER=SIMULATION`. Vehicle positions are simulated from the database.

### 4. Set up the database

```bash
# Generate Prisma client
npx prisma generate

# Create all tables
npx prisma db push

# Seed with demo data (routes, stops, vehicles, users)
npx prisma db seed
```

Expected seed output:
```
🌱 Seeding NexTransit database...
✅ Modes created
✅ Stops created
✅ Routes created
✅ Vehicles created
✅ Users created
🎉 Seed complete!

Demo accounts:
  admin@nextransit.ai    / password123  (ADMIN)
  operator@nextransit.ai / password123  (OPERATOR)
  user@nextransit.ai     / password123  (USER)
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
nextransit/
├── app/                        # Next.js App Router pages
│   ├── page.tsx                # Landing page (public)
│   ├── login/                  # Login page
│   ├── register/               # Register page
│   ├── passenger/
│   │   ├── dashboard/          # Passenger dashboard
│   │   └── routes/[routeId]/   # Live route tracking
│   ├── dashboard/              # Operator/admin panel
│   │   ├── modes/
│   │   ├── routes/
│   │   ├── stops/
│   │   ├── fleet/
│   │   ├── schedules/
│   │   ├── path-builder/
│   │   ├── interchanges/
│   │   ├── predictions/
│   │   ├── simulator/
│   │   └── case-alignment/
│   └── api/                    # API routes
│       ├── passenger/
│       ├── admin/
│       └── simulator/
├── components/                 # Reusable components
│   ├── ui/                     # Base UI components
│   ├── layout/                 # Header, sidebar, etc.
│   ├── passenger/              # Passenger-specific components
│   └── admin/                  # Admin-specific components
├── lib/
│   ├── prisma.ts               # Prisma client instance
│   └── generated/prisma/       # Generated Prisma client (auto-generated)
├── prisma/
│   ├── schema.prisma           # Database schema
│   └── seed.ts                 # Seed script
├── types/                      # TypeScript type definitions
├── auth.ts                     # NextAuth configuration
├── middleware.ts               # Route protection
└── .env.example                # Environment variable template
```

---

## Database Reset

To reset the database and re-seed from scratch:

```bash
# Drop and recreate all tables, then seed
npx prisma db push --force-reset
npx prisma db seed
```

---

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `NEXTAUTH_SECRET` | ✅ | Random secret for session encryption (min 32 chars) |
| `NEXTAUTH_URL` | ✅ | Full URL of your app (`https://yourapp.vercel.app` in production) |
| `REALTIME_PROVIDER` | ✅ | `SIMULATION` (default) or `GTFS_RT` |
| `GTFS_RT_VEHICLE_POSITIONS_URL` | ❌ | Only needed if `REALTIME_PROVIDER=GTFS_RT` |

---

## License

Built for AI Open Innovation Challenge 2026 — Case 2: Public Transit Optimization and Intermodal Connectivity, DISHUB DKI Jakarta.