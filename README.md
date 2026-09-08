# 🚌 Smart Campus Bus ETA & Demand Prediction System

> An intelligent campus transportation system that predicts **bus arrival time (ETA)** and **passenger demand** using real-time tracking, historical trip data, and machine learning.

## 📌 Overview

The **Smart Campus Bus ETA & Demand Prediction System** is a mini project designed to make campus transportation more predictable, efficient, and convenient for students and transport administrators.

In a traditional campus bus system, students often do not know:

* Where the bus currently is
* When the bus will arrive at their stop
* Whether a bus is running late
* How crowded a bus is likely to be
* Which routes or time periods have higher demand

This project addresses these problems by combining **GPS/location data, historical trip information, real-time tracking, and machine learning** to provide useful transportation predictions.

---

## 🎯 Objectives

The main objectives of the project are:

1. **Predict Bus ETA**
   Estimate how long a bus will take to reach a particular stop.

2. **Track Bus Location**
   Display the current or latest known location of campus buses.

3. **Predict Passenger Demand**
   Estimate expected passenger demand for different routes and time periods.

4. **Improve Transportation Planning**
   Help administrators understand route utilization and peak-demand periods.

5. **Provide a Better Student Experience**
   Reduce uncertainty and waiting time for students.

---

## 🚀 Key Features

### 👨‍🎓 Student Side

* 🚌 View available campus buses
* 📍 Track bus location
* ⏱️ View predicted ETA
* 🗺️ View bus routes and stops
* 👥 View predicted bus demand/crowding
* 🔄 Receive updated transportation information

### 🧑‍💼 Admin Side

* Add/manage buses
* Manage routes and stops
* Monitor bus movement
* View demand information
* Analyze route performance
* Use historical data for transportation planning

### 🤖 Machine Learning

The ML component can be used for:

* ETA prediction
* Passenger demand forecasting
* Peak-hour identification
* Route utilization analysis

---

## 🏗️ System Architecture

```text
                 ┌─────────────────────┐
                 │     Bus / GPS       │
                 │   Location Data     │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    Backend / API    │
                 │ Data Processing     │
                 └──────────┬──────────┘
                            │
              ┌─────────────┴─────────────┐
              │                           │
              ▼                           ▼
     ┌─────────────────┐        ┌─────────────────┐
     │  ETA Prediction │        │ Demand Forecast │
     │       Model     │        │       Model     │
     └────────┬────────┘        └────────┬────────┘
              │                           │
              └─────────────┬─────────────┘
                            ▼
                 ┌─────────────────────┐
                 │       Database      │
                 │ Routes / Trips /    │
                 │ Predictions / Logs  │
                 └──────────┬──────────┘
                            │
                            ▼
                 ┌─────────────────────┐
                 │    Web Dashboard    │
                 │                     │
                 │ Students | Admin    │
                 └─────────────────────┘
```

---

## 🔄 How It Works

### Step 1 — Collect Data

The system collects transportation-related data such as:

* Bus location
* Timestamp
* Route
* Bus stop
* Previous trip information
* Historical travel time
* Passenger count/demand
* Day and time

### Step 2 — Process Data

The collected data is cleaned and transformed into useful features.

Example:

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

The ETA model estimates the remaining travel time between the bus's current location and the selected stop.

Example:

```text
Bus A
Current Location → 1.8 km from Stop 3

Predicted ETA → 6 minutes
```

### Step 4 — Predict Demand

Historical passenger patterns can be used to estimate expected demand.

Example:

```text
Route: Main Gate → Academic Block
Time: 8:30 AM

Expected Demand: High
```

### Step 5 — Display Results

The predictions are displayed through the web interface so students and administrators can easily understand the current transportation situation.

---

## 🧠 Machine Learning Approach

The project can use supervised machine learning models depending on the available dataset.

### ETA Prediction

Possible input features:

| Feature                | Description                 |
| ---------------------- | --------------------------- |
| Distance               | Remaining distance to stop  |
| Time                   | Current time                |
| Day                    | Day of the week             |
| Route                  | Current bus route           |
| Historical Travel Time | Average travel time         |
| Traffic/Delay          | Available delay information |
| Bus Speed              | Current/average speed       |

**Target:**

```text
Estimated Arrival Time / Remaining Travel Time
```

Possible models:

* Linear Regression
* Random Forest
* Gradient Boosting
* XGBoost

For an MVP, starting with **Random Forest or Gradient Boosting** is more practical than trying to build a complicated deep-learning model.

### Demand Prediction

Possible input features:

* Route
* Time of day
* Day of week
* Historical passenger count
* Academic schedule
* Special events
* Previous demand

**Target:**

```text
Expected Passenger Count / Demand Level
```

---

## 🛠️ Technology Stack

The exact stack can evolve during development.

### Frontend

* HTML
* CSS
* JavaScript
* React *(if used in the implementation)*

### Backend

* Node.js
* Express.js

### Machine Learning

* Python
* Pandas
* NumPy
* Scikit-learn

### Database

* PostgreSQL / MySQL

### Data & Location

* GPS/location data
* Route and stop data
* Historical transportation data

### Development Tools

* Git
* GitHub
* VS Code

---

## 📂 Project Structure

A possible project structure:

```text
smart-campus-bus/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
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

> The structure above is a suggested structure. Modify it according to the actual implementation of the project.

---

## 📊 Example Workflow

```text
Bus starts trip
      ↓
GPS/location data received
      ↓
Current bus position identified
      ↓
Route & nearest stop determined
      ↓
ETA model receives required features
      ↓
ETA predicted
      ↓
Demand model predicts expected demand
      ↓
Results stored/updated
      ↓
Student/Admin dashboard
```

---

## 📈 Example Output

### Bus Tracking

```text
Bus: RX-01
Route: Hostel → Main Gate
Current Stop: Hostel Gate

Next Stop: Academic Block
ETA: 5 minutes
Status: On Time
```

### Demand Prediction

```text
Route: Hostel → Academic Block
Time: 08:30 AM

Predicted Demand: HIGH
Expected Passengers: 42
```

---

## 🧪 MVP Scope

The first version of the project should focus on a small but functional implementation rather than trying to build a complete commercial transportation platform.

### MVP should include:

* [x] Basic campus routes
* [x] Bus and stop information
* [x] Basic location tracking/simulation
* [x] ETA prediction
* [x] Basic demand prediction
* [x] Student dashboard
* [x] Admin dashboard
* [x] Database integration

### Future Improvements

* [ ] Real GPS hardware integration
* [ ] Live map tracking
* [ ] Traffic-aware ETA
* [ ] Mobile application
* [ ] Push notifications
* [ ] Automatic route optimization
* [ ] Dynamic bus allocation
* [ ] Advanced crowd prediction
* [ ] Integration with campus timetable
* [ ] Historical analytics dashboard

---

## ⚠️ Limitations

The accuracy of the system depends heavily on the quality and quantity of available transportation data.

For example, an ETA model trained on a small simulated dataset will **not** provide genuinely reliable real-world predictions.

For a meaningful deployment, the system would require:

* Real bus GPS data
* Sufficient historical trips
* Reliable passenger-count data
* Accurate route/stop information
* Regular model evaluation and retraining

Therefore, the initial version should be treated as an **MVP/prototype**, not as a production-grade transportation prediction system.

---

## 🎓 Academic Purpose

This project demonstrates the practical application of:

* Machine Learning
* Data Processing
* Predictive Analytics
* Web Development
* Backend APIs
* Database Management
* GPS/Location Tracking
* Real-world Problem Solving

It combines these technologies into a single campus transportation use case.

---

## 👥 Team — RouteX

| Member                 | Role        |
| ---------------------- | ----------- |
| **Nitish Kumar Singh** | Team Leader |
| **Shivang Saxena**     | Team Member |
| **Piyush Panwar**      | Team Member |
| **Priyanshu Joshi**    | Team Member |
| **Prince Yadav**       | Team Member |

---

## 📌 Project Name

**Smart Campus Bus ETA & Demand Prediction System**

### Proposed Product Name

**CampusMove AI**

> Intelligent Campus Transportation — ETA Prediction, Demand Forecasting & Fleet Optimization.

---

## 📄 Project Status

🚧 **Currently under development — Mini Project / MVP**

The initial objective is to build a working prototype that demonstrates the complete flow:

```text
Data → Processing → ML Prediction → Backend → Dashboard
```

---

## ⭐ Future Vision

The long-term goal is to evolve the prototype into an intelligent campus transportation platform capable of helping students **know when their bus will arrive** while helping administrators **understand and optimize campus transportation demand**.

---

## 📜 License

This project is developed for **academic and educational purposes**.
