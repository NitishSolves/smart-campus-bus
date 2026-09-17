CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(120) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'driver', 'admin')),
  phone VARCHAR(32),
  default_stop_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE buses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  number VARCHAR(32) UNIQUE NOT NULL,
  capacity INTEGER NOT NULL CHECK (capacity > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'idle' CHECK (status IN ('idle', 'active', 'maintenance', 'offline')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE drivers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  license_no VARCHAR(64) NOT NULL,
  assigned_bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  assigned_route_id UUID,
  status VARCHAR(20) NOT NULL DEFAULT 'off_duty' CHECK (status IN ('off_duty', 'on_duty', 'on_trip')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(16) UNIQUE NOT NULL,
  name VARCHAR(120) NOT NULL,
  start_name VARCHAR(120) NOT NULL,
  end_name VARCHAR(120) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  path JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE drivers
  ADD CONSTRAINT drivers_assigned_route_fk
  FOREIGN KEY (assigned_route_id) REFERENCES routes(id) ON DELETE SET NULL;

CREATE TABLE stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(120) UNIQUE NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE users
  ADD CONSTRAINT users_default_stop_fk
  FOREIGN KEY (default_stop_id) REFERENCES stops(id) ON DELETE SET NULL;

CREATE TABLE route_stops (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  stop_order INTEGER NOT NULL CHECK (stop_order >= 1),
  dwell_seconds INTEGER NOT NULL DEFAULT 20,
  UNIQUE (route_id, stop_id),
  UNIQUE (route_id, stop_order)
);

CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bus_id UUID NOT NULL REFERENCES buses(id),
  driver_id UUID NOT NULL REFERENCES drivers(id),
  route_id UUID NOT NULL REFERENCES routes(id),
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'active', 'delayed', 'completed', 'cancelled')),
  occupancy INTEGER NOT NULL DEFAULT 0 CHECK (occupancy >= 0),
  delay_minutes INTEGER NOT NULL DEFAULT 0,
  delay_reason TEXT,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  current_stop_index INTEGER NOT NULL DEFAULT 0,
  progress DOUBLE PRECISION NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE bus_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  speed_kmh DOUBLE PRECISION NOT NULL DEFAULT 18,
  heading DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE eta_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  eta_minutes DOUBLE PRECISION NOT NULL,
  remaining_distance_m DOUBLE PRECISION NOT NULL,
  method VARCHAR(40) NOT NULL DEFAULT 'distance_speed_blend',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE demand_predictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  hour_of_day INTEGER NOT NULL CHECK (hour_of_day BETWEEN 0 AND 23),
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  predicted_passengers INTEGER NOT NULL,
  level VARCHAR(16) NOT NULL CHECK (level IN ('low', 'medium', 'high')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE historical_demand (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  hour_of_day INTEGER NOT NULL,
  day_of_week INTEGER NOT NULL,
  passenger_count INTEGER NOT NULL,
  recorded_on DATE NOT NULL DEFAULT CURRENT_DATE
);

CREATE TABLE historical_segment_times (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id UUID NOT NULL REFERENCES routes(id) ON DELETE CASCADE,
  from_stop_id UUID NOT NULL REFERENCES stops(id),
  to_stop_id UUID NOT NULL REFERENCES stops(id),
  avg_seconds INTEGER NOT NULL,
  sample_count INTEGER NOT NULL DEFAULT 1
);

CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(32) NOT NULL CHECK (type IN ('arrival', 'delay', 'cancellation', 'announcement', 'emergency')),
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  related_bus_id UUID REFERENCES buses(id) ON DELETE SET NULL,
  related_route_id UUID REFERENCES routes(id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_type VARCHAR(16) NOT NULL CHECK (target_type IN ('route', 'stop', 'bus')),
  target_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, target_type, target_id)
);

CREATE TABLE announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(160) NOT NULL,
  body TEXT NOT NULL,
  severity VARCHAR(16) NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE emergency_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  bus_id UUID NOT NULL REFERENCES buses(id) ON DELETE CASCADE,
  driver_id UUID NOT NULL REFERENCES drivers(id) ON DELETE CASCADE,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'acknowledged', 'resolved')),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_trips_status ON trips(status);
CREATE INDEX idx_trips_route ON trips(route_id);
CREATE INDEX idx_trips_bus ON trips(bus_id);
CREATE INDEX idx_trips_driver ON trips(driver_id);
CREATE INDEX idx_bus_locations_trip_time ON bus_locations(trip_id, recorded_at DESC);
CREATE INDEX idx_notifications_user ON notifications(user_id, created_at DESC);
CREATE INDEX idx_favorites_user ON favorites(user_id);
CREATE INDEX idx_eta_trip ON eta_predictions(trip_id, created_at DESC);
CREATE INDEX idx_demand_route ON demand_predictions(route_id, day_of_week, hour_of_day);
CREATE INDEX idx_route_stops_route ON route_stops(route_id, stop_order);
CREATE INDEX idx_emergency_alerts_status ON emergency_alerts(status);
CREATE INDEX idx_emergency_alerts_trip ON emergency_alerts(trip_id);
CREATE INDEX idx_emergency_alerts_created ON emergency_alerts(created_at DESC);
CREATE INDEX idx_bus_locations_bus ON bus_locations(bus_id);
CREATE INDEX idx_announcements_active ON announcements(is_active, created_at DESC);
