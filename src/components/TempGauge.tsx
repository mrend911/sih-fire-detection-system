import { MAX_GAUGE_TEMP, SEVERITY_META, classifyTemperature } from "@/lib/fire-core";

export default function TempGauge({
  temperature,
  size = 190,
}: {
  temperature: number;
  size?: number;
}) {
  const classification = classifyTemperature(temperature);
  const meta = SEVERITY_META[classification.severityLevel]!;
  const pct = Math.min(Math.max(temperature, 0) / MAX_GAUGE_TEMP, 1);

  const radius = size / 2 - 16;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 135;
  const sweep = 270;

  const polar = (angleDeg: number, r: number) => {
    const a = ((angleDeg - 90) * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)] as const;
  };

  const arcPath = (from: number, to: number, r: number) => {
    const [x1, y1] = polar(from, r);
    const [x2, y2] = polar(to, r);
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  const bands: { from: number; to: number; color: string }[] = [
    { from: 0, to: 500 / MAX_GAUGE_TEMP, color: "var(--sev-1)" },
    { from: 500 / MAX_GAUGE_TEMP, to: 2000 / MAX_GAUGE_TEMP, color: "var(--sev-2)" },
    { from: 2000 / MAX_GAUGE_TEMP, to: 1, color: "var(--sev-3)" },
  ];

  const needleAngle = startAngle + pct * sweep;
  const [nx, ny] = polar(needleAngle, radius - 12);

  return (
    <div className="flex flex-col items-center">
      <svg width={size} height={size} role="img" aria-label={`Temperature ${temperature} degrees Celsius`}>
        <path
          d={arcPath(startAngle, startAngle + sweep, radius)}
          fill="none"
          stroke="var(--grid)"
          strokeWidth={12}
          strokeLinecap="round"
        />
        {bands.map((band) => (
          <path
            key={band.color}
            d={arcPath(startAngle + band.from * sweep, startAngle + band.to * sweep, radius)}
            fill="none"
            stroke={band.color}
            strokeWidth={4}
            opacity={0.55}
          />
        ))}
        <path
          d={arcPath(startAngle, Math.max(startAngle + 0.5, needleAngle), radius)}
          fill="none"
          stroke={meta.color}
          strokeWidth={12}
          strokeLinecap="round"
          style={{ transition: "all .5s ease" }}
        />
        <line
          x1={cx}
          y1={cy}
          x2={nx}
          y2={ny}
          stroke={meta.color}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
        <circle cx={cx} cy={cy} r={4} fill={meta.color} />
        <text
          x={cx}
          y={cy + radius * 0.55}
          textAnchor="middle"
          className="font-mono"
          fontSize={26}
          fill="var(--foreground)"
        >
          {Math.round(temperature)}°C
        </text>
        <text
          x={cx}
          y={cy + radius * 0.55 + 20}
          textAnchor="middle"
          fontSize={11}
          fill={meta.color}
          className="uppercase tracking-widest"
        >
          {meta.label}
        </text>
      </svg>
      <p className="mt-1 max-w-[15rem] text-center text-xs text-muted-foreground">
        {classification.description}
      </p>
    </div>
  );
}
