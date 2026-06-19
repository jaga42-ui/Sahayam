# Sahayam — find a blood donor, closer than you think

> A real-time network that connects blood emergencies with verified, compatible donors nearby. Raise an SOS and reach the right donors in seconds.

**🩸 Live demo:** [sahayam-beta.vercel.app](https://sahayam-beta.vercel.app)

> ⏳ **Heads up:** the API runs on a free tier and sleeps when idle — the first request after a quiet spell can take ~30–50s to wake. Give it a moment on the first load.

**Stack:** React 19 · Vite · Tailwind v4 · Node/Express · MongoDB · Socket.io · Leaflet · Gemini

---

## Screenshots

> _Add 2–4 screenshots/GIFs here — the Blood Radar map, an SOS in flight, and the dashboard make the strongest first impression._
>
> ```
> ![Blood Radar](docs/screenshots/radar.png)
> ![SOS escalation](docs/screenshots/sos.gif)
> ```

---

## 1. Project Overview

**Sahayam** is a full-stack, real-time blood-donor matching platform. It solves the critical problem of delayed blood emergencies by instantly connecting a requester with verified, compatible, eligible donors nearby — and automatically widening the search until enough donors confirm.

**Who it is for:**
- **Requesters:** Patients and families facing a time-critical blood need.
- **Donors:** Verified community members who can be alerted the moment a compatible request appears near them.

---

## 2. Key Features

- **Blood Radar (smart emergency routing):** Location-based SOS that pings only compatible, eligible donors nearby. If nobody responds at a level, a cron-driven escalation engine widens the radius and pings a *fresh* ring of donors — never re-pinging anyone.
- **Medically-correct matching:** A single matching path enforces blood-group compatibility (O− universal donor, AB+ universal recipient) and a 90-day donor cooldown everywhere it's used.
- **Real-Time Communication:** Private, direct messaging between requester and donor over Socket.io — no phone number exposed in a public forward.
- **Smart Assistant:** Google Gemini turns a natural-language description of the emergency into a structured SOS (blood group, location, urgency).
- **Correctness guarantees:** Atomic donor claim (exactly one hero wins a race, the rest get a clean 409) and at-least-once delivery over push *and* email.
- **Admin Command Center:** Dashboard for activity heatmaps, engine metrics (fill rate, time-to-first-response), moderation, and system-wide broadcasts.

---

## 3. Tech Stack

**Frontend**
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS v4, Framer Motion (for animations)
- **Maps:** Leaflet & React-Leaflet
- **State/Routing:** React Router DOM
- **Other:** Firebase (Auth/Push notifications), Socket.io-client, Recharts

**Backend**
- **Framework:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ODM)
- **Real-Time:** Socket.io
- **Security:** Helmet, Express Rate Limit, Mongo Sanitize, XSS Clean
- **AI/External APIs:** Google Generative AI (Gemini), Cloudinary (Image storage), Nodemailer, Web-push
- **Background Jobs:** Node-cron

**Deployment Platforms**
- **Frontend:** Vercel (configured via `vercel.json`)
- **Backend:** Render (or any Node.js hosting, proxy trusted)

---

## 4. Architecture Overview

Sahayam operates on a decoupled client-server architecture:
- **Frontend (SPA):** Built with Vite and React, it handles complex UI states (maps, real-time chat, dashboards) and communicates with the backend via RESTful APIs and WebSocket connections.
- **Backend (API):** A monolithic Express server that handles business logic, MongoDB database interactions, JWT-based authentication, and AI integrations.
- **Background Processes:** Scheduled cron jobs run independently on the server to expire stale SOS requests and drive the automated radius expansion for unanswered blasts (guarded by a distributed `CronLock` so it stays correct across instances).
- **Media Storage:** Images (user avatars, donation photos) are offloaded directly to Cloudinary via Multer.

---

## 4a. The Routing Engine (core technical highlight)

The heart of Sahayam is a **real-time emergency blood-donor routing engine**. A single, unified matching path serves every caller — the radar map, the emergency blast, the escalation cron, and emergency listings — so matching is consistent and medically correct everywhere.

**Donor matching** (`services/donorMatching.js`) runs a `$geoNear` aggregation that returns donors already sorted by distance (with a real `distance` field for the map). A candidate must be a compatible blood group, **eligible** (whole-blood donors are locked out for 90 days after donating), available, within radius, and not already pinged.

**Blood compatibility** (`utils/bloodCompat.js`) is the single source of truth — the recipient/donor matrix (O− universal donor, AB+ universal recipient). Unit-tested in `tests/bloodCompat.test.js`.

**Escalation state machine** (`services/escalationEngine.js`) — an SOS is a timeout-driven state machine, not a fixed broadcast:

![SOS escalation state machine](docs/escalation-engine.svg)

If nobody responds at a level, a cron tick widens the radius and pings a **fresh** ring of donors (never re-pinging anyone — this is the idempotency guarantee). The cron is guarded by a distributed `CronLock` so it stays correct across horizontally-scaled instances.

**Correctness guarantees**
- **Atomic claim** — when two heroes accept the same SOS simultaneously, a conditional `findOneAndUpdate` lets exactly one win; the loser gets a clean `409`.
- **At-least-once delivery** — `utils/notify.js` fans out over push *and* email; for a life-critical alert, receiving both is the safe failure mode.

**Observability** — `GET /api/admin/engine-metrics` reports fill rate, median time-to-first-response, and escalation-depth distribution.

**Demo** — `node scripts/seedDonors.js` scatters 200 synthetic donors (varied blood groups, ~20% on cooldown) around a city so the radar and escalation are visible end-to-end. Wipe with `--clear`.

## 5. Setup Instructions (Developer Guide)

### Prerequisites
- Node.js (v18+)
- MongoDB connection URI (e.g., MongoDB Atlas)
- Cloudinary Account (for image uploads)
- Firebase Project setup (for push notifications)
- Google Gemini API Key

### Installation Steps

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Sahayam
   ```

2. **Install Backend Dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install Frontend Dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

### Environment Variables

**Backend (`backend/.env`)**
Create a `.env` file in the `backend` directory:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
FRONTEND_URL=http://localhost:5173
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret
GEMINI_API_KEY=your_google_gemini_api_key
# VAPID keys for Web-Push
VAPID_PUBLIC_KEY=your_vapid_public
VAPID_PRIVATE_KEY=your_vapid_private
VAPID_EMAIL=mailto:admin@example.com
```

**Frontend (`frontend/.env`)**
Create a `.env` file in the `frontend` directory (see `frontend/.env.example`):
```env
# Backend API base URL — MUST include the /api suffix
VITE_BACKEND_URL=http://localhost:5000/api
VITE_GOOGLE_CLIENT_ID=your_google_client_id
VITE_VAPID_PUBLIC_KEY=your_vapid_public_key
# Optional — only used to label your city on the radar
VITE_MAPBOX_TOKEN=your_mapbox_token
```

### Running Locally

Open two terminal windows:

**Terminal 1 (Backend):**
```bash
cd backend
npm run dev
```

**Terminal 2 (Frontend):**
```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:5173` and the backend API at `http://localhost:5000`.

---

## 6. API Documentation

### Authentication (`/api/auth`)
- `POST /register` - Register a new user
- `POST /login` - Authenticate user & get JWT token
- `POST /google` - Google OAuth login
- `POST /emergency-blast` - Trigger a location-based SOS alert

### Donations & Requests (`/api/donations`)
- `GET /` - Fetch all active community donations
- `POST /` - Create a new donation/request (supports image upload)
- `GET /feed` - Get personalized, proximity-based feed
- `PATCH /:id/sos-accept` - Accept an emergency SOS request
- `POST /triage` - AI-powered triage analysis

### Real-Time Chat (`/api/chat`)
- `GET /inbox` - Fetch user's active conversations
- `GET /:donationId` - Fetch chat history for a specific request
- `POST /` - Send a message

### Admin (`/api/admin`)
- `GET /stats` - Retrieve platform metrics
- `GET /heatmap` - Retrieve geographical incident data
- `POST /broadcast` - Send platform-wide alerts

---

## 7. Usage Guide (User Flow)

1. **Sign Up:** User registers as a donor with their blood group and location.
2. **Raise an SOS:** A requester drops a pin on the map and submits an SOS (blood group, hospital, number of donors needed).
3. **Smart Routing:** The engine pings only compatible, eligible donors within the radius via push *and* email; if nobody responds, it widens and pings a fresh ring.
4. **Acceptance:** A donor accepts (atomic claim — exactly one wins per slot), immediately opening a secure, real-time chat with the requester.
5. **Fulfillment:** Donors confirm in chat, meet at the hospital, and the request is marked **Fulfilled**.

---

## 8. Design & UX Principles

- **Human-Centered & Friendly:** We've replaced complex jargon with natural, supportive language. In an emergency, every second counts, and the UI reduces friction by placing the most critical action front and center.
- **Mobile-First Layout:** Designed entirely with responsiveness in mind, featuring optimized navigation grids ensuring people on the move can access help from their smartphones.
- **Visual Urgency & Accessibility:** High-contrast color coding (e.g., Red for emergencies) safely guides user attention. A seamless, dynamic **Dark Mode** with smooth crossfade transitions ensures optimal viewing in any lighting condition.
- **Dynamic Feedback:** Features premium shimmering skeleton loaders during data fetches, micro-animations (via Framer Motion), and real-time toast notifications to assure users that the system is working for them.

---

## 9. Security Considerations

- **Bulletproof Headers:** Powered by Helmet.js to prevent common vulnerabilities.
- **Rate Limiting:** Distinct limiters for generic API calls, POST requests (spam prevention), and strict limits on authentication endpoints to prevent brute-force attacks.
- **Data Protection:** All inputs are sanitized using `express-mongo-sanitize` and `xss-clean` to prevent NoSQL injection and Cross-Site Scripting.
- **Authentication:** Secure JWT implementation with bcrypt password hashing.

---

## 10. Limitations (Known Issues)

- **Identity Verification:** Currently relies on basic admin moderation. There is no automated KYC or medical license verification for organizations yet.
- **Geospatial Precision:** Depends on browser/device HTML5 geolocation, which can occasionally be inaccurate in rural areas.
- **Background Jobs:** Cron jobs run on a single instance; this will require a distributed worker model (like BullMQ + Redis) for large-scale production.

---

## 11. Future Improvements / Roadmap

- **Redis Integration:** Offload Socket.io states and implement distributed rate-limiting for horizontal scaling.
- **Automated Verification:** Integration with third-party KYC APIs to automatically verify medical professionals and NGOs.
- **Enhanced Notifications:** SMS fallback via Twilio/Messagebird for users without reliable internet access or push-token expiration.
- **AI Expansion:** Utilize AI for automated spam detection and content moderation before posts hit the database.

---

## 12. Contribution Guidelines

1. **Fork the repo** and clone it locally.
2. **Create a feature branch:** `git checkout -b feature/your-feature-name`
3. **Commit your changes:** Follow standard conventional commits.
4. **Push to the branch:** `git push origin feature/your-feature-name`
5. **Submit a Pull Request:** Explain the scope and purpose of your feature.

*Please ensure your code passes ESLint rules and follows the existing component structure before submitting a PR.*

---

## 13. License

This project is licensed under the **ISC License**.
