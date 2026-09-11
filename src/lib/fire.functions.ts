import { createServerFn } from "@tanstack/react-start";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { z } from "zod";

import {
  classifyTemperature,
  haversineKm,
  type EmergencyCall,
  type FireEvent,
  type FireStation,
} from "./fire-core";

function serverClient(): SupabaseClient {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`) {
          h.delete("Authorization");
        }
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`;
    const res = await fetch(url, {
      headers: { "User-Agent": "FlameDetectorAI/1.0 (dashboard)", Accept: "application/json" },
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { display_name?: string };
    return data.display_name ?? null;
  } catch {
    return null;
  }
}

function buildAlertMessage(args: {
  fireType: string;
  temperature: number;
  address: string | null;
  latitude: number;
  longitude: number;
  station: FireStation | null;
}): string {
  const { fireType, temperature, address, latitude, longitude, station } = args;
  const lines = [
    `FIRE ALERT — ${fireType.toUpperCase()} DETECTED`,
    `Temperature: ${temperature}°C`,
    `Location: ${address ?? `Lat: ${latitude}, Lng: ${longitude}`}`,
    `Map: https://www.google.com/maps?q=${latitude},${longitude}`,
  ];
  if (station) {
    lines.push(
      `Nearest Fire Station: ${station.name} (${station.distance_km?.toFixed(2)} km away) — ${station.address}`,
    );
    if (station.phone) lines.push(`Station Contact: ${station.phone}`);
  } else {
    lines.push("Nearest Fire Station: could not be determined automatically.");
  }
  return lines.join("\n");
}

async function nearestStations(
  supabase: SupabaseClient,
  lat: number,
  lng: number,
  count = 3,
): Promise<FireStation[]> {
  const { data } = await supabase.from("fire_stations").select("*");
  const stations = (data ?? []) as FireStation[];
  return stations
    .map((s) => ({ ...s, distance_km: haversineKm(lat, lng, s.latitude, s.longitude) }))
    .sort((a, b) => (a.distance_km ?? 0) - (b.distance_km ?? 0))
    .slice(0, count);
}

const readingSchema = z.object({
  deviceId: z.string().min(1).max(64).default("SENSOR-01"),
  temperatureCelsius: z.number().min(-50).max(5000),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  simulated: z.boolean().default(false),
});

/** Ingestion endpoint — mirrors POST /api/detect from the FastAPI backend. */
export const detectFire = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => readingSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const classification = classifyTemperature(data.temperatureCelsius);

    const [address, stations] = await Promise.all([
      reverseGeocode(data.latitude, data.longitude),
      nearestStations(supabase, data.latitude, data.longitude),
    ]);
    const station = stations[0] ?? null;

    const alertMessage =
      classification.severityLevel >= 1
        ? buildAlertMessage({
            fireType: classification.fireType,
            temperature: data.temperatureCelsius,
            address,
            latitude: data.latitude,
            longitude: data.longitude,
            station,
          })
        : null;

    const { data: inserted, error } = await supabase
      .from("fire_events")
      .insert({
        device_id: data.deviceId,
        temperature_celsius: data.temperatureCelsius,
        fire_type: classification.fireType,
        severity_level: classification.severityLevel,
        latitude: data.latitude,
        longitude: data.longitude,
        resolved_address: address,
        nearest_station_name: station?.name ?? null,
        nearest_station_address: station?.address ?? null,
        nearest_station_phone: station?.phone ?? null,
        nearest_station_distance_km: station?.distance_km ?? null,
        nearest_station_lat: station?.latitude ?? null,
        nearest_station_lng: station?.longitude ?? null,
        alert_message: alertMessage,
        alert_sent: alertMessage !== null,
        simulated: data.simulated,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);

    return {
      event: inserted as FireEvent,
      stations,
      description: classification.description,
    };
  });

/** Recent events, newest first — mirrors GET /api/events. */
export const listEvents = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase
    .from("fire_events")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return (data ?? []) as FireEvent[];
});

/** Full station directory for the lookup cards. */
export const listStations = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase.from("fire_stations").select("*").order("city");
  if (error) throw new Error(error.message);
  return (data ?? []) as FireStation[];
});

const callSchema = z.object({
  callerName: z.string().min(2).max(80),
  callerPhone: z.string().min(5).max(32),
  locationText: z.string().max(200).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  emergencyType: z.string().min(2).max(60),
  urgencyLevel: z.number().int().min(1).max(4),
  notes: z.string().max(500).optional(),
});

/** Places an emergency call and attaches the nearest responding station. */
export const placeEmergencyCall = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => callSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const [address, stations] = await Promise.all([
      data.locationText ? Promise.resolve(data.locationText) : reverseGeocode(data.latitude, data.longitude),
      nearestStations(supabase, data.latitude, data.longitude, 1),
    ]);
    const station = stations[0] ?? null;

    const { data: inserted, error } = await supabase
      .from("emergency_calls")
      .insert({
        caller_name: data.callerName,
        caller_phone: data.callerPhone,
        location_text: address,
        latitude: data.latitude,
        longitude: data.longitude,
        emergency_type: data.emergencyType,
        urgency_level: data.urgencyLevel,
        notes: data.notes ?? null,
        status: "pending",
        dispatched_station_name: station?.name ?? null,
        dispatched_station_phone: station?.phone ?? null,
        dispatched_station_distance_km: station?.distance_km ?? null,
      })
      .select()
      .single();

    if (error) throw new Error(error.message);
    return inserted as unknown as EmergencyCall;
  });

/** Emergency call log, newest first. */
export const listEmergencyCalls = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = serverClient();
  const { data, error } = await supabase
    .from("emergency_calls")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as unknown as EmergencyCall[];
});

const statusSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(["pending", "dispatched", "resolved"]),
});

/** Operator action: move a call between Pending / Dispatched / Resolved. */
export const updateCallStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => statusSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    const { data: updated, error } = await supabase
      .from("emergency_calls")
      .update({ status: data.status })
      .eq("id", data.id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return updated as unknown as EmergencyCall;
  });

const lookupSchema = z.object({ latitude: z.number(), longitude: z.number() });

/** Nearest three stations to an arbitrary point. */
export const lookupStations = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }) => {
    const supabase = serverClient();
    return nearestStations(supabase, data.latitude, data.longitude, 3);
  });
