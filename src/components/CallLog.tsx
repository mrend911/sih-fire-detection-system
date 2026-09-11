import { Phone, Siren, CheckCheck } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  STATUS_META,
  URGENCY_META,
  type CallStatus,
  type EmergencyCall,
} from "@/lib/fire-core";
import { cn } from "@/lib/utils";

export default function CallLog({
  calls,
  onStatusChange,
  pendingId,
}: {
  calls: EmergencyCall[];
  onStatusChange: (id: string, status: CallStatus) => void;
  pendingId?: string | undefined;
}) {
  if (calls.length === 0) {
    return (
      <p className="px-4 py-6 text-sm text-muted-foreground">
        No emergency calls yet. Place one from the contact panel to see it here.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[52rem] text-left text-xs">
        <thead className="border-b border-border text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          <tr>
            <th className="px-4 py-2 font-medium">Caller</th>
            <th className="px-4 py-2 font-medium">Emergency</th>
            <th className="px-4 py-2 font-medium">Location</th>
            <th className="px-4 py-2 font-medium">Received</th>
            <th className="px-4 py-2 font-medium">Status</th>
            <th className="px-4 py-2 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {calls.map((call) => {
            const status = STATUS_META[call.status] ?? STATUS_META['pending']!;
            const urgency = URGENCY_META[call.urgency_level] ?? URGENCY_META[1]!;
            const busy = pendingId === call.id;
            return (
              <tr key={call.id} className="border-b border-border/60 last:border-0">
                <td className="px-4 py-2.5">
                  <p className="font-medium text-foreground">{call.caller_name}</p>
                  <a
                    href={`tel:${call.caller_phone.replace(/\s/g, "")}`}
                    className="font-mono text-[11px] text-primary hover:underline"
                  >
                    {call.caller_phone}
                  </a>
                </td>
                <td className="px-4 py-2.5">
                  <p className="text-foreground">{call.emergency_type}</p>
                  <p className={cn("text-[11px]", urgency.text)}>{urgency.label} urgency</p>
                </td>
                <td className="max-w-[16rem] px-4 py-2.5">
                  <p className="line-clamp-2 text-muted-foreground">
                    {call.location_text ?? "Unresolved address"}
                  </p>
                  <p className="font-mono text-[10px] text-muted-foreground/70">
                    {call.latitude.toFixed(4)}, {call.longitude.toFixed(4)}
                    {call.dispatched_station_name
                      ? ` · ${call.dispatched_station_name}`
                      : ""}
                  </p>
                </td>
                <td className="whitespace-nowrap px-4 py-2.5 font-mono text-[11px] text-muted-foreground">
                  {new Date(call.created_at).toLocaleString()}
                </td>
                <td className="px-4 py-2.5">
                  <span
                    className={cn(
                      "inline-block rounded border px-1.5 py-0.5 text-[10px] uppercase tracking-wide",
                      status.className,
                    )}
                  >
                    {status.label}
                  </span>
                </td>
                <td className="px-4 py-2.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      asChild
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                    >
                      <a href={`tel:${call.caller_phone.replace(/\s/g, "")}`}>
                        <Phone className="mr-1 h-3 w-3" />
                        Call back
                      </a>
                    </Button>
                    {call.status !== "dispatched" && call.status !== "resolved" ? (
                      <Button
                        size="sm"
                        className="h-7 px-2 text-[11px]"
                        disabled={busy}
                        onClick={() => onStatusChange(call.id, "dispatched")}
                      >
                        <Siren className="mr-1 h-3 w-3" />
                        Dispatch
                      </Button>
                    ) : null}
                    {call.status !== "resolved" ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2 text-[11px]"
                        disabled={busy}
                        onClick={() => onStatusChange(call.id, "resolved")}
                      >
                        <CheckCheck className="mr-1 h-3 w-3" />
                        Resolve
                      </Button>
                    ) : null}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
