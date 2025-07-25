import { useEffect, useState, type JSX } from "react";

interface Heartbeat {
  status: number; // 0=DOWN, 1=UP, 2=PENDING, 3=MAINTENANCE
  time: string;
  msg: string;
  ping: number | null;
}

interface StatusResponse {
  heartbeatList: Record<string, Heartbeat[]>;
  uptimeList: Record<string, number>;
}

const StatusIndicator = (): JSX.Element => {
  const [status, setStatus] = useState<"operational" | "degraded" | "loading">(
    "loading"
  );

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const response = await fetch(
          "https://status.uplg.xyz/api/status-page/heartbeat/uplg"
        );
        const data: StatusResponse = await response.json();

        // Check if any service is down (status 0) or in maintenance (status 3)
        const isAnyServiceDown = Object.values(data.heartbeatList).some(
          (heartbeats) => {
            if (heartbeats.length === 0) return true; // No heartbeats = down
            const latestHeartbeat = heartbeats[heartbeats.length - 1];
            return latestHeartbeat.status === 0 || latestHeartbeat.status === 3;
          }
        );

        setStatus(isAnyServiceDown ? "degraded" : "operational");
      } catch (error) {
        console.error("Failed to fetch status:", error);
        setStatus("degraded"); // Assume degraded if we can't fetch status
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
        return "Operational";
      case "degraded":
        return "Degraded";
      case "loading":
        return "Loading...";
    }
  };

  return (
    <div className="status-indicator">
      <div
        className="status-pulse"
        style={{ backgroundColor: getStatusColor() }}
      />
      <a
        href="https://status.uplg.xyz/status/uplg"
        target="_blank"
        rel="noopener noreferrer"
        className="footer-link"
      >
        <span className="status-text">{getStatusText()}</span>
      </a>
    </div>
  );
};

export default StatusIndicator;
