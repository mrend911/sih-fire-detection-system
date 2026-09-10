import { MapContainer, TileLayer, CircleMarker, Popup, useMap, Marker } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { SEVERITY_META, type FireEvent, type FireStation } from "@/lib/fire-core";

const stationIcon = L.divIcon({
  className: "",
  html: `<div style="width:14px;height:14px;border-radius:3px;background:#38bdf8;border:2px solid #0b1220;box-shadow:0 0 8px #38bdf8"></div>`,
  iconSize: [14, 14],
  iconAnchor: [7, 7],
});

function Recenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], Math.max(map.getZoom(), 11), { duration: 0.8 });
  }, [lat, lng, map]);
  return null;
}

export default function IncidentMap({
  events,
  stations,
  selected,
  onSelect,
}: {
  events: FireEvent[];
  stations: FireStation[];
  selected: FireEvent | null;
  onSelect: (event: FireEvent) => void;
}) {
  const center: [number, number] = selected
    ? [selected.latitude, selected.longitude]
    : events[0]
      ? [events[0].latitude, events[0].longitude]
      : [23.0225, 72.5714];

  return (
    <MapContainer
      center={center}
      zoom={10}
      scrollWheelZoom
      className="h-full w-full"
      style={{ background: "#0b0b0f" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        className="map-tiles-dark"
      />
      {selected ? <Recenter lat={selected.latitude} lng={selected.longitude} /> : null}

      {stations.map((station) => (
        <Marker key={station.id} position={[station.latitude, station.longitude]} icon={stationIcon}>
          <Popup>
            <strong>{station.name}</strong>
            <br />
            {station.address}
            {station.phone ? (
              <>
                <br />
                {station.phone}
              </>
            ) : null}
          </Popup>
        </Marker>
      ))}

      {events.map((event) => {
        const meta = SEVERITY_META[event.severity_level] ?? SEVERITY_META[1]!;
        const isSelected = selected?.id === event.id;
        return (
          <CircleMarker
            key={event.id}
            center={[event.latitude, event.longitude]}
            radius={isSelected ? 14 : 7 + event.severity_level * 2}
            pathOptions={{
              color: meta.color,
              fillColor: meta.color,
              fillOpacity: isSelected ? 0.55 : 0.3,
              weight: isSelected ? 3 : 1.5,
            }}
            eventHandlers={{ click: () => onSelect(event) }}
          >
            <Popup>
              <strong>{event.fire_type}</strong>
              <br />
              {event.temperature_celsius}°C · {event.device_id}
              <br />
              {event.resolved_address ?? `${event.latitude}, ${event.longitude}`}
            </Popup>
          </CircleMarker>
        );
      })}
    </MapContainer>
  );
}
