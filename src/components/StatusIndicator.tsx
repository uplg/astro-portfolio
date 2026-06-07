import { useEffect, useState, type JSX } from "react";
import { t, type Locale } from "../i18n";

const STATUS_BASE = "https://status.uplg.xyz";

interface HoraSummary {
  overall: "up" | "down" | "degraded" | "unknown";
}

interface StatusIndicatorProps {
  locale?: Locale;
}

const StatusIndicator = ({ locale = "en" }: StatusIndicatorProps): JSX.Element => {
  const [status, setStatus] = useState<"operational" | "degraded" | "loading">("loading");

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(`${STATUS_BASE}/api/summary`);
        const data: HoraSummary = await response.json();
        setStatus(data.overall === "up" ? "operational" : "degraded");
      } catch (error) {
        console.error("Failed to fetch status:", error);
        setStatus("degraded");
      }
    };

    fetchStatus();
    const interval = setInterval(fetchStatus, 30000);

    return () => clearInterval(interval);
  }, []);

  const getStatusColor = () => {
    switch (status) {
      case "operational":
        return "#10b981";
      case "degraded":
        return "#ef4444";
      case "loading":
        return "#6b7280";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "operational":
        return t(locale, "status.operational");
      case "degraded":
        return t(locale, "status.degraded");
      case "loading":
        return t(locale, "status.loading");
    }
  };

  const statusHref = locale === "fr" ? "/fr/status" : "/status";

  return (
    <div className="status-indicator">
      <div className="status-pulse" style={{ backgroundColor: getStatusColor() }} />
      <a href={statusHref} className="footer-link">
        <span className="status-text">{getStatusText()}</span>
      </a>
    </div>
  );
};

export default StatusIndicator;
