# 🚌 Smart Campus Bus ETA & Demand Prediction System

> An intelligent campus transportation system that predicts **bus arrival time (ETA)** and **passenger demand** using location data, historical trip data, and machine learning.

## 📌 Overview

The **Smart Campus Bus ETA & Demand Prediction System** is a mini project designed to make campus transportation more predictable, efficient, and easier to manage.

Students can check buses, routes, stops, ETA, and predicted demand. Drivers get a **separate, clutter-free driver interface** focused only on the actions they need during a trip. Administrators have a broader monitoring and emergency-management interface for campus transportation operations.

The system is designed around three frontend access levels:

```text
Student → Information & Bus Tracking
Driver  → Simple Trip Operations & Location Updates
Admin   → Monitoring, Management & Emergency Support
```

---

## 🎯 Objectives

1. **Predict Bus ETA** — Estimate how long a bus will take to reach a stop.
2. **Track Bus Location** — Show the current/latest known bus position.
3. **Predict Passenger Demand** — Estimate expected demand for routes and time periods.
4. **Give Drivers a Simple Work Interface** — Minimize distractions and expose only essential controls.
5. **Provide Admin Monitoring** — Let administrators monitor buses, routes, demand, and emergency situations.
6. **Improve Student Experience** — Reduce uncertainty and waiting time.

---

## 🚀 Key Features

### 👨‍🎓 Student Access

- View available campus buses
- Track bus location
- View predicted ETA
- View routes and stops
- View predicted demand/crowding
- Receive updated transportation information

### 🚌 Driver Access

The driver interface is intentionally different from the student and admin interfaces. It should be **simple, readable, mobile-friendly, and usable with minimum interaction while the vehicle is stationary/safely parked**.

Driver login should open only the driver's assigned operational dashboard.

Core driver functions:

- Secure driver login
- View assigned bus and route
- Start trip / end trip
- Start or pause location sharing
- Send/update current bus location
- View next stop and route progress
- See simple ETA/status information relevant to the current trip
- Report a delay or bus issue
- Send an emergency alert to admin
- View only essential trip information
- Logout

**Driver UX principle:** no unnecessary analytics, charts, student-management controls, route administration, or complex settings. The driver should be able to understand the current trip at a glance.

### 🧑‍💼 Admin Access

Admin access is intended for **campus monitoring, management, and emergency support** rather than normal driver operation.

- Add/manage buses
- Assign buses and drivers
- Manage routes and stops
- Monitor active buses
- View demand information
- Analyze route performance
- View trip/history information
- Receive driver emergency alerts
- Monitor delays and operational issues
- Use historical data for transportation planning

---

## 🔐 Role-Based Access

The system should keep the three interfaces logically separated:

| Role | Main Purpose | Interface Style |
|---|---|---|
| **Student** | Find and track buses | Informative dashboard |
| **Driver** | Operate assigned trip | Minimal, action-focused UI |
| **Admin** | Monitor and manage campus transport | Full management dashboard |

A driver must **not** receive admin controls simply because they are logged in. The backend should verify the user's role before allowing protected driver/admin API operations.

---

## 🧭 Driver UX Flow

```text
Driver Login
     ↓
Assigned Bus + Route
     ↓
Start Trip
     ↓
Current Trip Screen
 ┌───────────────────────┐
 │ Bus: RX-01            │
 │ Route: Hostel → Gate  │
 │ Next Stop: Block A    │
 │ ETA: 5 min            │
 │                       │
 │ [Update Location]     │
 │ [Delay / Issue]       │
 │ [Emergency]           │
 │ [End Trip]             │
 └───────────────────────┘
     ↓
End Trip
```

The driver screen should prioritize **large controls, clear status text, minimal navigation, and only the information required for the current trip**.

> Safety note: location updates and other driver interactions should be designed for use while the vehicle is stationary or when it is safe to interact with the device.

---

## 🏗️ System Architecture

```text
                  ┌──────────────────────┐
                  │ Bus / Driver Device  │
                  │ Location Updates     │
                  └──────────┬───────────┘
                             │
                             ▼
                  ┌──────────────────────┐
                  │      Backend API     │
                  │ Auth + Trip + GPS    │
                  └──────────┬───────────┘
                             │
               ┌─────────────┴─────────────┐
               │                           │
               ▼                           ▼
      ┌─────────────────┐        ┌─────────────────┐
      │  ETA Prediction │        │ Demand Forecast │
      │      Model      │        │      Model      │
      └────────┬────────┘        └────────┬────────┘
               │                           │
               └─────────────┬─────────────┘
                             ▼
                  ┌──────────────────────┐
                  │      Database        │
                  │ Users / Buses /      │
                  │ Routes / Trips / GPS │
                  │ Predictions / Alerts │
                  └──────────┬───────────┘
                             │
              ┌──────────────┼──────────────┐
              ▼              ▼              ▼
        ┌───────────┐  ┌───────────┐  ┌───────────┐
        │  Student  │  │  Driver   │  │   Admin   │
        │ Frontend  │  │ Frontend  │  │ Frontend  │
        └───────────┘  └───────────┘  └───────────┘
```

---

## 🔄 How It Works

### Step 1 — Collect Data

The system can collect:

- Bus location
- Timestamp
- Route
- Bus stop
- Previous trip information
- Historical travel time
- Passenger count/demand
- Day and time

### Step 2 — Process Data

The collected data is cleaned and converted into useful features.

```text
Current Location
      +
Destination Stop
      +
Distance
      +
Historical Travel Time
      +
Time / Day
      ↓
   ML Model
      ↓
Predicted ETA
```

### Step 3 — Predict ETA

The ETA model estimates remaining travel time between the bus's current location and a selected stop.

### Step 4 — Predict Demand

Historical passenger patterns can estimate expected demand for a route and time period.

### Step 5 — Serve Role-Specific Interfaces

The backend returns only the data/actions required for each role. Students track buses, drivers operate assigned trips, and admins monitor the complete system.

---

## 🧠 Machine Learning Approach

### ETA Prediction

Possible features:

- Distance to stop
- Time
- Day of week
- Route
- Historical travel time
- Available delay/traffic information
- Bus speed

**Target:** estimated remaining travel time.

Possible models:

- Linear Regression
- Random Forest
- Gradient Boosting
- XGBoost

For an MVP, **Random Forest or Gradient Boosting** is a practical starting point.

### Demand Prediction

Possible features:

- Route
- Time of day
- Day of week
- Historical passenger count
- Academic schedule
- Special events
- Previous demand

**Target:** expected passenger count or demand level.

---

## 🛠️ Technology Stack

### Frontend

- HTML
- CSS
- JavaScript
- React *(if used in implementation)*

### Backend

- Node.js
- Express.js

### Machine Learning

- Python
- Pandas
- NumPy
- Scikit-learn

### Database

- PostgreSQL / MySQL

### Data & Location

- GPS/location data
- Route and stop data
- Historical transportation data

### Development Tools

- Git
- GitHub
- VS Code

---

## 📂 Project Structure

```text
smart-campus-bus/
│
├── frontend/
│   ├── student/              # Student-facing bus tracking UI
│   ├── driver/               # Clutter-free driver UI
│   └── admin/                # Admin monitoring/management UI
│
├── backend/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   └── server.js
│
├── ml/
│   ├── datasets/
│   ├── notebooks/
│   ├── models/
│   ├── preprocessing/
│   └── train.py
│
├── database/
│   └── schema.sql
│
├── docs/
│   └── architecture.md
│
├── .gitignore
└── README.md
```

---

## 📊 Example Driver Dashboard

```text
┌─────────────────────────────────┐
│ 🚌 CampusMove AI     Driver     │
├─────────────────────────────────┤
│ Bus       RX-01                 │
│ Route     Hostel → Main Gate    │
│ Status    ON TRIP               │
│                                 │
│ Next Stop                       │
│ Academic Block                  │
│ ETA: 5 minutes                  │
│                                 │
│ [ UPDATE LOCATION ]             │
│                                 │
│ [ REPORT DELAY / ISSUE ]        │
│                                 │
│ [ 🚨 EMERGENCY ]                │
│                                 │
│ [ END TRIP ]                    │
└─────────────────────────────────┘
```

This is a **UX direction**, not a claim that the final UI has already been implemented.

---

## 📊 Example Workflow

```text
Driver logs in
      ↓
Backend verifies DRIVER role
      ↓
Assigned bus + route loaded
      ↓
Driver starts trip
      ↓
Location updates are received
      ↓
ETA model predicts arrival time
      ↓
Demand model predicts expected demand
      ↓
Student sees updated bus information
      ↓
Admin monitors the active trip
      ↓
Driver ends trip
```

If an emergency occurs:

```text
Driver → Emergency Alert → Backend → Admin Dashboard
```

---

## 🧪 MVP Scope

The first version should focus on a small but functional implementation.

### Core MVP

- [ ] Basic campus routes
- [ ] Bus and stop information
- [ ] Location tracking/simulation
- [ ] ETA prediction
- [ ] Basic demand prediction
- [ ] Student dashboard
- [ ] **Driver login and role-based dashboard**
- [ ] **Driver trip start/end controls**
- [ ] **Driver location update**
- [ ] **Driver delay/issue reporting**
- [ ] **Driver emergency alert to admin**
- [ ] Admin monitoring dashboard
- [ ] Database integration
- [ ] Role-based backend authorization

### Future Improvements

- [ ] Real GPS hardware integration
- [ ] Live map tracking
- [ ] Traffic-aware ETA
- [ ] Mobile application/PWA for drivers
- [ ] Push notifications
- [ ] Automatic route optimization
- [ ] Dynamic bus allocation
- [ ] Advanced crowd prediction
- [ ] Campus timetable integration
- [ ] Historical analytics dashboard
- [ ] Driver performance/shift management

---

## ⚠️ Limitations

The accuracy of the system depends on the quality and quantity of transportation data.

A model trained on a small simulated dataset will **not** provide genuinely reliable real-world predictions. A meaningful deployment would require real bus GPS data, sufficient historical trips, reliable passenger-count data, accurate route/stop information, and regular model evaluation/retraining.

The driver interface is also a prototype concept until the authentication, location update, trip management, and emergency APIs are implemented.

Therefore, the initial version should be treated as an **MVP/prototype**, not a production-grade transportation platform.

---

## 🎓 Academic Purpose

This project demonstrates the practical application of:

- Machine Learning
- Data Processing
- Predictive Analytics
- Web Development
- Role-Based Access Control
- Backend APIs
- Database Management
- GPS/Location Tracking
- Real-world Problem Solving

---

## 👥 Team — RouteX

| Member | Role |
|---|---|
| **Nitish Kumar Singh** | Team Leader |
| **Shivang Saxena** | Team Member |
| **Piyush Panwar** | Team Member |
| **Priyanshu Joshi** | Team Member |
| **Prince Yadav** | Team Member |

---

## 📌 Project Name

**Smart Campus Bus ETA & Demand Prediction System**

### Proposed Product Name

**CampusMove AI**

> Intelligent Campus Transportation — ETA Prediction, Demand Forecasting & Fleet Optimization.

---

## 📄 Project Status

🚧 **Currently under development — Mini Project / MVP**

The initial objective is to build a working prototype demonstrating:

```text
Data → Processing → ML Prediction → Backend → Role-Based Frontends
```

---

## ⭐ Future Vision

The long-term goal is to evolve the prototype into an intelligent campus transportation platform where:

- students can easily know when their bus will arrive,
- drivers can operate their assigned trips through a simple interface, and
- administrators can monitor campus transportation and respond to operational emergencies.

---

## 📜 License

This project is developed for **academic and educational purposes**.
