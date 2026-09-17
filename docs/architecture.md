# Smart Campus Bus architecture

Student, driver and admin clients talk to a Node/Express API on port 3001.
PostgreSQL stores buses, routes, stops, trips, locations, ETA snapshots,
demand history, favorites and notifications.

Location flow:

Driver device GPS, driver-triggered simulation, or the demo simulator
-> recordLocation(source) -> bus_locations
-> Socket.IO tracking:update -> live map and ETA panel.

Sources are registered in `backend/src/services/locationSources.js`.
The demo simulator never overwrites a trip that is reporting device GPS.

ETA = remaining path distance / estimated speed, blended with historical
segment travel times and current delay minutes.

Demand = average historical passenger counts for route + hour + weekday,
mapped to low / medium / high. Not described as AI.
