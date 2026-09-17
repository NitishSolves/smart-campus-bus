# 🚌 Smart Campus Bus System - Core Operational MVP

> A **demo-ready MVP** campus transportation platform with real-time tracking, blended ETA estimation, occupancy management, and emergency alerts.

**Status**: Core Operational MVP (verified locally)

**Type**: MVP codebase — not production-hardened  
**Deployment**: Ready for local demo/pilot after configuring your own environment variables

---

## 🎯 What This System Does

This is **NOT** a prototype or simulation. Everything described below actually works:

### For Students 👨‍🎓
- ✅ See buses serving your pickup point
- ✅ Track live bus location on map
- ✅ View real-time ETA (LIVE mode)
- ✅ Check passenger occupancy & crowding
- ✅ Receive service announcements
- ✅ Set preferred pickup location

### For Drivers 🚗
- ✅ Start/end trips with confirmation
- ✅ Update location (real GPS or simulation)
- ✅ Update passenger count (validated)
- ✅ Report delays with reason
- ✅ Trigger emergency alerts (with confirmation)
- ✅ See assigned bus, route, next stop

### For Admins 👨‍💼
- ✅ Monitor active buses in real-time
- ✅ See all bus locations on map
- ✅ Manage emergencies (acknowledge/resolve)
- ✅ View capacity risks (buses >85% full)
- ✅ Create/manage announcements
- ✅ Analyze demand patterns
- ✅ See trip history & analytics
- ✅ Manage fleet (buses, drivers, routes)

---

## 🏗️ Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Node.js 18+ + Express | REST API & Socket.io server |
| **Frontend** | React 18 + Vite | Web UI (responsive, mobile-friendly) |
| **Database** | PostgreSQL 13+ | All data persistence |
| **Real-time** | Socket.io 4.8 | Live location broadcasts |
| **Auth** | JWT + bcrypt | Secure authentication |
| **Maps** | Leaflet + react-leaflet | Route visualization |
| **UI** | Tailwind CSS 3.4 | Responsive styling |

---

## ⚡ Quick Start (5 minutes)

### Prerequisites
```bash
node --version  # 18+
npm --version
psql --version  # PostgreSQL 13+
```

### Setup
```bash
# 1. Clone and navigate
cd smart-campus-bus

# 2. Install dependencies
cd backend && npm install && cd ..
cd frontend && npm install && cd ..

# 3. Create .env in backend/
cat > backend/.env << 'EOF'
DATABASE_URL=postgres://user:password@localhost:5432/campus_bus
JWT_SECRET=dev-secret-change-in-production
NODE_ENV=development
PORT=3001
EOF

# 4. Create database and seed
createdb campus_bus
cd backend && npm run seed

# 5. Start both servers
# Terminal 1: Backend
cd backend && npm run dev  # http://localhost:3001

# Terminal 2: Frontend
cd frontend && npm run dev  # http://localhost:5173
```

**Access app at**: `http://localhost:5173`

### Default Credentials
```
Student: student@campus.edu / student123 (Library pickup point)
Driver:  driver@campus.edu / driver123 (Bus BUS-01, Route A)
Admin:   admin@campus.edu / admin123 (Full access)
```

---

## 📋 Core Workflows

### Student: Track a Bus

```
1. Login: student@campus.edu / student123
2. Dashboard shows buses serving Library (default)
3. Click bus card to view on map
4. See live location updating
5. Watch ETA countdown
6. Check occupancy (e.g., 18/40)
```

### Driver: Operate a Trip

```
1. Login: driver@campus.edu / driver123
2. See assigned bus (BUS-01) & route (A)
3. Click "Start Trip"
4. Update location (GPS or simulation)
5. Update occupancy (validated against capacity)
6. Report delay if needed
7. Click "End Trip" to complete
8. Optional: Emergency alert (red button, needs confirmation)
```

### Admin: Monitor Operations

```
1. Login: admin@campus.edu / admin123
2. See live metrics (active buses, delays, capacity risks)
3. View all buses on map
4. Handle emergency if one appears (acknowledge/resolve)
5. Create service announcement
6. View demand prediction for a route
7. Check capacity utilization by bus
```

---

## 🔑 Key Features

### Real-Time Location Tracking
- **LIVE Mode** (GPS available): Real location + current speed
- **DEGRADED Mode** (GPS stale >5 min): Last known location + fallback speed
- **SCHEDULED Mode** (no GPS): Original schedule adjusted for delays
- All modes marked clearly in UI

### Hybrid ETA Calculation
```
ETA = (0.65 × liveCalculation) + (0.35 × historicalAverage) + delayAdjustment
```
- Never returns impossible values (negative, NaN, Infinity)
- Blends real-time with 7 days of historical data
- Clearly indicates calculation mode and freshness

### Occupancy Management
- Driver updates passenger count real-time
- System validates: occupancy ≤ bus capacity
- Rejects if exceeding capacity with clear error
- Shows utilization % to students & admins

### Emergency System
- Driver can trigger emergency alert (red button)
- Confirmation modal prevents accidents
- Admin sees prominent red alert banner
- Shows bus number, driver name, location, time
- Admin can acknowledge/resolve
- Broadcasts to all connected admins immediately

### Pickup-Point Focused Student Experience
- Dashboard shows YOUR pickup point first
- Lists buses serving that stop
- Shows ETA to YOUR stop (not generic)
- Can change preferred pickup point anytime
- Service announcements always visible

### Admin Operational Dashboard
- Real-time metrics: active buses, trips, delays, emergencies
- Capacity risk alerts (buses >85% full)
- Stale GPS alerts (no update >5 minutes)
- Live bus list with occupancy
- Emergency alert panel (if any active)
- Map view of all active buses

### Service Announcements
- Admin creates/updates announcements
- Multiple severity levels: info, warning, critical
- Students see active announcements
- Real-time delivery via Socket.io

### Demand Intelligence
- Predicts passenger demand by route, hour, day
- Uses historical data (7 days × 14 hours)
- Calculates capacity utilization %
- Flags capacity risks for admin
- No fake ML (transparent statistical model)

---

## 📚 Documentation

| Document | Purpose |
|----------|---------|
| **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** | Complete setup + detailed demo workflows (300+ lines) |
| **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** | All changes made, APIs, testing results (400+ lines) |
| **This file** | Quick start + overview |

---

## 🗂️ Project Structure

```
smart-campus-bus/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express app & Socket.io setup
│   │   ├── db.js               # PostgreSQL connection
│   │   ├── seed.js             # Demo data seeding
│   │   ├── middleware/
│   │   │   └── auth.js         # JWT authentication & authorization
│   │   ├── routes/
│   │   │   ├── auth.js         # Login/register
│   │   │   ├── driver.js       # Driver operations
│   │   │   ├── admin.js        # Admin monitoring & management
│   │   │   ├── dashboard.js    # Student dashboard
│   │   │   ├── eta.js          # ETA calculations
│   │   │   ├── demand.js       # Demand prediction
│   │   │   ├── tracking.js     # Bus tracking (read-only)
│   │   │   └── [other routes]
│   │   ├── services/
│   │   │   └── tracking.js     # Socket.io event handlers
│   │   └── utils/
│   │       ├── eta.js          # ETA algorithm
│   │       ├── geo.js          # Geo calculations
│   │       └── demand.js       # Demand calculation
│   ├── package.json
│   └── .env                    # Configuration (create this)
├── frontend/
│   ├── src/
│   │   ├── App.jsx             # Main router
│   │   ├── api.js              # API client
│   │   ├── context/
│   │   │   └── AuthContext.jsx # Auth state management
│   │   ├── hooks/
│   │   │   └── useSocket.js    # Socket.io hook
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx   # Student dashboard
│   │   │   ├── driver/
│   │   │   │   └── DriverHome.jsx
│   │   │   └── admin/
│   │   │       └── AdminOverview.jsx
│   │   ├── components/         # Shared components
│   │   └── index.css           # Tailwind + custom styles
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.js
├── database/
│   └── schema.sql              # Database schema with all tables
├── SETUP_GUIDE.md              # Complete setup guide
├── IMPLEMENTATION_SUMMARY.md   # Changes & verification
└── README.md                   # Original documentation

```

---

## 🔌 API Overview

### Authentication
```
POST   /api/auth/login           - Login for all roles
POST   /api/auth/register        - Student registration
GET    /api/auth/me              - Current user profile
```

### Student APIs
```
GET    /api/dashboard            - Dashboard data (buses, routes, stops)
GET    /api/notifications/announcements - Service announcements
GET    /api/tracking/active      - All active buses with locations
GET    /api/eta/trip/:tripId     - ETA predictions for trip
```

### Driver APIs
```
GET    /api/driver/me            - Driver dashboard
POST   /api/driver/trip/start    - Start a trip
POST   /api/driver/trip/location - Update location (GPS or sim)
POST   /api/driver/trip/occupancy - Update passenger count
POST   /api/driver/trip/delay    - Report delay
POST   /api/driver/emergency     - Create emergency alert
```

### Admin APIs
```
GET    /api/admin/overview       - Operations dashboard metrics
GET    /api/admin/emergencies    - All active emergencies
PUT    /api/admin/emergencies/:id/acknowledge - Handle emergency
GET    /api/admin/announcements  - All announcements
POST   /api/admin/announcements  - Create announcement
GET    /api/demand/active-trips  - Current capacity analysis
GET    /api/demand/route/:routeId - Demand prediction
```

**Full reference**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md) API section

---

## 🧪 Testing

### Test Checklist

- [x] Student login → dashboard → track bus
- [x] Driver start → update location → end trip
- [x] Driver update occupancy (validation works)
- [x] Driver emergency alert (confirmation modal)
- [x] Admin see emergency (red alert banner)
- [x] Admin acknowledge emergency
- [x] Admin create announcement
- [x] Student receive announcement
- [x] Capacity risk alerts (>85% utilization)
- [x] Stale GPS detection (>5 minutes)
- [x] Socket.io real-time updates
- [x] Form validation (reject invalid data)
- [x] Mobile layout responsive
- [x] No JavaScript console errors

### Manual Testing

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) for step-by-step demo scenarios.

---

## 🎓 Demo Data

### Routes
| Code | Name | Stops | Duration |
|------|------|-------|----------|
| A | Main Gate → Hostel | 4 stops | 16 min |
| B | Main Gate → Academic Block | 4 stops | 14 min |
| C | Hostel → Sports Complex | 4 stops | 12 min |

### Buses
| Number | Capacity | Status |
|--------|----------|--------|
| BUS-01 | 40 | Active (in demo) |
| BUS-02 | 40 | Idle |
| BUS-03 | 36 | Active (in demo) |
| BUS-04 | 32 | Idle |

### Active Trips
- **BUS-01**: Route A, Driver Ravi Kumar (18/40 passengers)
- **BUS-03**: Route B, Driver Meera Iyer (24/36 passengers)

Both are advanced by the demo simulator every 2.5 seconds while no real device GPS is reporting for that trip.

---

## ⚠️ Important Notes

### What This MVP Includes

- Real-time bus tracking (Socket.IO)
- Blended ETA with explicit fallback modes
- Occupancy management with validation
- Emergency alert system
- Admin monitoring dashboard
- Service announcements
- Historical data foundation
- Responsive mobile UI

### What This MVP Does NOT Include

- Real machine learning models (demand uses historical averages)
- Mobile app (web app is responsive)
- Payment/ticketing system
- Multi-campus support
- Advanced analytics
- Real hardware GPS integration (a provider abstraction is in place)

### GPS & Simulation

- **Device GPS**: Requires browser geolocation permission; the frontend converts the browser's m/s speed to km/h.
- **Simulation**: Deterministic path interpolation, returned by the API as mode `SIMULATED` and never presented as real GPS.
- **Safety**: The demo simulator skips any trip that is reporting device coordinates, so real GPS is never overwritten.
- **For demo**: Use simulation mode for consistent testing.
- **For production**: Connect hardware via the location source registry (`backend/src/services/locationSources.js`).

---

## 🚀 Deployment

### Staging
```bash
npm install --production
npm run seed  # Fresh data
npm run dev
```

### Production Checklist
- [ ] Use HTTPS (SSL certificate)
- [ ] Configure CORS properly
- [ ] Set strong JWT_SECRET
- [ ] Enable rate limiting
- [ ] Setup database backups
- [ ] Add error tracking (Sentry)
- [ ] Add APM monitoring
- [ ] Load test
- [ ] Security audit
- [ ] Document runbooks

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) production section for details.

---

## 🔍 Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL running
psql -U postgres -c "SELECT 1;"

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Reset
dropdb campus_bus && createdb campus_bus && npm run seed
```

### "Socket.io not connecting"
- Check backend running on port 3001
- Check browser console for errors
- Clear cache: Ctrl+Shift+Delete
- Restart backend

### "Port already in use"
```bash
# Kill process
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

See [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting section for more.

---

## 📖 Further Reading

1. **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** (300+ lines)
   - Complete setup instructions
   - Detailed demo workflows for all 3 roles
   - API endpoint reference
   - Operating notes
   - Testing checklist
   - Troubleshooting

2. **[IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)** (400+ lines)
   - All 15 phases of implementation
   - Every file modified/created
   - APIs added/enhanced
   - Test results
   - Known issues resolved
   - Metrics & statistics

3. **[database/schema.sql](./database/schema.sql)**
   - Complete database schema
   - All tables, constraints, indexes
   - Relationships & triggers

---

## 📞 Support

- **Setup issues**: See [SETUP_GUIDE.md](./SETUP_GUIDE.md) troubleshooting
- **Code questions**: Check [IMPLEMENTATION_SUMMARY.md](./IMPLEMENTATION_SUMMARY.md)
- **API reference**: Both setup guide and implementation summary
- **Database schema**: `/database/schema.sql`

---

## 📝 License

Smart Campus Bus MVP - Educational project

---

## 🎉 Quick Summary

| Aspect | Status |
|--------|--------|
| Core functionality | Verified locally |
| Database | Seeded (deterministic, re-runnable) and verified |
| Backend APIs | Verified with live requests |
| Frontend UI | Responsive; production build succeeds |
| Real-time (Socket.IO) | Verified (authenticated connection) |
| Authentication | JWT + bcrypt, role-based authorization |
| Demo data | 3 routes, 4 buses, demo accounts for all roles |
| Production ready | No — MVP only; complete the production checklist first |

---

**Status**: Core Operational MVP  
**Ready for**: Local demo / pilot  
**Last Updated**: see git history

See `SETUP_GUIDE.md` for setup and `backend/.env.example` for required variables.
