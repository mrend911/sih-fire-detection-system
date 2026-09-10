import { useState } from "react";
import { Play, Radio, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { SEVERITY_META, SIM_PRESETS, classifyTemperature } from "@/lib/fire-core";
import { cn } from "@/lib/utils";

export interface SimulationInput {
  deviceId: string;
  temperatureCelsius: number;
  latitude: number;
  longitude: number;
  simulated: boolean;
}

export default function SimulationPanel({
  onRun,
  pending,
}: {
  onRun: (input: SimulationInput) => void;
  pending: boolean;
}) {
  const [temperature, setTemperature] = useState(850);
  const [deviceId, setDeviceId] = useState("SIMULATED-SENSOR-01");
  const [latitude, setLatitude] = useState("23.0225");
  const [longitude, setLongitude] = useState("72.5714");

  const classification = classifyTemperature(temperature);
  const meta = SEVERITY_META[classification.severityLevel]!;

  const submit = (temp: number) => {
    const lat = Number(latitude);
    const lng = Number(longitude);
    if (Number.isNaN(lat) || Number.isNaN(lng)) return;
    onRun({
      deviceId: deviceId.trim() || "SIMULATED-SENSOR-01",
      temperatureCelsius: Math.round(temp * 10) / 10,
      latitude: lat,
      longitude: lng,
      simulated: true,
    });
  };

  const runPreset = (range: [number, number]) => {
    const temp = range[0] + Math.random() * (range[1] - range[0]);
    setTemperature(Math.round(temp));
    submit(temp);
  };

  return (
    <div className="space-y-4 p-4">
      <div>
        <div className="flex items-baseline justify-between">
          <Label className="text-xs uppercase tracking-widest text-muted-foreground">
            Sensor temperature
          </Label>
          <span className={cn("font-mono text-sm font-semibold", meta.text)}>
            {temperature}°C · {meta.label}
          </span>
        </div>
        <Slider
          value={[temperature]}
          onValueChange={([value]) => setTemperature(value ?? 0)}
          min={0}
          max={3000}
          step={10}
          className="mt-3"
        />
        <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground">
          <span>0</span>
          <span>500</span>
          <span>2000</span>
          <span>3000</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="lat" className="text-xs text-muted-foreground">
            Latitude
          </Label>
          <Input
            id="lat"
            value={latitude}
            onChange={(e) => setLatitude(e.target.value)}
            className="font-mono text-xs"
            inputMode="decimal"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lng" className="text-xs text-muted-foreground">
            Longitude
          </Label>
          <Input
            id="lng"
            value={longitude}
            onChange={(e) => setLongitude(e.target.value)}
            className="font-mono text-xs"
            inputMode="decimal"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="device" className="text-xs text-muted-foreground">
          Device ID
        </Label>
        <Input
          id="device"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
          className="font-mono text-xs"
        />
      </div>

      <Button
        onClick={() => submit(temperature)}
        disabled={pending}
        className="w-full font-semibold"
      >
        {pending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Radio className="h-4 w-4" />
        )}
        Transmit reading
      </Button>

      <div className="space-y-2 border-t border-border pt-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Quick scenarios</p>
        <div className="grid grid-cols-3 gap-2">
          {SIM_PRESETS.map((preset) => (
            <Button
              key={preset.id}
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() => runPreset(preset.range)}
              className="h-auto flex-col gap-1 py-2 text-[11px] leading-tight"
            >
              <Play className="h-3 w-3" />
              {preset.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
