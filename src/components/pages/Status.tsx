import { useCallback, useEffect, useRef, useState, type JSX } from "react";
import { t, type Locale } from "../../i18n";
import { STATUS_BASE, STATUS_LINK } from "../../lib/hora";

type MonitorState = "up" | "down" | "degraded" | "unknown" | "empty";

const STATE_COLOR: Record<MonitorState, string> = {
  up: "#10b981",
  down: "#ef4444",
  degraded: "#f59e0b",
  unknown: "#6b7280",
  empty: "#6b7280",
};

/** Severity ordering, mirroring Hora: the worst member drives a group/overall. */
const STATE_RANK: Record<MonitorState, number> = {
  up: 0,
  unknown: 1,
  empty: 1,
  degraded: 2,
  down: 3,
};

interface DayCell {
  date: string;
  state: MonitorState;
}

interface HoraMonitor {
  id: string;
  name: string;
  status: MonitorState;
  last_latency_ms: number | null;
  last_error?: string | null;
  last_checked?: string | null;
  uptime_24h_permille: number | null;
  latency_p50_ms: number | null;
  latency_p95_ms: number | null;
  latency_p99_ms: number | null;
  slo_latency_ms: number | null;
  slo_uptime_pct?: number | null;
  cert_expiry_days: number | null;
  history: DayCell[];
  group?: string | null;
  maintenance?: string | null;
  cause?: string | null;
  impacted?: string[];
}

interface HoraGroup {
  name: string;
  ids: string[];
}

interface IncidentView {
  title: string;
  body: string;
  severity: string;
  at: string | null;
}

interface MaintenanceView {
  reason: string;
  monitors: string;
}

interface HoraSummary {
  title: string;
  overall: MonitorState;
  overall_label: string;
  generated_at: string;
  incidents: IncidentView[];
  maintenances: MaintenanceView[];
  monitors: HoraMonitor[];
  groups: HoraGroup[];
}

interface LatencyPoint {
  t: number;
  latency_ms: number;
}

type ChartState = "loading" | "error" | LatencyPoint[];

interface StatusProps {
  locale?: Locale;
}

const overallText = (state: MonitorState, locale: Locale): string => {
  switch (state) {
    case "up":
      return t(locale, "status.all_operational");
    case "degraded":
      return t(locale, "status.degraded_overall");
    case "down":
      return t(locale, "status.some_issues");
    default:
      return t(locale, "status.awaiting");
  }
};

/** The worst status across a set of monitors (a group's rolled-up badge). */
const worstStatus = (monitors: HoraMonitor[]): MonitorState =>
  monitors.reduce<MonitorState>(
    (worst, m) => (STATE_RANK[m.status] > STATE_RANK[worst] ? m.status : worst),
    "up",
  );

const certState = (days: number | null): "ok" | "warn" | "expired" | null => {
  if (days === null) return null;
  if (days <= 0) return "expired";
  if (days <= 14) return "warn";
  return "ok";
};

/** Whether the measured 24h p95 meets the configured latency objective. */
const sloState = (target: number | null, p95: number | null): "met" | "breached" | null => {
  if (target === null || p95 === null) return null;
  return p95 <= target ? "met" : "breached";
};

const formatPermille = (permille: number): string => {
  const clamped = Math.max(0, Math.min(1000, permille));
  return `${(clamped / 10).toFixed(1)}%`;
};

/** Build line + area SVG paths for a latency series in a `w`×`h` viewBox. */
const buildSpark = (
  points: LatencyPoint[],
  w: number,
  h: number,
  pad = 5,
): { line: string; area: string } | null => {
  if (points.length < 2) return null;
  const xs = points.map((p) => p.t);
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const maxY = Math.max(...points.map((p) => p.latency_ms), 1);
  const spanX = maxX - minX || 1;
  const sx = (x: number) => pad + ((x - minX) / spanX) * (w - 2 * pad);
  const sy = (y: number) => h - pad - (y / maxY) * (h - 2 * pad);
  const line = points
    .map((p, i) => `${i === 0 ? "M" : "L"}${sx(p.t).toFixed(1)},${sy(p.latency_ms).toFixed(1)}`)
    .join(" ");
  const area = `${line} L${sx(maxX).toFixed(1)},${(h - pad).toFixed(1)} L${sx(minX).toFixed(1)},${(h - pad).toFixed(1)} Z`;
  return { line, area };
};

const LatencyChart = ({
  chart,
  status,
}: {
  chart: ChartState;
  status: MonitorState;
}): JSX.Element => {
  if (chart === "loading") return <div className="status-chart-skeleton" />;
  if (chart === "error" || chart.length < 2) {
    return <p className="status-chart-empty">—</p>;
  }
  const w = 600;
  const h = 72;
  const spark = buildSpark(chart, w, h);
  if (!spark) return <p className="status-chart-empty">—</p>;
  const color = STATE_COLOR[status];
  const last = chart[chart.length - 1];
  const peak = Math.max(...chart.map((p) => p.latency_ms));
  return (
    <div className="status-chart">
      <svg
        className="status-chart-svg"
        viewBox={`0 0 ${w} ${h}`}
        preserveAspectRatio="none"
        role="img"
        aria-label="latency"
      >
        <path d={spark.area} fill={color} fillOpacity={0.12} stroke="none" />
        <path
          d={spark.line}
          fill="none"
          stroke={color}
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="status-chart-scale">
        <span>{last.latency_ms}ms</span>
        <span>peak {peak}ms</span>
      </div>
    </div>
  );
};

const MonitorCard = ({
  monitor,
  locale,
  expanded,
  chart,
  onToggle,
}: {
  monitor: HoraMonitor;
  locale: Locale;
  expanded: boolean;
  chart: ChartState | undefined;
  onToggle: (id: string) => void;
}): JSX.Element => {
  const cert = certState(monitor.cert_expiry_days);
  const slo = sloState(monitor.slo_latency_ms, monitor.latency_p95_ms);
  const uptime = monitor.uptime_24h_permille;

  return (
    <section className={`status-card${monitor.maintenance ? " status-card-maint" : ""}`}>
      <div className="status-card-header">
        <span
          className="status-card-dot"
          style={{ backgroundColor: STATE_COLOR[monitor.status] }}
          title={monitor.last_error ?? undefined}
        />
        <span className="status-card-name">{monitor.name}</span>
        <span className="status-card-meta">
          {uptime !== null && <span className="status-card-uptime">{formatPermille(uptime)}</span>}
          <b className="status-card-ping">
            {monitor.last_latency_ms !== null ? `${monitor.last_latency_ms}ms` : "—"}
          </b>
        </span>
      </div>

      {monitor.history.length > 0 ? (
        <div className="status-bar" aria-hidden="true">
          {monitor.history.map((cell) => (
            <span
              key={cell.date}
              className="status-day"
              style={{
                backgroundColor:
                  cell.state === "empty" ? undefined : (STATE_COLOR[cell.state] ?? undefined),
              }}
              title={`${cell.date} · ${cell.state}`}
            />
          ))}
        </div>
      ) : (
        <p className="status-card-nodata">{t(locale, "status.no_data")}</p>
      )}

      <div className="status-caption">
        <span className="status-caption-text">
          {t(locale, "status.24h")}
          {monitor.latency_p50_ms !== null && ` · p50 ${monitor.latency_p50_ms}ms`}
          {monitor.latency_p95_ms !== null && ` · p95 ${monitor.latency_p95_ms}ms`}
        </span>
        <span className="status-badges">
          {monitor.maintenance && (
            <span className="status-badge maint">{t(locale, "status.maintenance")}</span>
          )}
          {slo && (
            <span
              className={`status-badge slo ${slo}`}
              title={`24h p95 vs ${monitor.slo_latency_ms}ms SLO`}
            >
              SLO
            </span>
          )}
          {cert && (
            <span className={`status-badge cert ${cert}`}>
              TLS{" "}
              {cert === "expired" ? t(locale, "status.expired") : `${monitor.cert_expiry_days}d`}
            </span>
          )}
        </span>
      </div>

      {monitor.cause && (
        <p className="status-topology">
          {t(locale, "status.caused_by")} <b>{monitor.cause}</b>
        </p>
      )}
      {monitor.impacted && monitor.impacted.length > 0 && (
        <p className="status-topology">
          {t(locale, "status.impacts")} {monitor.impacted.join(", ")}
        </p>
      )}

      <button
        type="button"
        className="status-chart-toggle"
        aria-expanded={expanded}
        onClick={() => onToggle(monitor.id)}
      >
        {t(locale, "status.latency_24h")}
        <span className={`status-chart-caret${expanded ? " open" : ""}`} aria-hidden="true">
          ›
        </span>
      </button>
      {expanded && chart !== undefined && <LatencyChart chart={chart} status={monitor.status} />}
    </section>
  );
};

const Status = ({ locale = "en" }: StatusProps): JSX.Element => {
  const [summary, setSummary] = useState<HoraSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [charts, setCharts] = useState<Record<string, ChartState>>({});
  const expandedRef = useRef<string | null>(null);

  const loadChart = useCallback(async (id: string) => {
    setCharts((prev) => ({ ...prev, [id]: "loading" }));
    try {
      const res = await fetch(`${STATUS_BASE}/api/monitors/${id}/latency?hours=24`);
      const data: LatencyPoint[] = await res.json();
      setCharts((prev) => ({ ...prev, [id]: data }));
    } catch {
      setCharts((prev) => ({ ...prev, [id]: "error" }));
    }
  }, []);

  const toggleChart = useCallback(
    (id: string) => {
      setExpandedId((prev) => {
        const next = prev === id ? null : id;
        expandedRef.current = next;
        return next;
      });
      setCharts((prev) => {
        if (prev[id] === undefined || prev[id] === "error") {
          void loadChart(id);
        }
        return prev;
      });
    },
    [loadChart],
  );

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${STATUS_BASE}/api/summary`);
        const data: HoraSummary = await res.json();
        setSummary(data);
        setLastUpdated(new Date());
        setError(null);
        // Keep an open chart fresh on each poll.
        if (expandedRef.current) void loadChart(expandedRef.current);
      } catch {
        setError(t(locale, "status.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, [locale, loadChart]);

  const overall: MonitorState = summary?.overall ?? "unknown";
  const overallColor = loading ? STATE_COLOR.unknown : STATE_COLOR[overall];
  const headline = loading ? t(locale, "status.checking") : overallText(overall, locale);

  // Resolve each group's monitor ids back to full objects. Fall back to a single
  // ungrouped section when an older Hora omits the groups array.
  const byId = new Map(summary?.monitors.map((m) => [m.id, m]) ?? []);
  const groups: { name: string; monitors: HoraMonitor[] }[] = summary
    ? summary.groups.length > 0
      ? summary.groups.map((g) => ({
          name: g.name,
          monitors: g.ids.map((id) => byId.get(id)).filter((m): m is HoraMonitor => Boolean(m)),
        }))
      : [{ name: "", monitors: summary.monitors }]
    : [];

  return (
    <div id="page" className="page status" role="main">
      <section className="hero">
        <h1>{t(locale, "status.title")}</h1>
      </section>

      <div className="status-overview" style={{ borderColor: overallColor }}>
        <div className="status-overview-dot" style={{ backgroundColor: overallColor }} />
        <span className="status-overview-text">{headline}</span>
      </div>

      {summary?.incidents.map((incident, i) => (
        <div key={`inc-${i}`} className={`status-banner ${incident.severity}`}>
          <strong>{incident.title}</strong>
          {incident.body && <span>{incident.body}</span>}
          {incident.at && <time>{incident.at}</time>}
        </div>
      ))}

      {summary?.maintenances.map((m, i) => (
        <div key={`mnt-${i}`} className="status-banner maintenance">
          <strong>{m.reason}</strong>
          <span>{m.monitors}</span>
        </div>
      ))}

      {error && <p className="status-error">{error}</p>}

      {loading ? (
        <div className="status-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="status-card status-card-loading">
              <div className="status-card-name-placeholder" />
              <div className="status-card-meta-placeholder" />
            </div>
          ))}
        </div>
      ) : (
        groups.map((group) => {
          if (group.monitors.length === 0) return null;
          const count = group.monitors.length;
          return (
            <section key={group.name || "_ungrouped"} className="status-group">
              {group.name && (
                <header className="status-group-header">
                  <span
                    className="status-group-dot"
                    style={{ backgroundColor: STATE_COLOR[worstStatus(group.monitors)] }}
                  />
                  <h2 className="status-group-title">{group.name}</h2>
                  <span className="status-group-count">
                    {count} {t(locale, count > 1 ? "status.services" : "status.service")}
                  </span>
                </header>
              )}
              <div className="status-grid">
                {group.monitors.map((monitor) => (
                  <MonitorCard
                    key={monitor.id}
                    monitor={monitor}
                    locale={locale}
                    expanded={expandedId === monitor.id}
                    chart={charts[monitor.id]}
                    onToggle={toggleChart}
                  />
                ))}
              </div>
            </section>
          );
        })
      )}

      {lastUpdated && (
        <p className="status-footer-note">
          {t(locale, "status.last_updated")} {lastUpdated.toLocaleTimeString()}
          {" · "}
          <a href={`${STATUS_LINK}/`} target="_blank" rel="noopener noreferrer">
            Hora
          </a>
        </p>
      )}
    </div>
  );
};

export default Status;
