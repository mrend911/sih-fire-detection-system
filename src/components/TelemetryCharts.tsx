import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { SEVERITY_META, type FireEvent } from "@/lib/fire-core";

const axisStyle = { fontSize: 10, fill: "var(--muted-foreground)" };

function tooltipStyle() {
  return {
    background: "var(--panel)",
    border: "1px solid var(--border)",
    borderRadius: 6,
    fontSize: 12,
    color: "var(--foreground)",
  } as const;
}

export function TemperatureTrend({ events }: { events: FireEvent[] }) {
  const data = [...events]
    .slice(0, 24)
    .reverse()
    .map((e) => ({
      time: new Date(e.created_at).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      temp: Math.round(e.temperature_celsius),
    }));

  return (
    <ResponsiveContainer width="100%" height={190}>
      <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="tempFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--sev-2)" stopOpacity={0.55} />
            <stop offset="100%" stopColor="var(--sev-2)" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="time" tick={axisStyle} tickLine={false} axisLine={false} minTickGap={24} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={52} />
        <ReferenceLine y={500} stroke="var(--sev-1)" strokeDasharray="4 4" />
        <ReferenceLine y={2000} stroke="var(--sev-3)" strokeDasharray="4 4" />
        <Tooltip contentStyle={tooltipStyle()} labelStyle={{ color: "var(--muted-foreground)" }} />
        <Area
          type="monotone"
          dataKey="temp"
          name="°C"
          stroke="var(--sev-2)"
          strokeWidth={2}
          fill="url(#tempFill)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

export function SeverityBreakdown({ events }: { events: FireEvent[] }) {
  const data = [1, 2, 3].map((level) => ({
    name: SEVERITY_META[level]!.label,
    count: events.filter((e) => e.severity_level === level).length,
    color: SEVERITY_META[level]!.color,
  }));

  return (
    <ResponsiveContainer width="100%" height={190}>
      <BarChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid stroke="var(--grid)" strokeDasharray="2 4" vertical={false} />
        <XAxis dataKey="name" tick={axisStyle} tickLine={false} axisLine={false} />
        <YAxis tick={axisStyle} tickLine={false} axisLine={false} width={52} allowDecimals={false} />
        <Tooltip
          cursor={{ fill: "var(--accent)", opacity: 0.3 }}
          contentStyle={tooltipStyle()}
          labelStyle={{ color: "var(--muted-foreground)" }}
        />
        <Bar dataKey="count" name="Incidents" radius={[3, 3, 0, 0]}>
          {data.map((entry) => (
            <Cell key={entry.name} fill={entry.color} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
