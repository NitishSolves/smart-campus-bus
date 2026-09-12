# Smart Campus Bus MVP - Setup & Demo Guide

## Overview

This is a **Core Operational MVP** for a smart campus bus system. It digitally replaces manual bus tracking with:

- **Real-time location tracking** with GPS fallback to simulation
- **Live ETA calculation** (LIVE, SCHEDULED, DEGRADED modes)
- **Occupancy management** and capacity risk alerts
- **Emergency alert system** for drivers
- **Pickup-point focused student experience**
- **Admin operational monitoring** dashboard
- **Historical data foundation** for future ML

**This system works immediately after setup with realistic demo data.**

---

## Quick Start (5 minutes)

### Prerequisites

- Node.js 18+
- PostgreSQL 13+
- `npm` package manager

### Setup Steps

```bash
# 1. Clone and navigate
cd smart-campus-bus

# 2. Install dependencies
cd backend && npm install
cd ../frontend && npm install
cd ..

# 3. Create .env file in backend/
cat > backend/.env << 'EOF'
DATABASE_URL=postgres://user:password@localhost:5432/campus_bus
JWT_SECRET=your-secure-random-secret-key
NODE_ENV=development
PORT=5000
EOF

# 4. Create database (adjust credentials as needed)
createdb campus_bus

# 5. Run migrations and seed data
cd backend
npm run seed

# 6. Start backend server (Terminal 1)
npm run dev
# Server runs on http://localhost:5000

# 7. Start frontend server (Terminal 2, from frontend/)
npm run dev
# Frontend runs on http://localhost:5173
```

**Access the app at `http://localhost:5173`**

---

## Default Demo Credentials

| Role  | Email | Password | Notes |
|-------|-------|----------|-------|
| Student | `student@campus.edu` | `student123` | Default stop: Library |
| Driver 1 | `driver@campus.edu` | `driver123` | Bus BUS-01, Route A |
| Driver 2 | `driver2@campus.edu` | `driver123` | Bus BUS-03, Route B |
| Driver 3 | `driver3@campus.edu` | `driver123` | Bus BUS-02, Route C |
| Admin | `admin@campus.edu` | `admin123` | Full system access |

---

## Demo Workflow (Step-by-Step)

### Scenario: Student tracking a bus to library

1. **Login as Student**
   ```
   Email: student@campus.edu
   Password: student123
   ```

2. **View Dashboard**
   - Pickup point: "Library" (pre-configured)
   - See buses serving Library
   - View real-time ETAs
   - Check service announcements

3. **Track a Bus**
   - Click on "Bus BUS-01"
   - See live location on map
   - Watch ETA update as bus moves
   - View occupancy (18/40 passengers)

---

### Scenario: Driver operating a bus trip

1. **Login as Driver**
   ```
   Email: driver@campus.edu
   Password: driver123
   ```

2. **View Assigned Bus**
   - Bus: BUS-01
   - Route: Route A (Main Gate → Hostel)
   - Capacity: 40 passengers

3. **Start Trip**
   - Click "Start Trip" button
   - Trip status changes to "active"
   - Real-time updates begin

4. **Update Location**
   - Click "Update Location"
   - Choose: Use device GPS or simulation
   - If GPS unavailable, system falls back to sim (marked clearly)
   - Location broadcasts to all students via Socket.io

5. **Update Occupancy**
   - Enter passenger count (validated against capacity)
   - Click "Update"
   - Shows: 25/40 passengers

6. **Report Delay**
   - Click "Report Delay"
   - Reason: "Campus congestion" (example)
   - Admins and students immediately notified

7. **Emergency Alert** (with confirmation)
   - Click "🚨 Emergency Alert"
   - Confirm: "Are you sure?"
   - Alert broadcasts to all admins
   - Shows bus location and status

8. **End Trip**
   - Click "End Trip"
   - Trip marked as completed
   - Historical data saved for analytics

---

### Scenario: Admin monitoring operations

1. **Login as Admin**
   ```
   Email: admin@campus.edu
   Password: admin123
   ```

2. **View Operations Dashboard**
   - Active buses: 2
   - Total trips today: 5
   - Delayed trips: Shows count (red if > 0)
   - Capacity risks: Shows buses >85% full
   - Stale GPS: Shows buses without updates (5+ min)

3. **Handle Emergency Alert**
   - Red alert panel appears if emergency active
   - Shows bus number, driver, route
   - Click "Acknowledge" to handle
   - Bus location visible on map

4. **Monitor Live Buses**
   - See all active buses on map
   - Click bus to view details:
     - Current location
     - ETA to next stops
     - Occupancy
     - Delay status
     - Driver info

5. **Manage Announcements**
   - Navigate to Announcements management
   - Create announcement
     - Title: "Evening schedule change"
     - Body: "Route A extra trip at 8 PM"
     - Severity: "warning"
   - Students see immediately on dashboard

6. **View Capacity Risks**
   - High utilization panel shows buses >85% full
   - System recommends: "May need extra bus"
   - Admin decides on additional resources

7. **Check Demand Prediction**
   - View historical demand data
   - See predicted passengers by hour
   - Capacity utilization %
   - Helps with scheduling

8. **Trip History**
   - View completed trips
   - Average delays
   - Route performance
   - Occupancy trends

---

## Architecture Overview

### Technology Stack

| Component | Technology | Purpose |
|-----------|-----------|---------|
| **Backend** | Node.js + Express | REST API, Socket.io server |
| **Database** | PostgreSQL | All data persistence |
| **Frontend** | React 18 + Vite | Web UI |
| **Maps** | Leaflet | Route visualization |
| **Real-time** | Socket.io | Live updates |
| **Auth** | JWT + bcrypt | Secure authentication |
| **Styling** | Tailwind CSS | Responsive UI |

### Data Model

**Core Entities:**
- `users` - Students, drivers, admins
- `buses` - Fleet with capacity and status
- `drivers` - Driver profiles linked to buses
- `routes` - Fixed routes (A, B, C) with stops
- `stops` - Campus locations (7 stops)
- `trips` - Active/completed bus trips
- `bus_locations` - Real-time GPS coordinates
- `emergency_alerts` - Driver emergency reports
- `announcements` - Service updates
- `historical_demand` - Passenger patterns
- `historical_segment_times` - Travel times

---

## ETA Calculation (Hybrid Model)

### Calculation Modes

**LIVE Mode** ✅ (GPS available, recent)
- Uses real location + current speed
- Blends with historical segment times (65% real, 35% historical)
- Most accurate within last 5 minutes of location

**DEGRADED Mode** ⚠️ (GPS stale, >5 minutes)
- Falls back to average speed (9 km/h)
- Still uses last known location
- Clearly marked as stale
- Shows "last updated: X minutes ago"

**SCHEDULED Mode** 📅 (No active GPS)
- Uses original schedule time
- Adjusted for reported delays
- Fallback when trip not yet started

### Formula

```
ETA = (distanceRemaining / currentSpeed) + delayMinutes
```

With historical blending:
```
ETA = (0.65 × liveEstimate) + (0.35 × historicalTime) + delayMinutes
```

---

## Occupancy & Capacity Management

### Rules

- Occupancy cannot exceed bus capacity
- Real-time validation on driver update
- Utilization % calculated: `(occupancy / capacity) × 100`
- High utilization alert at >85%

### Capacity Risk Indicators

**Green** (<70%): Adequate capacity
**Yellow** (70-85%): Monitor capacity
**Red** (>85%): Capacity risk - may need extra bus

Admin receives recommendations:
> "Route A may require an additional/standby bus"

But **allocation is human-controlled** - no automatic reassignment.

---

## Real-Time Updates (Socket.io)

### Events

| Event | Direction | Payload | Subscribers |
|-------|-----------|---------|-------------|
| `tracking:update` | Backend → Client | Active buses | All users |
| `trip:update` | Backend → Client | Trip status change | All users |
| `notification:new` | Backend → Client | Announcements, alerts | Specific users |
| `emergency:alert` | Backend → Client | Emergency report | Admins only |

### Update Flow

```
Driver updates location
  ↓
Backend validates coordinates
  ↓
Backend persists in bus_locations table
  ↓
Backend broadcasts via Socket.io
  ↓
All connected clients receive update
  ↓
Frontend re-renders in real-time (no refresh needed)
```

### Reconnection

- Automatic reconnect with exponential backoff
- Max 5-second delay between attempts
- Unlimited retry attempts
- Fallback to polling if websocket unavailable

---

## API Endpoints Reference

### Authentication

```
POST   /api/auth/register    - Student registration
POST   /api/auth/login       - Login (all roles)
POST   /api/auth/logout      - Logout
GET    /api/auth/me          - Current user profile
PUT    /api/auth/profile     - Update profile
```

### Student APIs

```
GET    /api/dashboard        - Dashboard data + buses + routes
GET    /api/notifications/announcements - Active service updates
GET    /api/favorites        - User's favorites
POST   /api/favorites        - Add favorite
DELETE /api/favorites/:id    - Remove favorite
GET    /api/routes           - All routes
GET    /api/routes/:id       - Route detail with stops
GET    /api/stops            - All pickup stops
GET    /api/stops/:id        - Stop detail
GET    /api/tracking/active  - Active buses + live locations
GET    /api/eta/trip/:tripId - ETA to all stops
```

### Driver APIs

```
GET    /api/driver/me        - Driver dashboard (bus, trip, next stop)
POST   /api/driver/trip/start - Start a trip
POST   /api/driver/trip/location - Update location (with GPS or sim)
POST   /api/driver/trip/occupancy - Update passenger count
POST   /api/driver/trip/delay - Report delay
POST   /api/driver/trip/end   - Complete trip
POST   /api/driver/emergency  - Create emergency alert
```

### Admin APIs

```
GET    /api/admin/overview         - Operations dashboard metrics
GET    /api/admin/emergencies      - All active/acknowledged emergencies
PUT    /api/admin/emergencies/:id/acknowledge - Mark handled
PUT    /api/admin/emergencies/:id/resolve - Mark resolved
GET    /api/admin/announcements    - All announcements
POST   /api/admin/announcements    - Create announcement
PUT    /api/admin/announcements/:id - Update announcement
DELETE /api/admin/announcements/:id - Delete announcement
GET    /api/demand/active-trips    - Current capacity analysis
GET    /api/demand/route/:routeId  - Route demand prediction
[CRUD endpoints for buses, drivers, routes, stops...]
```

---

## Demo Data

### Routes

| Code | Name | Stops | Duration |
|------|------|-------|----------|
| A | Main Gate → Hostel | 4 stops | 16 min |
| B | Main Gate → Acad. Block | 4 stops | 14 min |
| C | Hostel → Sports | 4 stops | 12 min |

### Stops (7 Total)

- Main Gate (entrance)
- Library (central hub)
- Academic Block (classrooms)
- Engineering Block (labs)
- Cafeteria (food)
- Hostel (residences)
- Sports Complex (gym)

### Buses

| Number | Capacity | Route | Status |
|--------|----------|-------|--------|
| BUS-01 | 40 | A | Active (demo) |
| BUS-02 | 40 | C | Idle |
| BUS-03 | 36 | B | Active (demo) |
| BUS-04 | 32 | - | Idle |

### Active Demo Trips

- **BUS-01**: Route A, Driver Ravi Kumar, Status: active, Occupancy: 18/40
- **BUS-03**: Route B, Driver Meera Iyer, Status: active, Occupancy: 24/36

Both update location every 10 seconds (controllable by driver).

---

## Important Operating Notes

### GPS Simulation

- Real GPS requires browser permission (geolocation API)
- If GPS denied, system gracefully falls back to simulation
- **Simulation is clearly marked in UI** — never falsely shows as real GPS
- Demo purposes: Use simulation for consistent testing
- Production: Implement real GPS + optional fallback

### Database Migrations

- Schema auto-creates on first run (if tables don't exist)
- Seed data auto-populates (with conflict handling)
- Safe to re-run seed (uses `ON CONFLICT`)
- To reset: Drop tables and re-seed

### Error Handling

- Invalid occupancy (>capacity): Rejected with error message
- Stale coordinates (outside valid range): Rejected
- Missing trip or bus: Returns 400 error
- Unauthorized access: Returns 403 error
- All errors shown in UI with retry button

### Production Considerations

- Use environment variables for all secrets
- Implement rate limiting (already set up)
- Add HTTPS and CORS properly
- Use real GPS with fallback to scheduled mode
- Implement data retention policies
- Add proper logging and monitoring
- Regular database backups
- SSL certificates

---

## Testing Checklist

### ✅ Core Workflows

- [ ] Student login → dashboard → track bus
- [ ] Student changes pickup point → ETAs update
- [ ] Driver login → start trip → update location
- [ ] Driver update occupancy with validation
- [ ] Driver report delay → admin sees immediately
- [ ] Driver emergency alert → confirmation → admin notification
- [ ] Admin acknowledge/resolve emergency
- [ ] Admin create announcement → student sees
- [ ] Admin view capacity risks
- [ ] Admin view trip history

### ✅ Real-Time Features

- [ ] Socket.io connects on page load
- [ ] Bus location updates broadcast to all
- [ ] Trip status changes broadcast
- [ ] Emergency alerts broadcast to admins only
- [ ] Reconnect works after disconnect

### ✅ Data Validation

- [ ] Occupancy > capacity rejected
- [ ] Negative passenger count rejected
- [ ] Invalid coordinates rejected
- [ ] Missing required fields rejected
- [ ] Unauthorized access returns 403

### ✅ UI/UX

- [ ] No horizontal scroll on mobile
- [ ] Touch targets >44px
- [ ] Forms have clear labels
- [ ] Error messages helpful
- [ ] Loading states visible
- [ ] Buttons show busy state

### ✅ Edge Cases

- [ ] No active buses → empty state shown
- [ ] No GPS → uses simulation
- [ ] Stale location → marked as DEGRADED
- [ ] Trip already completed → can't update
- [ ] Driver logout → trip paused
- [ ] Network disconnect → reconnects

---

## Troubleshooting

### "Cannot connect to database"
```bash
# Check PostgreSQL is running
psql -U postgres -c "SELECT 1;"

# Verify DATABASE_URL in .env
echo $DATABASE_URL

# Reset database
dropdb campus_bus && createdb campus_bus && npm run seed
```

### "Port 5000/5173 already in use"
```bash
# Kill the process
lsof -ti:5000 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### "Socket.io not connecting"
- Check backend is running on port 5000
- Check browser console for errors
- Clear browser cache and reload
- Check CORS configuration in server.js

### "Seed doesn't populate data"
```bash
# Check seed output
cd backend && npm run seed 2>&1 | tee seed.log

# Check database has data
psql -U user -d campus_bus -c "SELECT COUNT(*) FROM stops;"
```

### "ETA showing strange values"
- Check `historicalSegmentTimes` table is populated
- Verify coordinates are valid (lat -90 to 90, lng -180 to 180)
- Check speed calculation (avoid divide by zero)

---

## Future Enhancements (Post-MVP)

### Phase 1: Real ML
- Train demand model on 6+ months historical data
- Implement route optimization algorithm
- Add passenger flow prediction

### Phase 2: Advanced Features
- Mobile app (React Native)
- QR code ticketing
- Payment integration
- Student ID verification
- Crowding heatmaps

### Phase 3: Operational
- Maintenance scheduling
- Driver performance tracking
- Multi-campus support
- Accessibility features
- Notifications (SMS, push)

### Phase 4: Integration
- Campus calendar sync
- Class schedule correlation
- Room booking system integration
- Parking availability
- Bike/scooter sharing

---

## Support & Documentation

- **Backend docs**: See `/backend/README.md`
- **Frontend docs**: See `/frontend/README.md`
- **Database schema**: See `/database/schema.sql`
- **API docs**: Full endpoint reference in this file
- **Issues**: GitHub issues (when repo public)

---

## License & Attribution

Smart Campus Bus MVP - Educational project demonstrating full-stack transportation management system.

Built with:
- Express.js
- PostgreSQL
- React
- Socket.io
- Leaflet
- Tailwind CSS

---

**Last Updated**: 2025-09-12
**Status**: ✅ Core Operational MVP Ready
