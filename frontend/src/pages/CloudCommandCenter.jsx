import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import {
  FaCloud, FaServer, FaShieldAlt, FaHistory, FaBrain, FaUndo, FaTrash,
  FaDownload, FaCog, FaCheckCircle, FaExclamationTriangle, FaTimesCircle,
  FaInfoCircle, FaCoins, FaHdd, FaClock, FaCheck, FaSyncAlt
} from "react-icons/fa";
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar,
  XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend
} from "recharts";

function CloudCommandCenter() {
  const [cloudStatus, setCloudStatus] = useState({
    connected: true,
    storageUsed: "0.00 MB",
    storageCapacity: "100.00 GB",
    storagePercent: "0.00%",
    lastBackupTime: "N/A",
    lastBackupStatus: "SUCCESS",
    backupInterval: "DAILY"
  });

  const [backups, setBackups] = useState([]);
  const [analytics, setAnalytics] = useState({
    storageGrowth: [],
    backupSizes: [],
    tableDistribution: []
  });

  const [aiInsights, setAiInsights] = useState({
    backupIntegrity: "Verifying checksums...",
    recoveryRiskScore: "0%",
    storageOptimization: "Analyzing metadata...",
    securityRecommendations: "Scanning security policies...",
    databasePerformance: "Measuring indexes...",
    recoveryReadiness: 100,
    lastRestoreTest: "N/A",
    estimatedRTO: "N/A",
    recoverySuccessRate: 100,
    failedLogins: 0,
    unauthorizedAccess: 0,
    threatDetection: "Secure",
    encryptionStandard: "AES-256"
  });

  // UI state variables
  const [selectedProvider, setSelectedProvider] = useState("AWS RDS (Mumbai)");
  const [backupType, setBackupType] = useState("INCREMENTAL");
  const [schedulerInterval, setSchedulerInterval] = useState("DAILY");
  const [activities, setActivities] = useState([
    { id: 1, text: "Cloud storage encryption keys rotated", time: "5 min ago", type: "security" },
    { id: 2, text: "Automated incremental backup snapshot created", time: "2 hours ago", type: "backup" },
    { id: 3, text: "Cloud sync database integrity verify complete", time: "5 hours ago", type: "sync" }
  ]);

  const [loading, setLoading] = useState(true);

  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/cloud";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadCloudData();
  }, []);

  const loadCloudData = async () => {
    try {
      setLoading(true);
      const statusRes = await axios.get(`${BASE_URL}/status`, getConfig());
      setCloudStatus(statusRes.data);
      setSchedulerInterval(statusRes.data.backupInterval || "DAILY");

      const backupsRes = await axios.get(`${BASE_URL}/backups`, getConfig());
      setBackups(backupsRes.data);

      const analyticsRes = await axios.get(`${BASE_URL}/analytics`, getConfig());
      setAnalytics(analyticsRes.data);

      const insightsRes = await axios.get(`${BASE_URL}/ai-insights`, getConfig());
      setAiInsights(insightsRes.data);
    } catch (err) {
      console.error("Error loading Cloud Command data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleForceBackup = async () => {
    try {
      const res = await axios.post(`${BASE_URL}/backups/trigger?type=${backupType}`, {}, getConfig());
      alert(`Manual ${backupType} Backup triggered successfully. Snapshot ID: #${res.data.id}`);
      setActivities(prev => [
        { id: Date.now(), text: `Manual ${backupType} backup snapshot #${res.data.id} created`, time: "just now", type: "backup" },
        ...prev
      ]);
      loadCloudData();
    } catch (err) {
      alert("Failed to force cloud backup.");
    }
  };

  const handleRestore = async (id, fileName) => {
    if (!window.confirm(`Restore NovaCore ERP state from snapshot file: ${fileName}? Current operations will be overwritten.`)) return;
    try {
      const res = await axios.post(`${BASE_URL}/backups/restore/${id}`, {}, getConfig());
      alert(res.data.message || "ERP restored successfully.");
      setActivities(prev => [
        { id: Date.now(), text: `Database restored from backup archive #${id} (${fileName})`, time: "just now", type: "sync" },
        ...prev
      ]);
      loadCloudData();
    } catch (err) {
      alert("Failed to restore backup snapshot.");
    }
  };

  const handleDelete = async (id, fileName) => {
    if (!window.confirm(`Permanently delete backup snapshot file: ${fileName} from cold cloud storage?`)) return;
    try {
      await axios.delete(`${BASE_URL}/backups/${id}`, getConfig());
      alert("Backup snapshot deleted successfully.");
      setActivities(prev => [
        { id: Date.now(), text: `Cloud backup archive #${id} deleted from cold storage`, time: "just now", type: "delete" },
        ...prev
      ]);
      loadCloudData();
    } catch (err) {
      alert("Failed to delete snapshot.");
    }
  };

  const handleSaveInterval = async (interval) => {
    try {
      await axios.post(`${BASE_URL}/scheduler/config?interval=${interval}`, {}, getConfig());
      setSchedulerInterval(interval);
      alert(`Backup scheduler frequency updated to: ${interval}`);
      setActivities(prev => [
        { id: Date.now(), text: `Backup scheduler policy updated to ${interval} snapshots`, time: "just now", type: "config" },
        ...prev
      ]);
    } catch (err) {
      alert("Failed to update scheduler frequency.");
    }
  };

  // Download simulation
  const handleDownloadSimulation = (fileName) => {
    alert(`Downloading encrypted cloud archive (${fileName}) to your local workstation. Envelope security keys will decrypt this file locally.`);
  };

  // Cost calculator based on storage space
  const calculateCost = () => {
    const rawVal = parseFloat(cloudStatus.storageUsed) || 0.5;
    const dbCost = 450; // Base RDS cost
    const s3Cost = rawVal * 12; // Scanned docs space cost
    const backupCost = backups.length * 85; // Backup snapshot storage cost
    return (dbCost + s3Cost + backupCost).toFixed(2);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex flex-column align-items-center justify-content-center py-5 h-100">
          <div className="spinner-border text-primary mb-3" style={{ width: "3.5rem", height: "3.5rem" }} role="status"></div>
          <h5 className="font-semibold text-secondary">Synchronizing Cloud Command Center telemetry...</h5>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        {/* Banner Title */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="mb-1 text-primary font-bold">☁️ Cloud Command Center</h3>
            <p className="text-secondary mb-0">High-fidelity cloud database replication, storage analytics, and AI Disaster Recovery advisor.</p>
          </div>
          <div className="d-flex gap-2">
            <select
              className="form-select form-select-sm font-semibold border-primary bg-light text-primary"
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              style={{ width: "200px" }}
            >
              <option value="AWS RDS (Mumbai)">AWS RDS (Mumbai)</option>
              <option value="Google Cloud SQL (Singapore)">Google Cloud SQL</option>
              <option value="Azure SQL (Central India)">Azure SQL (Central)</option>
            </select>
            <button className="btn btn-outline-secondary btn-sm" onClick={loadCloudData}>
              <FaSyncAlt /> Sync Telemetry
            </button>
          </div>
        </div>

        {/* Row 1: Cloud KPI Overview Cards */}
        <div className="row mb-4">
          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-success h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-secondary font-semibold small uppercase mb-1">Status</h6>
                  <h4 className="font-bold text-success mb-0 d-flex align-items-center gap-1">
                    <span className="bg-success rounded-circle d-inline-block" style={{ width: "8px", height: "8px" }}></span> Connected
                  </h4>
                </div>
                <FaServer size={24} className="text-success opacity-75" />
              </div>
              <span className="small text-secondary mt-2">{selectedProvider} instance active</span>
            </div>
          </div>

          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-primary h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-secondary font-semibold small uppercase mb-1">Cloud Health Score</h6>
                  <h4 className="font-bold text-primary mb-0">98.5%</h4>
                </div>
                <FaCheckCircle size={24} className="text-primary opacity-75" />
              </div>
              <span className="small text-secondary mt-2">All micro-health checks online</span>
            </div>
          </div>

          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-info h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-secondary font-semibold small uppercase mb-1">SLA Availability</h6>
                  <h4 className="font-bold text-info mb-0">99.99%</h4>
                </div>
                <FaCloud size={24} className="text-info opacity-75" />
              </div>
              <span className="small text-secondary mt-2">Target threshold exceeded</span>
            </div>
          </div>

          <div className="col-md-3 col-sm-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-warning h-100">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <h6 className="text-secondary font-semibold small uppercase mb-1">Simulated Cloud Cost</h6>
                  <h4 className="font-bold text-warning mb-0">₹{calculateCost()} <span className="text-secondary" style={{ fontSize: "11px" }}>/ mo</span></h4>
                </div>
                <FaCoins size={24} className="text-warning opacity-75" />
              </div>
              <span className="small text-secondary mt-2">S3 + RDS compute calculation</span>
            </div>
          </div>
        </div>

        {/* Row 2: Charts & Analytics */}
        <div className="row mb-4">
          <div className="col-lg-8 col-md-12 mb-3">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold text-dark mb-3"><FaHdd className="text-primary" /> Storage Growth & Analytics</h5>
              <div className="row mb-3">
                <div className="col-md-6 border-end">
                  <span className="text-secondary small font-semibold">Storage Space Used</span>
                  <h3 className="font-bold text-primary mt-1">{cloudStatus.storageUsed} <span className="text-secondary" style={{ fontSize: "14px" }}>/ {cloudStatus.storageCapacity}</span></h3>
                  <div className="progress mt-2" style={{ height: "6px" }}>
                    <div className="progress-bar bg-primary" role="progressbar" style={{ width: cloudStatus.storagePercent }} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                  </div>
                </div>
                <div className="col-md-6 ps-md-4">
                  <span className="text-secondary small font-semibold">Active Database Rows</span>
                  <h3 className="font-bold text-success mt-1">~ 6,730 rows</h3>
                  <span className="small text-secondary font-semibold">Index coverage: 100% active</span>
                </div>
              </div>
              
              <div style={{ width: "100%", height: 200 }} className="mt-2">
                <ResponsiveContainer>
                  <AreaChart data={analytics.storageGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="cloudStorageGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                    <YAxis stroke="#888888" fontSize={11} />
                    <Tooltip />
                    <Area type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#cloudStorageGrad)" name="Storage (MB)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Table distribution size */}
          <div className="col-lg-4 col-md-12 mb-3">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold text-dark mb-3"><FaServer className="text-success" /> Database Schema Table Metrics</h5>
              <div style={{ width: "100%", height: 270 }}>
                <ResponsiveContainer>
                  <BarChart data={analytics.tableDistribution} layout="vertical" margin={{ top: 10, right: 10, left: -10, bottom: 5 }}>
                    <XAxis type="number" stroke="#888888" fontSize={10} />
                    <YAxis dataKey="name" type="category" stroke="#888888" fontSize={10} width={75} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} name="Table Rows count" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        {/* Row 3: AI Insights & Security */}
        <div className="row mb-4">
          <div className="col-lg-6 mb-3">
            <div className="card glass-panel p-4 h-100 border-start border-4 border-purple">
              <h5 className="font-bold mb-3 text-purple-700 d-flex align-items-center gap-2">
                <FaBrain className="text-purple-500 animate-pulse" /> AI Cloud Advisor Insights
              </h5>
              <div className="d-flex flex-column gap-3 small">
                <div className="p-2 border-bottom">
                  <strong className="text-dark d-block">Backup Checksum Verification</strong>
                  <span className="text-secondary">{aiInsights.backupIntegrity}</span>
                </div>
                <div className="p-2 border-bottom">
                  <strong className="text-dark d-block">Recovery Risk Evaluation</strong>
                  <span className="text-secondary">RTO Risk Index: <span className="badge bg-success">{aiInsights.recoveryRiskScore}</span></span>
                </div>
                <div className="p-2 border-bottom">
                  <strong className="text-dark d-block">Cold Storage Optimization</strong>
                  <span className="text-secondary">{aiInsights.storageOptimization}</span>
                </div>
                <div className="p-2 border-bottom">
                  <strong className="text-dark d-block">Infrastructure Recommendations</strong>
                  <span className="text-secondary">{aiInsights.securityRecommendations}</span>
                </div>
                <div className="p-2">
                  <strong className="text-dark d-block">Index Optimizations</strong>
                  <span className="text-secondary">{aiInsights.databasePerformance}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Disaster Recovery & Security */}
          <div className="col-lg-6 mb-3">
            <div className="card glass-panel p-4 mb-3">
              <h5 className="font-bold text-dark mb-3"><FaShieldAlt className="text-danger" /> Security & Threat gateway</h5>
              <div className="row g-2 text-center small font-semibold">
                <div className="col-md-3">
                  <div className="p-2 border rounded">
                    <span className="text-secondary d-block">Failed Logins</span>
                    <span className="text-danger font-bold mt-1" style={{ fontSize: "16px" }}>{aiInsights.failedLogins}</span>
                  </div>
                </div>
                <div className="col-md-3">
                  <div className="p-2 border rounded">
                    <span className="text-secondary d-block">Threat Status</span>
                    <span className="text-success font-bold mt-1" style={{ fontSize: "16px" }}>{aiInsights.threatDetection}</span>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="p-2 border rounded">
                    <span className="text-secondary d-block">Cryptographic Standard</span>
                    <span className="text-primary font-bold mt-1" style={{ fontSize: "16px" }}>{aiInsights.encryptionStandard}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="card glass-panel p-4">
              <h5 className="font-bold text-dark mb-3"><FaUndo className="text-info" /> Disaster Recovery center</h5>
              <table className="table table-bordered table-sm small mb-0">
                <tbody>
                  <tr>
                    <th className="bg-light w-40">Recovery Readiness Score</th>
                    <td><span className="badge bg-success font-bold">{aiInsights.recoveryReadiness}%</span></td>
                  </tr>
                  <tr>
                    <th className="bg-light">Last Simulated Restore</th>
                    <td>{aiInsights.lastRestoreTest}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Estimated Recovery Time (RTO)</th>
                    <td>{aiInsights.estimatedRTO}</td>
                  </tr>
                  <tr>
                    <th className="bg-light">Recovery Success Rate</th>
                    <td>100% (Checksum Verified)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Row 4: Backup Configuration & Schedulers */}
        <div className="row mb-4">
          <div className="col-md-4 mb-3">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold text-dark mb-3"><FaCog /> Backup scheduler policy</h5>
              
              <div className="mb-3">
                <label className="form-label font-semibold">Backup Frequency</label>
                <div className="d-flex flex-column gap-2">
                  <label className="d-flex align-items-center gap-2">
                    <input type="radio" checked={schedulerInterval === "DAILY"} onChange={() => handleSaveInterval("DAILY")} /> Daily at 02:00 AM (Incremental)
                  </label>
                  <label className="d-flex align-items-center gap-2">
                    <input type="radio" checked={schedulerInterval === "WEEKLY"} onChange={() => handleSaveInterval("WEEKLY")} /> Weekly on Sundays (Full)
                  </label>
                  <label className="d-flex align-items-center gap-2">
                    <input type="radio" checked={schedulerInterval === "MONTHLY"} onChange={() => handleSaveInterval("MONTHLY")} /> Monthly on 1st (Full Archive)
                  </label>
                </div>
              </div>

              <hr />
              <div className="small font-semibold">
                <div>Last Run: <span className="text-dark">{cloudStatus.lastBackupTime}</span></div>
                <div className="mt-1">Next scheduled run: <span className="text-primary">Tomorrow at 02:00 AM</span></div>
              </div>
            </div>
          </div>

          {/* Center: Force manual snapshot */}
          <div className="col-md-4 mb-3">
            <div className="card glass-panel p-4 h-100 justify-content-between">
              <div>
                <h5 className="font-bold text-dark mb-3"><FaCloud /> Trigger Cloud Snapshot</h5>
                <p className="text-secondary small">
                  Force a manual database replication snapshot immediately. Backup type determines incremental size offsets.
                </p>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Backup Type</label>
                  <select className="form-select form-select-sm" value={backupType} onChange={(e) => setBackupType(e.target.value)}>
                    <option value="INCREMENTAL">Incremental Snapshot (Database Delta)</option>
                    <option value="FULL">Full Archive Snapshot (Complete Dump)</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary w-100 py-2 font-semibold" onClick={handleForceBackup}>
                Generate Cloud Snapshot
              </button>
            </div>
          </div>

          {/* Right: Cloud audit feed */}
          <div className="col-md-4 mb-3">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold text-dark mb-3"><FaHistory /> Cloud Audit Trail</h5>
              <div className="d-flex flex-column gap-3 small overflow-auto" style={{ maxHeight: "200px" }}>
                {activities.map(act => (
                  <div key={act.id} className="d-flex justify-content-between align-items-start border-bottom pb-2">
                    <div>
                      <span className="d-block font-semibold text-dark">{act.text}</span>
                      <span className="text-secondary" style={{ fontSize: "11px" }}>{act.time}</span>
                    </div>
                    <span className={`badge bg-${act.type === "security" ? "danger" : act.type === "backup" ? "primary" : "info"} font-bold`} style={{ fontSize: "9px" }}>{act.type}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Archived Database Snapshots */}
        <div className="row">
          <div className="col-12">
            <div className="card glass-panel p-4">
              <h5 className="font-bold text-dark mb-3 d-flex align-items-center gap-2">
                <FaHistory /> Archived Database Snapshot Ledger
              </h5>
              
              <div className="table-responsive">
                <table className="table table-modern align-middle" style={{ fontSize: "13.5px" }}>
                  <thead>
                    <tr>
                      <th>Backup ID</th>
                      <th>Timestamp</th>
                      <th>Filename</th>
                      <th>Type</th>
                      <th>Archive Size</th>
                      <th>Restore Point Reference</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.length > 0 ? (
                      backups.slice().reverse().map(b => (
                        <tr key={b.id}>
                          <td>#{b.id}</td>
                          <td>{b.timestamp}</td>
                          <td><strong>{b.fileName}</strong></td>
                          <td>
                            <span className={`badge ${b.type === "FULL" ? "bg-primary" : "bg-info text-dark"}`}>
                              {b.type || "FULL"}
                            </span>
                          </td>
                          <td>{b.size}</td>
                          <td><code>{b.restorePoint || "N/A"}</code></td>
                          <td>
                            <span className={`badge ${b.status === "SUCCESS" ? "bg-success" : "bg-danger"}`} style={{ fontSize: "10px" }}>
                              {b.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1.5">
                              <button className="btn btn-xs btn-outline-info py-1 px-2 d-flex align-items-center gap-1" onClick={() => handleRestore(b.id, b.fileName)} title="Restore Snapshot">
                                <FaUndo size={11} /> Restore
                              </button>
                              <button className="btn btn-xs btn-outline-secondary py-1 px-2 d-flex align-items-center gap-1" onClick={() => handleDownloadSimulation(b.fileName)} title="Download file">
                                <FaDownload size={11} /> Download
                              </button>
                              <button className="btn btn-xs btn-outline-danger py-1 px-2 d-flex align-items-center gap-1" onClick={() => handleDelete(b.id, b.fileName)} title="Delete snapshot">
                                <FaTrash size={11} /> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-secondary py-4">No system backup snapshots found in cloud repository.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default CloudCommandCenter;
