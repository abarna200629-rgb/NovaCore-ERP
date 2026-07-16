import { API_BASE_URL } from "../config";
import { useState, useEffect } from "react";
import MainLayout from "../layouts/MainLayout";
import { FaBuilding, FaPalette, FaEnvelopeOpenText, FaUserCog, FaSave, FaCloud, FaServer, FaHistory, FaUndo } from "react-icons/fa";
import axios from "axios";

function Settings() {
  // Company state
  const [companyName, setCompanyName] = useState("ERP Pro India Ltd");
  const [gstin, setGstin] = useState("33AAFCE1298A1ZD");
  const [currency, setCurrency] = useState("INR (₹)");
  const [address, setAddress] = useState("42 Corporate Towers, Chennai, TN");

  // Email SMTP state
  const [smtpHost, setSmtpHost] = useState("smtp.corporate-mail.com");
  const [smtpPort, setSmtpPort] = useState("587");
  const [smtpUser, setSmtpUser] = useState("erp-noreply@corporate-mail.com");
  const [sslEnabled, setSslEnabled] = useState(false);

  // User state
  const username = localStorage.getItem("username") || "admin";
  const [password, setPassword] = useState("********");

  // Cloud state
  const [cloudStatus, setCloudStatus] = useState({
    connected: true,
    storageUsed: "0.00 MB",
    storageCapacity: "100.00 GB",
    storagePercent: "0.00%",
    lastBackupTime: "N/A",
    lastBackupStatus: "SUCCESS"
  });
  const [backups, setBackups] = useState([]);
  const role = localStorage.getItem("role") ? localStorage.getItem("role").toUpperCase().replace("ROLE_", "") : "";

  const loadCloudData = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      
      const statusRes = await axios.get(API_BASE_URL + "/api/cloud/status", config);
      setCloudStatus(statusRes.data);

      if (role === "ADMIN") {
        const backupsRes = await axios.get(API_BASE_URL + "/api/cloud/backups", config);
        setBackups(backupsRes.data);
      }
    } catch (err) {
      console.error("Error fetching cloud configuration:", err);
    }
  };

  const handleTriggerBackup = async () => {
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      await axios.post(API_BASE_URL + "/api/cloud/backups/trigger", {}, config);
      alert("Manual cloud backup triggered successfully.");
      loadCloudData();
    } catch (err) {
      console.error(err);
      alert("Failed to trigger cloud backup.");
    }
  };

  const handleRestore = async (backupId) => {
    if (!window.confirm("Are you sure you want to restore the ERP database to this state? Current local changes will be replaced.")) return;
    try {
      const token = localStorage.getItem("token");
      const config = { headers: { Authorization: `Bearer ${token}` } };
      const res = await axios.post(`${process.env.REACT_APP_API_BASE_URL || API_BASE_URL + ""}/api/cloud/backups/restore/${backupId}`, {}, config);
      alert(res.data.message || "System successfully restored from cloud backup.");
      loadCloudData();
    } catch (err) {
      console.error(err);
      alert("Failed to restore cloud backup.");
    }
  };

  useEffect(() => {
    loadCloudData();
  }, [role]);

  // Load from localStorage if present
  useEffect(() => {
    const savedCompany = localStorage.getItem("setting_company");
    if (savedCompany) setCompanyName(savedCompany);

    const savedGstin = localStorage.getItem("setting_gstin");
    if (savedGstin) setGstin(savedGstin);

    const savedCurrency = localStorage.getItem("setting_currency");
    if (savedCurrency) setCurrency(savedCurrency);

    const savedAddress = localStorage.getItem("setting_address");
    if (savedAddress) setAddress(savedAddress);

    const savedSmtp = localStorage.getItem("setting_smtp_host");
    if (savedSmtp) setSmtpHost(savedSmtp);

    const savedPort = localStorage.getItem("setting_smtp_port");
    if (savedPort) setSmtpPort(savedPort);

    const savedSmtpUser = localStorage.getItem("setting_smtp_user");
    if (savedSmtpUser) setSmtpUser(savedSmtpUser);
  }, []);

  const handleSave = () => {
    localStorage.setItem("setting_company", companyName);
    localStorage.setItem("setting_gstin", gstin);
    localStorage.setItem("setting_currency", currency);
    localStorage.setItem("setting_address", address);
    localStorage.setItem("setting_smtp_host", smtpHost);
    localStorage.setItem("setting_smtp_port", smtpPort);
    localStorage.setItem("setting_smtp_user", smtpUser);

    alert("System settings saved successfully!");
  };

  const handleThemeChange = (theme) => {
    if (theme === "dark") {
      document.body.classList.add("dark-theme");
      document.body.classList.remove("light-theme");
      localStorage.setItem("theme", "dark");
    } else {
      document.body.classList.add("light-theme");
      document.body.classList.remove("dark-theme");
      localStorage.setItem("theme", "light");
    }
    alert(`Theme updated to ${theme.toUpperCase()} mode.`);
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">ERP Configuration Settings</h3>

        <div className="row">
          {/* Company Profile Settings */}
          <div className="col-lg-6 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaBuilding /> Corporate Profile Configuration
              </h5>
              
              <div className="mb-3">
                <label className="form-label font-semibold">Registered Company Name</label>
                <input
                  type="text"
                  className="form-control"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Corporate Tax ID / GSTIN</label>
                <input
                  type="text"
                  className="form-control"
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Operating Currency</label>
                <select className="form-select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option value="INR (₹)">INR (₹) - Indian Rupee</option>
                  <option value="USD ($)">USD ($) - US Dollar</option>
                  <option value="EUR (€)">EUR (€) - Euro</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Billing Headquarters Address</label>
                <textarea
                  className="form-control"
                  rows="2"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                ></textarea>
              </div>
            </div>
          </div>

          {/* Email SMTP Settings */}
          <div className="col-lg-6 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaEnvelopeOpenText /> Corporate SMTP Gateway
              </h5>
              
              <div className="mb-3">
                <label className="form-label font-semibold">Mail Server Host</label>
                <input
                  type="text"
                  className="form-control"
                  value={smtpHost}
                  onChange={(e) => setSmtpHost(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">SMTP Port</label>
                <input
                  type="text"
                  className="form-control"
                  value={smtpPort}
                  onChange={(e) => setSmtpPort(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Sender Account User</label>
                <input
                  type="email"
                  className="form-control"
                  value={smtpUser}
                  onChange={(e) => setSmtpUser(e.target.value)}
                />
              </div>

              <div className="mb-3 d-flex align-items-center gap-2 mt-4">
                <input
                  type="checkbox"
                  id="ssl"
                  checked={sslEnabled}
                  onChange={(e) => setSslEnabled(e.target.checked)}
                />
                <label htmlFor="ssl" className="font-semibold m-0">Require Secure Connection (SSL/TLS)</label>
              </div>
            </div>
          </div>
        </div>

        <div className="row mb-4">
          {/* Theme customizer */}
          <div className="col-md-6 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaPalette /> Interface Customization
              </h5>
              <p className="text-secondary" style={{ fontSize: "13px" }}>Choose system visual theme layout:</p>
              <div className="d-flex gap-3">
                <button className="btn btn-outline-primary flex-grow-1" onClick={() => handleThemeChange("light")}>
                  Light Theme
                </button>
                <button className="btn btn-dark flex-grow-1" onClick={() => handleThemeChange("dark")}>
                  Dark Theme
                </button>
              </div>
            </div>
          </div>

          {/* User profile settings */}
          <div className="col-md-6 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaUserCog /> User Account Profile
              </h5>
              <div className="row">
                <div className="col-md-6">
                  <label className="form-label font-semibold">Current Account</label>
                  <input type="text" className="form-control" value={username} readOnly />
                </div>
                <div className="col-md-6">
                  <label className="form-label font-semibold">Security Token Password</label>
                  <input type="text" className="form-control" value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Cloud Status & Management Widget */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2 text-primary">
                <FaCloud /> Enterprise Cloud Administration Command
              </h5>
              
              <div className="row g-3">
                <div className="col-md-3">
                  <div className="p-3 border rounded text-center h-100 bg-light-translucent">
                    <FaServer size={22} className="text-success mb-2" />
                    <h6 className="font-semibold text-secondary mb-1" style={{ fontSize: "12px" }}>Cloud SQL Database</h6>
                    <span className="badge bg-success font-bold" style={{ fontSize: "11px" }}>CONNECTED (AWS RDS)</span>
                  </div>
                </div>

                <div className="col-md-5">
                  <div className="p-3 border rounded h-100 bg-light-translucent">
                    <h6 className="font-semibold text-secondary mb-1" style={{ fontSize: "12px" }}>Encrypted Cloud Storage Space Utilization</h6>
                    <h4 className="font-bold text-primary my-2">{cloudStatus.storageUsed} <span className="text-secondary" style={{ fontSize: "13px" }}>/ {cloudStatus.storageCapacity}</span></h4>
                    <div className="progress" style={{ height: "6px" }}>
                      <div className="progress-bar bg-primary" role="progressbar" style={{ width: cloudStatus.storagePercent }} aria-valuenow="0" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                  </div>
                </div>

                <div className="col-md-4">
                  <div className="p-3 border rounded h-100 bg-light-translucent d-flex flex-column justify-content-between">
                    <div>
                      <h6 className="font-semibold text-secondary mb-1" style={{ fontSize: "12px" }}>Backup Lifecycle Status</h6>
                      <div className="small font-semibold mt-1">Last Sync Backup: <span className="text-dark">{cloudStatus.lastBackupTime}</span></div>
                    </div>
                    {role === "ADMIN" && (
                      <button className="btn btn-sm btn-primary w-100 mt-2 d-flex align-items-center justify-content-center gap-2" onClick={handleTriggerBackup}>
                        <FaCloud /> Force Cloud Backup
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {role === "ADMIN" && (
                <div className="mt-4">
                  <h6 className="font-bold text-dark mb-3 d-flex align-items-center gap-2">
                    <FaHistory /> Archived Database Snapshots
                  </h6>
                  <div className="table-responsive">
                    <table className="table table-modern align-middle" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Backup ID</th>
                          <th>Backup Timestamp</th>
                          <th>Archive Filename</th>
                          <th>Archive Size</th>
                          <th>Backup Status</th>
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
                              <td>{b.size}</td>
                              <td>
                                <span className={`badge ${b.status === "SUCCESS" ? "bg-success" : "bg-danger"}`} style={{ fontSize: "10px" }}>
                                  {b.status}
                                </span>
                              </td>
                              <td>
                                <button className="btn btn-sm btn-outline-info d-flex align-items-center gap-1 py-1" onClick={() => handleRestore(b.id)}>
                                  <FaUndo size={11} /> Restore ERP
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="6" className="text-center text-secondary py-3">No system backup snapshots found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="d-flex justify-content-end gap-3 mb-4">
          <button className="btn btn-success d-flex align-items-center gap-2 px-4 py-2" onClick={handleSave}>
            <FaSave /> Save Configuration
          </button>
        </div>
      </div>
    </MainLayout>
  );
}

export default Settings;
