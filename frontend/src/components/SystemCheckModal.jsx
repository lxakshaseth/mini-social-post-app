import { useEffect, useState } from "react";
import { Activity, CheckCircle2, XCircle, RefreshCw, Cpu, Database, HardDrive, ShieldCheck, X } from "lucide-react";
import { fetchSystemDiagnostics } from "../api";

export default function SystemCheckModal({ isOpen, onClose }) {
  const [loading, setLoading] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [error, setError] = useState("");
  const [lastCheck, setLastCheck] = useState(null);

  const runCheck = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchSystemDiagnostics();
      setDiagnostics(data);
      setLastCheck(new Date());
    } catch (err) {
      setError(err.message || "Failed to reach backend diagnostics service.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      runCheck();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-content system-modal"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: "560px", width: "95%" }}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div className="system-icon-badge">
              <Activity size={20} color="var(--primary, #1b84ff)" />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.1rem" }}>System Health & Diagnostics</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--text-muted, #7e8299)" }}>
                Real-time API, Database & Runtime Inspection
              </p>
            </div>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ maxHeight: "65vh", overflowY: "auto", padding: "16px 0" }}>
          {error && (
            <div className="system-alert error" style={{ margin: "0 16px 16px" }}>
              <XCircle size={18} />
              <div>
                <strong>Connection Error:</strong> {error}
              </div>
            </div>
          )}

          {loading && !diagnostics ? (
            <div style={{ textAlign: "center", padding: "32px 16px" }}>
              <RefreshCw className="spin" size={28} color="var(--primary, #1b84ff)" />
              <p style={{ marginTop: "12px", color: "var(--text-muted, #7e8299)" }}>
                Inspecting runtime and database health...
              </p>
            </div>
          ) : diagnostics ? (
            <div className="system-diag-grid" style={{ padding: "0 16px", display: "grid", gap: "14px" }}>
              {/* Overall Status Banner */}
              <div
                style={{
                  background: diagnostics.status === "healthy" ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
                  border: `1px solid ${diagnostics.status === "healthy" ? "#10b981" : "#ef4444"}`,
                  borderRadius: "10px",
                  padding: "12px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={18} color="#10b981" />
                  <div>
                    <strong style={{ fontSize: "0.92rem", color: "#10b981" }}>All Systems Operational</strong>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-muted, #7e8299)" }}>
                      Backend online & ready
                    </div>
                  </div>
                </div>
                <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #7e8299)" }}>
                  Uptime: {diagnostics.uptime?.formatted}
                </span>
              </div>

              {/* Database & Latency */}
              <div className="diag-card">
                <div className="diag-card-title">
                  <Database size={16} color="var(--primary, #1b84ff)" />
                  <span>Database Layer (MongoDB)</span>
                </div>
                <div className="diag-metrics">
                  <div className="diag-row">
                    <span>Status</span>
                    <span className="badge badge-success">
                      {diagnostics.database?.connected ? "Connected" : diagnostics.database?.status || "Unknown"}
                    </span>
                  </div>
                  <div className="diag-row">
                    <span>Roundtrip Ping Latency</span>
                    <span style={{ fontWeight: 600 }}>
                      {diagnostics.database?.latencyMs != null ? `${diagnostics.database.latencyMs} ms` : "N/A"}
                    </span>
                  </div>
                  <div className="diag-row">
                    <span>Host / Cluster</span>
                    <span style={{ fontSize: "0.8rem", color: "var(--text-muted, #7e8299)" }}>
                      {diagnostics.database?.host || "MongoDB Local/Atlas"}
                    </span>
                  </div>
                  {diagnostics.database?.metrics && (
                    <div className="diag-row">
                      <span>Live Collection Counts</span>
                      <span style={{ fontSize: "0.8rem", fontWeight: 600 }}>
                        {diagnostics.database.metrics.totalUsers} Users · {diagnostics.database.metrics.totalPosts} Posts · {diagnostics.database.metrics.totalPolls} Polls
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Runtime & Memory Usage */}
              <div className="diag-card">
                <div className="diag-card-title">
                  <Cpu size={16} color="#8b5cf6" />
                  <span>Runtime & Resource Metrics</span>
                </div>
                <div className="diag-metrics">
                  <div className="diag-row">
                    <span>Node.js Version</span>
                    <code>{diagnostics.system?.nodeVersion} ({diagnostics.system?.platform} {diagnostics.system?.arch})</code>
                  </div>
                  <div className="diag-row">
                    <span>Heap Memory Used</span>
                    <span>{diagnostics.memory?.heapUsedMB} MB / {diagnostics.memory?.heapTotalMB} MB</span>
                  </div>
                  <div className="diag-row">
                    <span>Resident Set Size (RSS)</span>
                    <span>{diagnostics.memory?.rssMB} MB</span>
                  </div>
                </div>
              </div>

              {/* Storage & Security */}
              <div className="diag-card">
                <div className="diag-card-title">
                  <HardDrive size={16} color="#f59e0b" />
                  <span>Storage & Environment</span>
                </div>
                <div className="diag-metrics">
                  <div className="diag-row">
                    <span>Uploads Directory</span>
                    <span style={{ color: "#10b981" }}>{diagnostics.storage?.uploadsDirectory}</span>
                  </div>
                  <div className="diag-row">
                    <span>JWT Auth Secret</span>
                    <span>{diagnostics.environment?.hasJwtSecret ? "Configured" : "Default Fallback"}</span>
                  </div>
                  <div className="diag-row">
                    <span>Server Port / Mode</span>
                    <span>Port {diagnostics.environment?.port} ({diagnostics.environment?.nodeEnv})</span>
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="modal-footer" style={{ justifyContent: "space-between", padding: "12px 16px" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--text-muted, #7e8299)" }}>
            {lastCheck ? `Checked at ${lastCheck.toLocaleTimeString()}` : ""}
          </span>
          <div style={{ display: "flex", gap: "8px" }}>
            <button className="button button-outline" onClick={runCheck} disabled={loading}>
              <RefreshCw size={14} className={loading ? "spin" : ""} style={{ marginRight: "6px" }} />
              Re-run Check
            </button>
            <button className="button button-primary" onClick={onClose}>
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
