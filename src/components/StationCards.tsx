import { Phone, Navigation, Building2 } from "lucide-react";

import type { FireStation } from "@/lib/fire-core";

export default function StationCards({ stations }: { stations: FireStation[] }) {
  if (stations.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        Select an incident to see the closest responding stations.
      </p>
    );
  }

  return (
    <div className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-3">
      {stations.map((station, index) => (
        <article
          key={station.id}
          className="rounded-lg border border-border bg-card/70 p-4 transition-colors hover:border-primary/60"
        >
          <div className="flex items-start justify-between gap-2">
            <h3 className="text-sm font-semibold leading-tight text-foreground">{station.name}</h3>
            {index === 0 ? (
              <span className="shrink-0 rounded border border-primary/50 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-primary">
                Nearest
              </span>
            ) : null}
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-xs text-muted-foreground">
            <Building2 className="mt-0.5 h-3 w-3 shrink-0" />
            {station.address}
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3 text-xs">
            {station.phone ? (
              <a
                href={`tel:${station.phone.replace(/\s/g, "")}`}
                className="inline-flex items-center gap-1.5 font-mono text-primary hover:underline"
              >
                <Phone className="h-3 w-3" />
                {station.phone}
              </a>
            ) : null}
            {station.distance_km !== undefined ? (
              <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground">
                <Navigation className="h-3 w-3" />
                {station.distance_km.toFixed(2)} km
              </span>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}
