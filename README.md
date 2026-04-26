# FSD-PBL: Gig Platform – Semester 6 PBL Project

**Phase 2 Completion: 80% | Academic Project**

---

## Team Members (Semester 6)
- Harshit Suyal
- Manas Joshi
- Aishwary Bisht
- Saumya Pratap Singh

---

##  Overview

This project, developed as part of our sixth-semester curriculum, aims to build a collaborative gig platform that bridges clients and freelancers for project-based work. As of Phase 2, the core user functionality is in place with fundamental workflows underway. Our broader goal is to provide a responsive, efficient, and secure experience for both clients and gig workers, drawing on real-world marketplace needs.

---

##  Current Status

- **Overall progress:** ~60%. This README covers completed features; several modules, including advanced workflows and real-time features, are scheduled for Phase 3.
- **Platform:** The project is split into backend and frontend modules (`gig-platform-backend/` and `gig-platform-frontend/`).

---

##  Core Functionality (Phase 2)

### Main Features Delivered
- **User Registration & Login:** Secure signup and login for both clients and freelancers.
- **Gig Posting:** Clients can list new gigs with project requirements.
- **Profile Management:** Both user types can manage basic profiles.
- **Gig Browsing:** Freelancers can search and filter posted gigs.
- **Proposal Submission:** Freelancers can apply for gigs with initial proposals.
- **Role-based Access:** Views and permissions adapt dynamically to user type.

### In Progress / Next Phase
- Real-time chat and notifications
- Payment integration & secure transaction management
- Advanced admin tools and analytics
- Ratings/reviews for quality assurance
- Milestone tracking and lifecycle management

---

## 🛠️ Tech Stack

- **Frontend:** JavaScript (ES6+), HTML5, CSS3  
  - Directory: `gig-platform-frontend/`
  - Approach: Component-driven, responsive, mobile-friendly UI
- **Backend:** Node.js (RESTful API)
  - Directory: `gig-platform-backend/`
  - Includes: Routing, business controllers, authentication middleware
  - Database: (Plug-in your choice; MongoDB/MySQL recommended)
- **Other Tools:** Git for version control, npm for dependency management

---

## 🖥️ Development Setup

```bash
# Clone the repository:
git clone https://github.com/Harshit-Suyal/FSD-PBL.git
cd FSD-PBL

# Start backend:
cd gig-platform-backend
npm install
npm start

# Start frontend (in a new terminal window/tab):
cd ../gig-platform-frontend
npm install
npm start
```

- By default, backend runs on [http://localhost:5000](http://localhost:5000), frontend on [http://localhost:3000](http://localhost:3000).

---

## Project Structure

```
FSD-PBL/
├─ gig-platform-backend/
│  ├─ routes/         # API endpoints
│  ├─ controllers/    # Logic & handlers
│  ├─ models/         # Data schemas
│  └─ middleware/     # Auth/Validation
├─ gig-platform-frontend/
│  ├─ components/     # UI elements
│  ├─ pages/          # Main views
│  ├─ styles/         # CSS & themes
│  └─ services/       # API requests
└─ .gitignore
```

---

##  Environment Setup


Create `.env` in `gig-platform-backend/` with:
```
PORT=5000
DB_CONNECTION=your_db_link
JWT_SECRET=your_secret_key
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
CLIENT_URL=http://localhost:5173
```

Frontend config:  
- Add `REACT_APP_API_URL=http://localhost:5000` in `.env` if needed.

---
## Frontend → Backend Data Flow (How data travels)

This project uses a **REST API architecture**:

- **Frontend:** React (Vite) sends HTTP requests using **Axios**
- **Backend:** Node.js + **Express** receives requests and routes them to controllers
- **Database:** **MongoDB** via **Mongoose**
- **Auth:** JWT tokens sent in `Authorization` header

---

### 1) Frontend makes API requests (Axios)

All API calls are centralized in:

- `gig-platform-frontend/src/services/api.js`

Examples of frontend → backend requests:

**Auth**
- `registerUser(data)` → `POST /users/register`
- `loginUser(data)` → `POST /users/login`

**Gigs**
- `getGigs(params)` → `GET /gigs`
- `createGig(data)` → `POST /gigs`
- `markGigPaymentDone(id)` → `PUT /gigs/:id/payment`

**Chat**
- `getGigMessages(gigId)` → `GET /chat/:gigId`
- `sendGigMessage(gigId, data)` → `POST /chat/:gigId`

These functions send/receive data as JSON.

---

### 2) JWT token is attached automatically

In `gig-platform-frontend/src/services/api.js`, Axios request interceptor:

- Reads token from `localStorage`
- Adds it to every request header automatically:

```
Authorization: Bearer <token>
```

This is how backend can identify the logged-in user for protected APIs.

---

### 3) Backend receives requests in Express (`server.js`)

Backend entry point:

- `gig-platform-backend/server.js`

Key things it does:
- `app.use(express.json())`  
  Parses incoming JSON body and makes it available as `req.body`

Mounted routes:
- `/api/users` → user routes
- `/api/gigs` → gig routes
- `/api/chat` → chat routes

So a frontend request like `POST /chat/:gigId` becomes:

`POST /api/chat/:gigId` on the backend.

---

### 4) Routes forward requests to controllers

Example (chat):

`gig-platform-backend/routes/chatRoutes.js`
- `GET /:gigId` → `getGigMessages`
- `POST /:gigId` → `sendGigMessage`

This decides which controller handles the request.

---

### 5) Middleware verifies token (protected routes)

Protected routes use `protect` middleware (JWT auth).

Typical flow:
- reads `Authorization` header
- verifies JWT
- sets `req.user` (ex: `req.user.id`, `req.user.role`)
- controller uses `req.user` for access control

---

### 6) Controllers do logic + DB work (Mongoose)

Controllers read:
- `req.body` (POST/PUT JSON)
- `req.params` (URL parameters)
- `req.user` (authenticated user info)

Then they use Mongoose models to interact with MongoDB and return response JSON using `res.json(...)`.

---

## Chat (Current Implementation)

###  Current chat is REST-based + Socket.IO enabled
Chat still has normal API endpoints, but the backend now also emits live Socket.IO updates:

- `GET /api/chat/:gigId` → fetch chat messages for a gig
- `POST /api/chat/:gigId` → send a message (stored in DB)

Backend files:
- `gig-platform-backend/routes/chatRoutes.js`
- `gig-platform-backend/controllers/chatController.js`
- `gig-platform-backend/models/Message.js`

### Not real-time yet (no Socket.IO wiring)
REST remains available as a fallback, but live messaging and notification events are now pushed through Socket.IO.

---

##  Payments (Current Implementation)

### Payment now uses Razorpay order creation and backend verification
Razorpay is integrated for order creation and signature verification.

What exists right now:
- Payment data is stored in MongoDB using:
  - `gig-platform-backend/models/Payment.js`

How payment happens in the UI:
- Client clicks **“Pay with Razorpay”** from the gig page
- Frontend creates an order, opens Razorpay Checkout, then verifies the payment signature
- Backend stores the payment record and updates the gig/payment status after verification

So this is now a **verified payment flow** instead of a manual toggle.

---

##  Summary
- **Unique Account Enforcement:** Duplicate registrations by email blocked.
- **Data Validation:** Forms validate required fields and basic input types.
- **API Error Guarding:** Graceful messages for failed API calls (e.g., offline DB).
- **Unauthorized Redirects:** Protected pages reroute unauthenticated visitors.
- **Basic Proposal Restrictions:** No double submissions on same gig.

---

## Known Limitations / Next Challenges

- **Real payments added:** Razorpay handles order creation and verification.
- **Real-time communication added:** chat and notifications now use Socket.IO.

---

**Last updated:** March 2026
