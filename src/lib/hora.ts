/** Public Hora status instance, used for outbound links. */
export const STATUS_LINK = "https://status.uplg.xyz";

/**
 * Browser-side API base for the Hora status backend. Proxied through Vite in dev
 * (same-origin, sidestepping Hora's CORS allowlist, which only admits the
 * production origin); the absolute URL in production.
 */
export const STATUS_BASE = import.meta.env.DEV ? "/__hora" : STATUS_LINK;
