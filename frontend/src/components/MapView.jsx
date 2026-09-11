import { MapContainer, TileLayer, Marker, Popup, Polyline, CircleMarker, useMap } from 'react-leaflet';
import L from 'leaflet';
import { useEffect, useRef } from 'react';

const busIcon = L.divIcon({
  className: '',
  html: `<div style="width:28px;height:28px;border-radius:999px;background:#2563EB;border:3px solid white;box-shadow:0 2px 8px rgba(15,23,42,.25);display:flex;align-items:center;justify-content:center;color:white;font-size:12px;font-weight:700;">B</div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function FitBounds({ points }) {
  const map = useMap();
  const fitted = useRef(false);
  useEffect(() => {
    if (!points?.length || fitted.current) return;
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 16 });
    fitted.current = true;
  }, [map, points]);
  return null;
}

export default function MapView({ buses = [], stops = [], selectedId, path = [], onSelect }) {
  const center = buses[0]
    ? [buses[0].lat, buses[0].lng]
    : stops[0]
      ? [Number(stops[0].lat), Number(stops[0].lng)]
      : [12.9752, 77.5948];
  const fitPoints = [
    ...buses.map((b) => ({ lat: b.lat, lng: b.lng })),
    ...stops.map((s) => ({ lat: Number(s.lat), lng: Number(s.lng) })),
    ...path,
  ].filter((p) => p.lat && p.lng);

  return (
    <MapContainer center={center} zoom={16} scrollWheelZoom className="h-full w-full rounded-2xl">
      <TileLayer
        attribution='&copy; OpenStreetMap'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {fitPoints.length > 1 && <FitBounds points={fitPoints} />}
      {path.length > 1 && (
        <Polyline positions={path.map((p) => [p.lat, p.lng])} pathOptions={{ color: '#2563EB', weight: 5, opacity: 0.7 }} />
      )}
      {stops.map((stop) => (
        <CircleMarker
          key={stop.id}
          center={[Number(stop.lat), Number(stop.lng)]}
          radius={8}
          pathOptions={{ color: '#0F172A', fillColor: '#FFFFFF', fillOpacity: 1, weight: 2 }}
        >
          <Popup>{stop.name}</Popup>
        </CircleMarker>
      ))}
      {buses.map((bus) => (
        <Marker
          key={bus.tripId || bus.busId}
          position={[bus.lat, bus.lng]}
          icon={busIcon}
          eventHandlers={{ click: () => onSelect?.(bus) }}
        >
          <Popup>
            <strong>{bus.busNumber}</strong>
            <div>Route {bus.routeCode}</div>
            <div>{Math.round(bus.etaMinutes)} min · {bus.nextStop?.name}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
