# FOSIECON Full-Stack Website
## Forum of State Independent Electoral Commissions of Nigeria

Built by replicating the architecture of the sibling [KOSIEC](../KOSIEC-FullStack) project: the same
Node/Express + MongoDB backend pattern and the same vanilla HTML/CSS/JS frontend shell, re-skinned and
re-modeled for FOSIECON's actual purpose. FOSIECON is a coordinating *forum* for all 36 state electoral
commissions — it doesn't run elections itself — so the Election/Candidate/Result/LGA data model from KOSIEC
was replaced with a `MemberCommission` directory (the 36 state SIECs) and the page set was rebuilt to match
the client brief (see "Source brief" below) rather than copied as-is.

---

## Tech Stack
- **Frontend:** Vanilla HTML5, CSS3, JavaScript (ES6+) — multi-file, modular, same pattern as KOSIEC
- **Backend:** Node.js + Express.js
- **Database:** MongoDB Atlas (Mongoose ODM)
- **File Storage:** Cloudinary (team photos, gallery, documents, member-commission logos)
- **Auth:** JWT + bcryptjs (12 salt rounds), account lockout after 5 failed logins, full admin audit log
- **Email:** Nodemailer (contact form notifications)

---

## Project Structure

```
FOSIECON/
├── backend/
│   ├── config/            db.js, cloudinary.js
│   ├── middleware/        auth.js, upload.js, errorHandler.js
│   ├── models/
│   │   ├── User.js            Admin / staff / member users
│   │   ├── AdminLog.js        Login & admin activity audit log
│   │   ├── MemberCommission.js  The 36 State Independent Electoral Commissions (replaces KOSIEC's LGA model)
│   │   ├── TeamMember.js      Forum Exco / Secretariat staff
│   │   ├── NewsArticle.js     Communiqués, press releases, announcements
│   │   └── SharedModels.js    Event, Download, GalleryItem, Inquiry, Testimonial, Faq, Setting
│   ├── routes/             auth.js, members.js, news.js, team.js, sharedRoutes.js
│   ├── seed.js             Seeds the 36 member commissions, admin accounts, chairman, settings, FAQs
│   └── server.js
└── frontend/
    ├── index.html           App shell — nav, ticker, all 13 page sections, modals, footer
    ├── css/main.css         Design system (dark blue + white, Arial — per client brief)
    ├── js/api.js            Centralized API client
    ├── js/router.js         Client-side routing + auth state
    └── pages/pages.js       Page loaders, renderers, form handlers, admin CMS
```

---

## Pages (per the client brief)

Home · About Us · Services · Gallery · News/Blog · Testimonials · FAQ · Team (+ the 36-member-commission
directory) · Events · Contact · Login/Register · Member Dashboard · Admin Panel/CMS · Privacy Policy & Terms.

---

## Setup Instructions

### 1. MongoDB Atlas
Create a **separate** database/user from KOSIEC's (do not reuse those credentials). See
`backend/.env.example` for the connection-string format.

### 2. Cloudinary
Same account can be reused with a different folder prefix — uploads go to `fosiecon/team`,
`fosiecon/gallery`, `fosiecon/news`, `fosiecon/members`, `fosiecon/documents`.

### 3. Backend
```bash
cd backend
npm install
cp .env.example .env
# fill in MONGODB_URI, CLOUDINARY_URL, JWT_SECRET, EMAIL_PASS
npm run seed     # first time only
npm run dev
```

### 4. Frontend
```bash
cd frontend
npx serve .
```
Update `API_BASE` at the top of `frontend/js/api.js` to the deployed backend URL for production.

---

## Default Admin Accounts (after `npm run seed`)

| Account | Email | Password | Role |
|---|---|---|---|
| Super Admin | `admin@fosiecon.org.ng` | `Fosiecon@2026` | super_admin |
| Chairman | `erimamman2@gmail.com` | `Fosiecon@Chairman2026` | admin |

**Change both passwords immediately after first login.**

---

## Data note: the 36 member commissions

Only **Kogi (KOSIEC)** is seeded with real detail (commission name, abbreviation, chairman, contact info) —
that's the one commission this project has verified real-world data for. The other 35 states are seeded as
placeholder records (state name + a generic "`{State}` State Independent Electoral Commission" name only),
ready for the admin to fill in the real abbreviation, chairman, and contact details for each via the
**Member Commissions** tab in the admin panel. Fabricating plausible-sounding chairman names or contact
details for commissions this project has no source for would be worse than leaving them blank.

---

## Scope decisions — what was built vs. deferred, and why

The client brief's feature wishlist included several items that are either third-party integrations
requiring accounts/credentials this project doesn't have, or genuinely ambiguous for a non-profit forum
body. Built as real, working features:

- Contact / inquiry form (with email notification)
- WhatsApp chat button (floating, links to `wa.me`)
- Photo / video gallery
- PDF / document downloads
- User registration & login (self-service member accounts) + a member dashboard
- Admin Panel / CMS (full CRUD for news, team, member commissions, gallery, events, downloads,
  testimonials with a pending/approved moderation queue, FAQs, inquiries, and user management)

Deliberately **not** built, and why:
- **Live chat support** — this means a third-party widget (Tawk.to, Crisp, etc.); it needs an account
  this project doesn't have. The WhatsApp button covers the same real-time-contact need without one.
- **Social media feed integration** — needs FOSIECON's actual social handles, which weren't provided.
- **Push notifications** — needs a service worker + VAPID/FCM keys and a real deployed HTTPS origin;
  out of scope for a first build.
- **QR code integration** — the brief didn't specify what the QR code is *for* in a forum context (unlike
  KOSIEC's event check-in use case), so nothing was built rather than guessing at a use case.
- **Countdown timer** — KOSIEC has one tied to a specific election date; FOSIECON, as a coordinating body,
  doesn't have a single equivalent date to count down to.
- **Membership / subscription (paid tier)** — the brief lists this as a desired feature but also says
  "No" to e-commerce; user registration (built) covers the "membership" need without payment processing.

All of the above are addable later without restructuring what's here — the models and admin panel are
already built to be extended.

---

## Security Features

Same as KOSIEC: bcryptjs password hashing (12 rounds), account lockout after 5 failed logins (30-min
cooldown), full admin activity log (login/logout/password-change/create/update/delete, with IP + user
agent), rate limiting (10 login attempts/15min, 5 inquiry submissions/hour, 200 general API requests/15min
per IP).

## API Base URL
All endpoints are prefixed with `/api/`. Example: `http://localhost:5000/api/news`
