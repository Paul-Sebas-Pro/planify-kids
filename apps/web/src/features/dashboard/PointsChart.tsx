import type { GamificationEvent } from "@planify-kids/types";
import type { ChildStats } from "@planify-kids/types";

interface Props {
  events: GamificationEvent[];
  children: ChildStats[];
}

function getDayLabel(date: Date) {
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric" });
}

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

export function PointsChart({ events, children }: Props) {
  const W = 560;
  const H = 160;
  const PAD = { top: 10, right: 16, bottom: 28, left: 32 };
  const chartW = W - PAD.left - PAD.right;
  const chartH = H - PAD.top - PAD.bottom;

  // Build last 7 days
  const today = new Date();
  const days: Date[] = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d;
  });
  const dayKeys = days.map(isoDay);

  // Filter POINTS_EARNED only
  const pointEvents = events.filter((e) => e.type === "POINTS_EARNED");

  // Build per-child series: { memberId → { date → points } }
  const seriesMap = new Map<string, Map<string, number>>();
  for (const child of children) {
    seriesMap.set(child.id, new Map(dayKeys.map((k) => [k, 0])));
  }
  for (const ev of pointEvents) {
    const day = ev.ts.slice(0, 10);
    if (!dayKeys.includes(day)) continue;
    const childMap = seriesMap.get(ev.memberId);
    if (!childMap) continue;
    const pts = typeof ev.data.points === "number" ? ev.data.points : 0;
    childMap.set(day, (childMap.get(day) ?? 0) + pts);
  }

  // Build series arrays
  const series = children.map((child) => {
    const dayMap = seriesMap.get(child.id)!;
    return {
      id: child.id,
      color: child.color ?? "#6C63FF",
      name: child.name,
      values: dayKeys.map((k) => dayMap.get(k) ?? 0),
    };
  });

  const maxVal = Math.max(...series.flatMap((s) => s.values), 1);

  function xPos(i: number) {
    return PAD.left + (i / (dayKeys.length - 1)) * chartW;
  }
  function yPos(v: number) {
    return PAD.top + chartH - (v / maxVal) * chartH;
  }

  // Check if any data
  const hasData = series.some((s) => s.values.some((v) => v > 0));

  return (
    <div className="bg-white rounded-card shadow-sm p-5">
      <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
        Points gagnés — 7 derniers jours
      </h3>

      {!hasData ? (
        <p className="text-sm text-gray-400 text-center py-6">
          Aucune donnée encore — les points apparaîtront ici après les premières tâches.
        </p>
      ) : (
        <>
          <svg
            width="100%"
            viewBox={`0 0 ${W} ${H}`}
            className="overflow-visible"
          >
            {/* Gridlines */}
            {[0, 0.25, 0.5, 0.75, 1].map((t) => {
              const y = PAD.top + chartH * (1 - t);
              const val = Math.round(maxVal * t);
              return (
                <g key={t}>
                  <line
                    x1={PAD.left}
                    y1={y}
                    x2={PAD.left + chartW}
                    y2={y}
                    stroke="#f1f5f9"
                    strokeWidth={1}
                  />
                  <text
                    x={PAD.left - 4}
                    y={y + 4}
                    textAnchor="end"
                    fontSize={9}
                    fill="#94a3b8"
                  >
                    {val}
                  </text>
                </g>
              );
            })}

            {/* X axis labels */}
            {days.map((d, i) => (
              <text
                key={i}
                x={xPos(i)}
                y={H - 4}
                textAnchor="middle"
                fontSize={9}
                fill="#94a3b8"
              >
                {getDayLabel(d)}
              </text>
            ))}

            {/* Lines per child */}
            {series.map((s) => {
              const points = s.values
                .map((v, i) => `${xPos(i)},${yPos(v)}`)
                .join(" ");
              return (
                <g key={s.id}>
                  <polyline
                    points={points}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={2}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                  />
                  {s.values.map((v, i) =>
                    v > 0 ? (
                      <circle
                        key={i}
                        cx={xPos(i)}
                        cy={yPos(v)}
                        r={3}
                        fill={s.color}
                      />
                    ) : null,
                  )}
                </g>
              );
            })}
          </svg>

          {/* Legend */}
          <div className="flex gap-4 mt-2 flex-wrap">
            {series.map((s) => (
              <div key={s.id} className="flex items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: s.color }}
                />
                <span className="text-xs text-gray-500">{s.name}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
