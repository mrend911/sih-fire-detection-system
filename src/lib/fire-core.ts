// Browser-safe fire domain logic, ported from the FastAPI backend
// (app/fire_classifier.py + app/config.py thresholds).

export const LOCAL_FIRE_MAX = 500;
export const INDUSTRIAL_FIRE_MAX = 2000;
export const MAX_GAUGE_TEMP = 3000;

export type FireType = "No Fire / Normal" | "Local Fire" | "Industrial Fire" | "Wildfire";

export interface Classification {
  fireType: FireType;
  severityLevel: 0 | 1 | 2 | 3;
  description: string;
}

export function classifyTemperature(temperatureCelsius: number): Classification {
  if (temperatureCelsius <= 0) {
    return {
      fireType: "No Fire / Normal",
      severityLevel: 0,
      description: "Temperature within normal ambient range.",
    };
  }
  if (temperatureCelsius <= LOCAL_FIRE_MAX) {
    return {
      fireType: "Local Fire",
      severityLevel: 1,
      description: "Contained fire — household, vehicle or small structure scale.",
    };
  }
  if (temperatureCelsius <= INDUSTRIAL_FIRE_MAX) {
    return {
      fireType: "Industrial Fire",
      severityLevel: 2,
      description: "High-intensity burn consistent with plant, fuel or chemical fire.",
    };
  }
  return {
    fireType: "Wildfire",
    severityLevel: 3,
    description: "Extreme thermal signature — large-area uncontrolled burn.",
  };
}

export const SEVERITY_META: Record<
  number,
  { label: string; color: string; ring: string; text: string; dot: string }
> = {
  0: {
    label: "Normal",
    color: "var(--sev-0)",
    ring: "border-[color:var(--sev-0)]/40",
    text: "text-[color:var(--sev-0)]",
    dot: "bg-[color:var(--sev-0)]",
  },
  1: {
    label: "Local Fire",
    color: "var(--sev-1)",
    ring: "border-[color:var(--sev-1)]/40",
    text: "text-[color:var(--sev-1)]",
    dot: "bg-[color:var(--sev-1)]",
  },
  2: {
    label: "Industrial Fire",
    color: "var(--sev-2)",
    ring: "border-[color:var(--sev-2)]/40",
    text: "text-[color:var(--sev-2)]",
    dot: "bg-[color:var(--sev-2)]",
  },
  3: {
    label: "Wildfire",
    color: "var(--sev-3)",
    ring: "border-[color:var(--sev-3)]/40",
    text: "text-[color:var(--sev-3)]",
    dot: "bg-[color:var(--sev-3)]",
  },
};

export interface FireEvent {
  id: string;
  device_id: string | null;
  temperature_celsius: number;
  fire_type: string;
  severity_level: number;
  latitude: number;
  longitude: number;
  resolved_address: string | null;
  nearest_station_name: string | null;
  nearest_station_address: string | null;
  nearest_station_phone: string | null;
  nearest_station_distance_km: number | null;
  nearest_station_lat: number | null;
  nearest_station_lng: number | null;
  alert_message: string | null;
  alert_sent: boolean;
  simulated: boolean;
  created_at: string;
}

export interface FireStation {
  id: string;
  name: string;
  address: string;
  phone: string | null;
  latitude: number;
  longitude: number;
  city: string | null;
  distance_km?: number;
}

export function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export const SIM_PRESETS: { id: string; label: string; range: [number, number] }[] = [
  { id: "local", label: "Local Fire", range: [40, 499] },
  { id: "industrial", label: "Industrial Fire", range: [501, 1999] },
  { id: "wildfire", label: "Wildfire", range: [2001, 3000] },
];
