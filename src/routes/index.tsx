import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ClientOnly } from "@tanstack/react-router";
import { Suspense, lazy, useEffect, useMemo, useState } from "react";
import {
  Flame,
  Activity,
  Siren,
  Radar,
  ThermometerSun,
  Clock,
  PhoneCall,
} from "lucide-react";
import { toast } from "sonner";

import CallLog from "@/components/CallLog";
import EmergencyCallForm, { type EmergencyCallInput } from "@/components/EmergencyCallForm";
import IncidentFeed from "@/components/IncidentFeed";
import SimulationPanel, { type SimulationInput } from "@/components/SimulationPanel";
import StationCards from "@/components/StationCards";
import TempGauge from "@/components/TempGauge";
import { SeverityBreakdown, TemperatureTrend } from "@/components/TelemetryCharts";
import { Toaster } from "@/components/ui/sonner";
import {
  detectFire,
  listEmergencyCalls,
  listEvents,
  listStations,
  lookupStations,
  placeEmergencyCall,
  updateCallStatus,
} from "@/lib/fire.functions";
import {
  SEVERITY_META,
  haversineKm,
  type CallStatus,
  type FireEvent,
  type FireStation,
} from "@/lib/fire-core";
import { cn } from "@/lib/utils";

const IncidentMap = lazy(() => import("@/components/IncidentMap"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flame Detector AI — Live Fire Detection Dashboard" },
      {
        name: "description",
        content:
          "Real-time fire detection command centre: live incident feed, severity classification, temperature telemetry, nearest fire station contacts and a sensor simulator.",
      },
      { property: "og:title", content: "Flame Detector AI — Live Fire Detection Dashboard" },
      {
        property: "og:description",
        content:
          "Monitor flame sensor readings, classify Local, Industrial and Wildfire events, and dispatch alerts to the nearest fire station.",
      },
    ],
  }),
  component: Dashboard,
});

function Panel({
  title,
  icon,
  right,
  className,
  bodyClassName,
  id,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  right?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  id?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("panel-surface flex flex-col overflow-hidden rounded-xl", className)}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-4 py-2.5">
        <h2 className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          {icon}
          {title}
        </h2>
        {right}
      </header>
      <div className={cn("min-h-0", bodyClassName)}>{children}</div>
    </section>
  );
}

function StatTile({
  label,
  value,
  tone,
  icon,
}: {
  label: string;
  value: string;
  tone?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="panel-surface rounded-xl px-4 py-3">
      <p className="flex items-center gap-1.5 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
        {icon}
        {label}
      </p>
      <p className={cn("mt-1 font-mono text-2xl font-semibold", tone)}>{value}</p>
    </div>
  );
}

function Dashboard() {
  const queryClient = useQueryClient();
  const fetchEvents = useServerFn(listEvents);
  const fetchStations = useServerFn(listStations);
  const fetchNearby = useServerFn(lookupStations);
  const runDetect = useServerFn(detectFire);
  const fetchCalls = useServerFn(listEmergencyCalls);
  const runCall = useServerFn(placeEmergencyCall);
  const runStatus = useServerFn(updateCallStatus);

  const callsQuery = useQuery({
    queryKey: ["emergency-calls"],
    queryFn: () => fetchCalls(),
    refetchInterval: 15000,
  });
  const calls = callsQuery.data ?? [];

  const callMutation = useMutation({
    mutationFn: (input: EmergencyCallInput) => runCall({ data: input }),
    onSuccess: (call) => {
      void queryClient.invalidateQueries({ queryKey: ["emergency-calls"] });
      toast("Emergency call logged", {
        description: call.dispatched_station_name
          ? `Routed to ${call.dispatched_station_name}${
              call.dispatched_station_distance_km != null
                ? ` (${call.dispatched_station_distance_km.toFixed(1)} km)`
                : ""
            }`
          : "No station could be matched automatically.",
      });
    },
    onError: (error: Error) => toast.error("Call failed", { description: error.message }),
  });

  const statusMutation = useMutation({
    mutationFn: (vars: { id: string; status: CallStatus }) => runStatus({ data: vars }),
    onSuccess: (call) => {
      void queryClient.invalidateQueries({ queryKey: ["emergency-calls"] });
      toast(`Call marked ${call.status}`);
    },
    onError: (error: Error) => toast.error("Update failed", { description: error.message }),
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);

  const eventsQuery = useQuery({
    queryKey: ["fire-events"],
    queryFn: () => fetchEvents(),
    refetchInterval: 15000,
  });
  const stationsQuery = useQuery({
    queryKey: ["fire-stations"],
    queryFn: () => fetchStations(),
    staleTime: Infinity,
  });

  const events = useMemo(() => eventsQuery.data ?? [], [eventsQuery.data]);
  const stations = stationsQuery.data ?? [];

  const selected: FireEvent | null =
    events.find((e) => e.id === selectedId) ?? events[0] ?? null;

  const nearbyQuery = useQuery({
    queryKey: ["nearby", selected?.id],
    queryFn: () =>
      fetchNearby({
        data: { latitude: selected!.latitude, longitude: selected!.longitude },
      }),
    enabled: Boolean(selected),
  });

  const nearby: FireStation[] = useMemo(() => {
    if (nearbyQuery.data) return nearbyQuery.data;
    if (!selected) return [];
    return stations
      .map((s) => ({
        ...s,
        distance_km: haversineKm(selected.latitude, selected.longitude, s.latitude, s.longitude),
      }))
      .sort((a, b) => a.distance_km - b.distance_km)
      .slice(0, 3);
  }, [nearbyQuery.data, selected, stations]);

  const detectMutation = useMutation({
    mutationFn: (input: SimulationInput) =>
      runDetect({
        data: {
          deviceId: input.deviceId,
          temperatureCelsius: input.temperatureCelsius,
          latitude: input.latitude,
          longitude: input.longitude,
          simulated: input.simulated,
        },
      }),
    onSuccess: (result) => {
      setSelectedId(result.event.id);
      void queryClient.invalidateQueries({ queryKey: ["fire-events"] });
      const meta = SEVERITY_META[result.event.severity_level]!;
      toast(`${meta.label} detected · ${result.event.temperature_celsius}°C`, {
        description:
          result.event.nearest_station_name != null
            ? `Alert routed to ${result.event.nearest_station_name} (${result.event.nearest_station_distance_km?.toFixed(1)} km)`
            : "No station could be matched automatically.",
      });
    },
    onError: (error: Error) => toast.error("Reading failed", { description: error.message }),
  });

  const [clock, setClock] = useState<string>("");
  useEffect(() => {
    const tick = () => setClock(new Date().toUTCString().slice(17, 25) + " UTC");
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  const activeCritical = events.filter((e) => e.severity_level >= 2).length;
  const peak = events.length ? Math.max(...events.map((e) => e.temperature_celsius)) : 0;
  const alertsSent = events.filter((e) => e.alert_sent).length;
  const openCalls = calls.filter((c) => c.status !== "resolved").length;

  return (
    <div className="min-h-screen">
      <Toaster position="top-right" />
      <header className="border-b border-border bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-[110rem] flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-primary/50 bg-primary/10">
              <Flame className="h-5 w-5 text-primary" />
            </span>
            <div>
              <h1 className="font-display text-base font-bold tracking-tight sm:text-lg">
                Flame Detector AI
              </h1>
              <p className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                Fire detection command centre
              </p>
            </div>
          </div>
          <nav className="flex items-center gap-1 text-xs">
            <a
              href="#overview"
              className="rounded border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              Overview
            </a>
            <a
              href="#emergency"
              className="rounded border border-primary/60 bg-primary/10 px-2.5 py-1 font-medium text-primary transition-colors hover:bg-primary/20"
            >
              <PhoneCall className="mr-1 inline h-3 w-3" />
              Emergency calls
            </a>
            <a
              href="#stations"
              className="rounded border border-border px-2.5 py-1 text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
            >
              Stations
            </a>
          </nav>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="live-dot h-2 w-2 rounded-full bg-sev-0 text-sev-0" aria-hidden />
              Live · polling every 15s
            </span>
            <span className="hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:flex">
              <Clock className="h-3 w-3" />
              {clock}
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-[110rem] space-y-4 px-4 py-4 sm:px-6">
        <div id="overview" className="grid scroll-mt-20 grid-cols-2 gap-3 lg:grid-cols-5">
          <StatTile
            label="Open emergency calls"
            value={String(openCalls)}
            tone="text-primary"
            icon={<PhoneCall className="h-3 w-3" />}
          />
          <StatTile
            label="Incidents logged"
            value={String(events.length)}
            icon={<Activity className="h-3 w-3" />}
          />
          <StatTile
            label="Critical active"
            value={String(activeCritical)}
            tone="text-sev-3"
            icon={<Siren className="h-3 w-3" />}
          />
          <StatTile
            label="Peak temperature"
            value={`${Math.round(peak)}°C`}
            tone="text-sev-2"
            icon={<ThermometerSun className="h-3 w-3" />}
          />
          <StatTile
            label="Alerts dispatched"
            value={String(alertsSent)}
            tone="text-primary"
            icon={<Radar className="h-3 w-3" />}
          />
        </div>

        <div className="grid gap-4 xl:grid-cols-[22rem_minmax(0,1fr)_22rem]">
          <div className="flex min-h-0 flex-col gap-4">
            <Panel
              title="Live incident feed"
              icon={<Activity className="h-3.5 w-3.5" />}
              right={
                <span className="font-mono text-[10px] text-muted-foreground">
                  {events.length} events
                </span>
              }
              bodyClassName="max-h-[26rem] flex-1 overflow-y-auto"
            >
              <IncidentFeed
                events={events}
                selectedId={selected?.id}
                onSelect={(e) => setSelectedId(e.id)}
              />
            </Panel>

            <Panel title="Simulation panel" icon={<Radar className="h-3.5 w-3.5" />}>
              <SimulationPanel
                onRun={(input) => detectMutation.mutate(input)}
                pending={detectMutation.isPending}
              />
            </Panel>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <Panel
              title="Incident map"
              icon={<Flame className="h-3.5 w-3.5" />}
              right={
                <span className="flex items-center gap-3 text-[10px] text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sev-1" /> Local
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sev-2" /> Industrial
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-sev-3" /> Wildfire
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-2 w-2 rounded-sm bg-info" /> Station
                  </span>
                </span>
              }
              bodyClassName="h-[26rem]"
            >
              <ClientOnly
                fallback={<div className="h-full w-full animate-pulse bg-muted/40" />}
              >
                <Suspense fallback={<div className="h-full w-full animate-pulse bg-muted/40" />}>
                  <IncidentMap
                    events={events}
                    stations={stations}
                    selected={selected}
                    onSelect={(e) => setSelectedId(e.id)}
                  />
                </Suspense>
              </ClientOnly>
            </Panel>

            <div className="grid gap-4 md:grid-cols-2">
              <Panel
                title="Temperature telemetry"
                icon={<ThermometerSun className="h-3.5 w-3.5" />}
                bodyClassName="p-2"
              >
                <TemperatureTrend events={events} />
              </Panel>
              <Panel
                title="Severity breakdown"
                icon={<Siren className="h-3.5 w-3.5" />}
                bodyClassName="p-2"
              >
                <SeverityBreakdown events={events} />
              </Panel>
            </div>
          </div>

          <div className="flex min-h-0 flex-col gap-4">
            <Panel title="Thermal gauge" icon={<ThermometerSun className="h-3.5 w-3.5" />}>
              <div className="flex flex-col items-center gap-3 p-4">
                <TempGauge temperature={selected?.temperature_celsius ?? 0} />
                <dl className="w-full space-y-1.5 border-t border-border pt-3 text-xs">
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Device</dt>
                    <dd className="font-mono">{selected?.device_id ?? "—"}</dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Coordinates</dt>
                    <dd className="font-mono">
                      {selected
                        ? `${selected.latitude.toFixed(4)}, ${selected.longitude.toFixed(4)}`
                        : "—"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="shrink-0 text-muted-foreground">Address</dt>
                    <dd className="line-clamp-2 text-right">
                      {selected?.resolved_address ?? "Resolving unavailable"}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-2">
                    <dt className="text-muted-foreground">Detected</dt>
                    <dd className="font-mono">
                      {selected ? new Date(selected.created_at).toLocaleString() : "—"}
                    </dd>
                  </div>
                </dl>
              </div>
            </Panel>

            <Panel title="Dispatch alert" icon={<Siren className="h-3.5 w-3.5" />}>
              <pre className="max-h-56 overflow-auto whitespace-pre-wrap p-4 font-mono text-[11px] leading-relaxed text-foreground/85">
                {selected?.alert_message ??
                  "No alert generated for the selected reading (no fire condition)."}
              </pre>
            </Panel>
          </div>
        </div>

        <div id="emergency" className="grid gap-4 scroll-mt-20 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <Panel title="Contact fire department" icon={<PhoneCall className="h-3.5 w-3.5" />}>
            <EmergencyCallForm
              onSubmit={(input) => callMutation.mutate(input)}
              pending={callMutation.isPending}
              {...(selected
                ? { defaultLatitude: selected.latitude, defaultLongitude: selected.longitude }
                : {})}
            />
          </Panel>

          <Panel
            title="Emergency call log"
            icon={<Siren className="h-3.5 w-3.5" />}
            right={
              <span className="font-mono text-[10px] text-muted-foreground">
                {openCalls} open · {calls.length} total
              </span>
            }
            bodyClassName="max-h-[34rem] overflow-auto"
          >
            <CallLog
              calls={calls}
              pendingId={statusMutation.variables?.id}
              onStatusChange={(id, status) => statusMutation.mutate({ id, status })}
            />
          </Panel>
        </div>

        <Panel title="Nearest fire stations" icon={<Radar className="h-3.5 w-3.5" />}>
          <StationCards stations={nearby} />
        </Panel>

        <Panel
          title="Station directory"
          icon={<Radar className="h-3.5 w-3.5" />}
          className="scroll-mt-20"
          id="stations"
        >
          <StationCards stations={stations} />
        </Panel>

        <footer className="pb-6 pt-2 text-center text-[11px] text-muted-foreground">
          Classification thresholds — Local Fire &lt;500°C · Industrial Fire 500–2000°C · Wildfire
          &gt;2000°C. Addresses resolved via OpenStreetMap.
        </footer>
      </main>
    </div>
  );
}
