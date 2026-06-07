import { useEffect, useState, type JSX } from "react";
import { t, type Locale } from "../../i18n";

const STATUS_BASE = "https://status.uplg.xyz";

type MonitorState = "up" | "down" | "degraded" | "unknown";

interface HoraMonitor {
  id: string;
  name: string;
  status: MonitorState;
  last_latency_ms: number | null;
  uptime_24h_permille: number | null;
  cert_expiry_days: number | null;
}

interface HoraSummary {
  overall: MonitorState;
  overall_label: string;
  generated_at: string;
  monitors: HoraMonitor[];
}

interface ServiceStatus {
  id: string;
  name: string;
  status: MonitorState;
  ping: number | null;
  uptime24h: number | null;
}

interface StatusProps {
  locale?: Locale;
}

const Status = ({ locale = "en" }: StatusProps): JSX.Element => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`${STATUS_BASE}/api/summary`);
        const data: HoraSummary = await res.json();

        const result: ServiceStatus[] = data.monitors.map((m) => ({
          id: m.id,
          name: m.name,
          status: m.status,
          ping: m.last_latency_ms,
          uptime24h: m.uptime_24h_permille !== null ? m.uptime_24h_permille / 10 : null,
        }));

        setServices(result);
        setLastUpdated(new Date());
        setError(null);
      } catch {
        setError(t(locale, "status.error"));
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const allUp = services.length > 0 && services.every((s) => s.status === "up");
  const anyDown = services.some((s) => s.status === "down");

  const overallColor = loading ? "#6b7280" : allUp ? "#10b981" : anyDown ? "#ef4444" : "#f59e0b";

  const overallText = loading
    ? t(locale, "status.checking")
    : allUp
      ? t(locale, "status.all_operational")
      : anyDown
        ? t(locale, "status.some_issues")
        : t(locale, "status.some_maintenance");

  return (
    <div id="page" className="page status" role="main">
      <section className="hero">
        <h1>{t(locale, "status.title")}</h1>
      </section>

      <div className="status-overview" style={{ borderColor: overallColor }}>
        <div className="status-overview-dot" style={{ backgroundColor: overallColor }} />
        <span className="status-overview-text">{overallText}</span>
      </div>

      {error && <p className="status-error">{error}</p>}

      <div className="status-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="status-card status-card-loading">
                <div className="status-card-name-placeholder" />
                <div className="status-card-meta-placeholder" />
              </div>
            ))
          : services.map((s) => (
              <div key={s.id} className="status-card">
                <div className="status-card-header">
                  <div
                    className="status-card-dot"
                    style={{
                      backgroundColor:
                        s.status === "up"
                          ? "#10b981"
                          : s.status === "down"
                            ? "#ef4444"
                            : s.status === "degraded"
                              ? "#f59e0b"
                              : "#6b7280",
                    }}
                  />
                  <span className="status-card-name">{s.name}</span>
                </div>
                <div className="status-card-meta">
                  {s.ping !== null && <span className="status-card-ping">{s.ping}ms</span>}
                  {s.uptime24h !== null && (
                    <span className="status-card-uptime">
                      {s.uptime24h}%{" "}
                      <span className="status-card-uptime-label">{t(locale, "status.24h")}</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
      </div>

      {lastUpdated && (
        <p className="status-footer-note">
          {t(locale, "status.last_updated")} {lastUpdated.toLocaleTimeString()}
          {" · "}
          <a href={`${STATUS_BASE}/`} target="_blank" rel="noopener noreferrer">
            Hora
          </a>
        </p>
      )}
    </div>
  );
};

export default Status;
