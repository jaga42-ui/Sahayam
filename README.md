# Sahayam - Emergency Relief & Donation Network

> A hyper-local, real-time platform connecting those in need with community heroes.

## 1. Project Overview

**Sahayam** is a full-stack disaster relief, emergency response, and community donation platform. It solves the critical problem of delayed emergency assistance by instantly connecting people in need—whether for blood donations, food supplies, or emergency rescues—with nearby users willing to help. 

**Who it is for:**
- **Requesters:** Individuals or communities facing emergencies, resource shortages, or critical medical needs.
- **Donors/Heroes:** Community members, verified volunteers, and local organizations ready to provide assistance.

---

## 2. Key Features

- **Smart Emergency Routing (Blood Radar):** Location-based SOS broadcasting that pings nearby donors. If initial responders fail to answer, a background cron job dynamically expands the search radius.
- **Real-Time Communication:** Instant, direct messaging between requesters and donors powered by Socket.io to coordinate logistics.
- **Community Marketplace:** Users can post requests for items (e.g., food, clothing) or list available items for donation.
- **Smart Assistant:** Integrates Google's Gemini AI to process SOS requests naturally and generate "Hero Stories" to boost community morale.
- **Gamification & Leaderboard:** A point-based rank system that rewards users for active participation and successful fulfilled requests.
- **Admin Command Center:** A powerful dashboard for administrators to view activity heatmaps, resolve reports, manage users, and broadcast system-wide alerts.
- **Dual-Role System:** Users can seamlessly toggle between "Requester" and "Donor" profiles.

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
- **Background Processes:** Scheduled cron jobs run independently on the server to clean up stale requests (e.g., expired food donations) and manage the automated radius expansion for unanswered SOS blasts.
- **Media Storage:** Images (user avatars, donation photos) are offloaded directly to Cloudinary via Multer.

---

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
   cd hope-link
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
Create a `.env` file in the `frontend` directory:
```env
VITE_API_URL=http://localhost:5000
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_firebase_auth_domain
VITE_FIREBASE_PROJECT_ID=your_firebase_project_id
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
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

1. **Sign Up:** User registers and selects their primary role (Requester or Donor).
2. **Post a Request / SOS:** A user in need drops a pin on the map and submits an SOS (e.g., Blood needed urgently).
3. **Smart Routing:** The system calculates the radius and sends push notifications/emails to nearby available donors.
4. **Acceptance:** A donor clicks "Accept" on the notification, immediately opening a secure, real-time chat with the requester.
5. **Fulfillment:** Once the help is provided, the request is marked as "Fulfilled," and the donor receives leaderboard points and a generated AI "Hero Story."

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
