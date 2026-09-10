import { Flame, MapPin, Beaker } from "lucide-react";

import { SEVERITY_META, type FireEvent } from "@/lib/fire-core";
import { cn } from "@/lib/utils";

function relativeTime(iso: string) {
  const seconds = Math.max(1, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

export default function IncidentFeed({
  events,
  selectedId,
  onSelect,
}: {
  events: FireEvent[];
  selectedId?: string;
  onSelect: (event: FireEvent) => void;
}) {
  if (events.length === 0) {
    return (
      <div className="flex h-full min-h-[12rem] flex-col items-center justify-center gap-2 p-6 text-center">
        <Flame className="h-6 w-6 text-muted-foreground" />
        <p className="text-sm text-muted-foreground">
          No readings yet. Fire a test reading from the simulation panel.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-border">
      {events.map((event) => {
        const meta = SEVERITY_META[event.severity_level] ?? SEVERITY_META[1]!;
        return (
          <li key={event.id}>
            <button
              type="button"
              onClick={() => onSelect(event)}
              className={cn(
                "flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50",
                selectedId === event.id && "bg-accent/70",
              )}
            >
              <span
                className={cn("mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full", meta.dot)}
                aria-hidden
              />
              <span className="min-w-0 flex-1">
                <span className="flex items-baseline justify-between gap-2">
                  <span className={cn("text-sm font-semibold", meta.text)}>{event.fire_type}</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {relativeTime(event.created_at)}
                  </span>
                </span>
                <span className="mt-0.5 flex items-center gap-2 font-mono text-xs text-foreground/80">
                  {event.temperature_celsius.toFixed(1)}°C
                  <span className="text-muted-foreground">· {event.device_id}</span>
                  {event.simulated ? (
                    <span className="inline-flex items-center gap-1 rounded border border-border px-1 text-[10px] uppercase text-muted-foreground">
                      <Beaker className="h-2.5 w-2.5" /> sim
                    </span>
                  ) : null}
                </span>
                <span className="mt-1 flex items-start gap-1 text-xs text-muted-foreground">
                  <MapPin className="mt-0.5 h-3 w-3 shrink-0" />
                  <span className="line-clamp-2">
                    {event.resolved_address ??
                      `${event.latitude.toFixed(4)}, ${event.longitude.toFixed(4)}`}
                  </span>
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
