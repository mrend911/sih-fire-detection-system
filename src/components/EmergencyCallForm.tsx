import { useState } from "react";
import { PhoneCall, LoaderCircle, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { EMERGENCY_TYPES, URGENCY_META } from "@/lib/fire-core";
import { cn } from "@/lib/utils";

export interface EmergencyCallInput {
  callerName: string;
  callerPhone: string;
  locationText?: string;
  latitude: number;
  longitude: number;
  emergencyType: string;
  urgencyLevel: number;
  notes?: string;
}

const fieldClass = "h-9 bg-input/40 font-mono text-xs";

export default function EmergencyCallForm({
  onSubmit,
  pending,
  defaultLatitude = 23.0225,
  defaultLongitude = 72.5714,
}: {
  onSubmit: (input: EmergencyCallInput) => void;
  pending: boolean;
  defaultLatitude?: number;
  defaultLongitude?: number;
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [locationText, setLocationText] = useState("");
  const [lat, setLat] = useState(String(defaultLatitude));
  const [lng, setLng] = useState(String(defaultLongitude));
  const [type, setType] = useState<string>(EMERGENCY_TYPES[1]);
  const [urgency, setUrgency] = useState(3);
  const [notes, setNotes] = useState("");

  const useMyLocation = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      setLat(pos.coords.latitude.toFixed(5));
      setLng(pos.coords.longitude.toFixed(5));
    });
  };

  const disabled = pending || name.trim().length < 2 || phone.trim().length < 5;

  return (
    <form
      className="space-y-3 p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (disabled) return;
        onSubmit({
          callerName: name.trim(),
          callerPhone: phone.trim(),
          ...(locationText.trim() ? { locationText: locationText.trim() } : {}),
          latitude: Number(lat) || defaultLatitude,
          longitude: Number(lng) || defaultLongitude,
          emergencyType: type,
          urgencyLevel: urgency,
          ...(notes.trim() ? { notes: notes.trim() } : {}),
        });
        setNotes("");
      }}
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Caller name
          </Label>
          <Input
            className={fieldClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Phone number
          </Label>
          <Input
            className={fieldClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91 98765 43210"
            inputMode="tel"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Location description
        </Label>
        <Input
          className={fieldClass}
          value={locationText}
          onChange={(e) => setLocationText(e.target.value)}
          placeholder="Landmark, street, building…"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Latitude
          </Label>
          <Input className={fieldClass} value={lat} onChange={(e) => setLat(e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
            Longitude
          </Label>
          <Input className={fieldClass} value={lng} onChange={(e) => setLng(e.target.value)} />
        </div>
        <div className="flex items-end">
          <Button
            type="button"
            variant="outline"
            className="h-9 w-full text-xs"
            onClick={useMyLocation}
          >
            <MapPin className="mr-1.5 h-3 w-3" />
            Use my location
          </Button>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Emergency type
        </Label>
        <div className="flex flex-wrap gap-1.5">
          {EMERGENCY_TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded border px-2 py-1 text-[11px] transition-colors",
                t === type
                  ? "border-primary/70 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Urgency
        </Label>
        <div className="grid grid-cols-4 gap-1.5">
          {[1, 2, 3, 4].map((level) => (
            <button
              key={level}
              type="button"
              onClick={() => setUrgency(level)}
              className={cn(
                "rounded border px-2 py-1 text-[11px] transition-colors",
                level === urgency
                  ? "border-primary/70 bg-primary/15 text-primary"
                  : "border-border text-muted-foreground hover:border-primary/40",
              )}
            >
              {URGENCY_META[level]!.label}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-1.5">
        <Label className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          Notes
        </Label>
        <Input
          className={fieldClass}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="People trapped, smoke colour, spread…"
        />
      </div>

      <Button type="submit" disabled={disabled} className="h-10 w-full font-semibold">
        {pending ? (
          <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <PhoneCall className="mr-2 h-4 w-4" />
        )}
        Call fire department
      </Button>
    </form>
  );
}
