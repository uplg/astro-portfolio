import { useEffect, useState, type JSX } from "react";

interface Heartbeat {
  status: number;
  time: string;
  msg: string;
  ping: number | null;
}

interface Monitor {
  id: number;
  name: string;
  type: string;
}

interface MonitorGroup {
  name: string;
  monitorList: Monitor[];
}

interface StatusPageResponse {
  publicGroupList: MonitorGroup[];
}

interface HeartbeatResponse {
  heartbeatList: Record<string, Heartbeat[]>;
  uptimeList: Record<string, number>;
}

interface ServiceStatus {
  id: number;
  name: string;
  status: "up" | "down" | "pending" | "maintenance";
  ping: number | null;
  uptime24h: number | null;
}

const Status = (): JSX.Element => {
  const [services, setServices] = useState<ServiceStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const [pageRes, heartbeatRes] = await Promise.all([
          fetch("https://status.uplg.xyz/api/status-page/uplg"),
          fetch("https://status.uplg.xyz/api/status-page/heartbeat/uplg"),
        ]);

        const pageData: StatusPageResponse = await pageRes.json();
        const heartbeatData: HeartbeatResponse = await heartbeatRes.json();

        const monitors: Monitor[] = [];
        for (const group of pageData.publicGroupList) {
          for (const m of group.monitorList) {
            monitors.push(m);
          }
        }

        const result: ServiceStatus[] = monitors.map((m) => {
          const beats = heartbeatData.heartbeatList[String(m.id)] || [];
          const latest = beats.length > 0 ? beats[beats.length - 1] : null;
          const uptimeKey = `${m.id}_24`;
          const uptime = heartbeatData.uptimeList[uptimeKey] ?? null;

          let status: ServiceStatus["status"] = "pending";
          if (latest) {
            if (latest.status === 1) status = "up";
            else if (latest.status === 0) status = "down";
            else if (latest.status === 3) status = "maintenance";
          }

          return {
            id: m.id,
            name: m.name,
            status,
            ping: latest?.ping ?? null,
            uptime24h: uptime !== null ? Math.round(uptime * 10000) / 100 : null,
          };
        });

        setServices(result);
        setLastUpdated(new Date());
        setError(null);
      } catch {
        setError("Failed to fetch status data");
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

  const overallColor = loading
    ? "#6b7280"
    : allUp
      ? "#10b981"
      : anyDown
        ? "#ef4444"
        : "#f59e0b";

  const overallText = loading
    ? "Checking..."
    : allUp
      ? "All systems operational"
      : anyDown
        ? "Some services are experiencing issues"
        : "Some services are in maintenance";

  return (
    <div id="page" className="page status" role="main">
      <section className="hero">
        <h1>Status.</h1>
      </section>

      <div className="status-overview" style={{ borderColor: overallColor }}>
        <div
          className="status-overview-dot"
          style={{ backgroundColor: overallColor }}
        />
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
                            : s.status === "maintenance"
                              ? "#f59e0b"
                              : "#6b7280",
                    }}
                  />
                  <span className="status-card-name">{s.name}</span>
                </div>
                <div className="status-card-meta">
                  {s.ping !== null && (
                    <span className="status-card-ping">{s.ping}ms</span>
                  )}
                  {s.uptime24h !== null && (
                    <span className="status-card-uptime">
                      {s.uptime24h}% <span className="status-card-uptime-label">24h</span>
                    </span>
                  )}
                </div>
              </div>
            ))}
      </div>

      {lastUpdated && (
        <p className="status-footer-note">
          Last updated: {lastUpdated.toLocaleTimeString()}
          {" · "}
          <a
            href="https://status.uplg.xyz/status/uplg"
            target="_blank"
            rel="noopener noreferrer"
          >
            Uptime Kuma
          </a>
        </p>
      )}
    </div>
  );
};

export default Status;
