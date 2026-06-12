# ☕ Brew & Co. — Coffee Shop POS

A full-featured Point of Sale system built with **Next.js + TypeScript + Firebase**.

## Features

- **Menu** — Browse & filter by category (coffee, tea, cold, pastry), search, add to cart
- **Cart** — Quantity controls, customer name, payment method (Cash / Card / GCash)
- **Orders** — Real-time order queue, advance status (Pending → Preparing → Ready → Completed), cancel
- **Dashboard** — Daily revenue, order count, top items, payment breakdown, recent orders table
- **Firebase** — Firestore for real-time sync; menu auto-seeds on first run

## Setup

### 1. Firebase
1. Go to [Firebase Console](https://console.firebase.google.com) → Create project
2. Enable **Firestore Database** (start in test mode)
3. Go to Project Settings → Add Web App → copy config values

### 2. Environment
```bash
cp .env.local.example .env.local
# Fill in your Firebase credentials
```

### 3. Run
```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Firestore Collections

| Collection | Description |
|---|---|
| `menuItems` | Products (auto-seeded on first run) |
| `orders` | All orders with real-time listener |
| `counters/orders` | Auto-incrementing order number |

## Tech Stack
- Next.js 15 (App Router)
- TypeScript
- Firebase / Firestore (real-time)
- CSS (custom, no framework)
- Google Fonts: Playfair Display + DM Sans
