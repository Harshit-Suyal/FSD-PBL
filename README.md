# FSD-PBL: Gig Platform – Semester 6 PBL Project

**Phase 2 Completion: 60% | Academic Project**

---

## 👥 Team Members (Semester 6)
- Harshit Suyal
- Manas Joshi
- Aishwary Bisht
- Saumya Pratap Singh

---

## 📚 Overview

This project, developed as part of our sixth-semester curriculum, aims to build a collaborative gig platform that bridges clients and freelancers for project-based work. As of Phase 2, the core user functionality is in place with fundamental workflows underway. Our broader goal is to provide a responsive, efficient, and secure experience for both clients and gig workers, drawing on real-world marketplace needs.

---

## 🌟 Current Status

- **Overall progress:** ~60%. This README covers completed features; several modules, including advanced workflows and real-time features, are scheduled for Phase 3.
- **Platform:** The project is split into backend and frontend modules (`gig-platform-backend/` and `gig-platform-frontend/`).

---

## 🚀 Core Functionality (Phase 2)

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

## 📁 Project Structure

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

## 🧩 Environment Setup

- **Node.js >= v14**
- **npm >= v6**
- (Optional: MongoDB/MySQL running locally or via cloud)

Create `.env` in `gig-platform-backend/` with:
```
PORT=5000
DB_CONNECTION=your_db_link
JWT_SECRET=your_secret_key
```

Frontend config:  
- Add `REACT_APP_API_URL=http://localhost:5000` in `.env` if needed.

---

## ⚠️ Edge Cases Handled (Phase 2)

- **Unique Account Enforcement:** Duplicate registrations by email blocked.
- **Data Validation:** Forms validate required fields and basic input types.
- **API Error Guarding:** Graceful messages for failed API calls (e.g., offline DB).
- **Unauthorized Redirects:** Protected pages reroute unauthenticated visitors.
- **Basic Proposal Restrictions:** No double submissions on same gig.

---

## 🚩 Known Limitations / Next Challenges

- **No integrated payments yet:** All transaction logic is mocked, not real.
- **No real-time communication:** Chat & notifications coming in next phase.
- **Basic admin/moderation:** User/content reporting pending.
- **Edge case expansion:** Handling disputes and timeouts will be added soon.

---

## 📝 Notes

- This is an academic, learning-focused project—feedback and learning are ongoing.
- Please create issues or submit PRs for improvements or questions.
- Documentation will update as new features land.

---

**Last updated:** March 2026
