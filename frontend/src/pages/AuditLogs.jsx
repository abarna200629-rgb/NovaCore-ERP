import { useEffect, useState } from "react";
import MainLayout from "../layouts/MainLayout";
import api from "../services/api";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaShieldAlt, FaUserShield, FaExclamationTriangle, FaInfoCircle,
  FaSearch, FaFilter, FaDownload, FaCalendarAlt, FaHistory, FaCheckCircle,
  FaArrowLeft, FaArrowRight
} from "react-icons/fa";

function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedModule, setSelectedModule] = useState("ALL");
  const [selectedSeverity, setSelectedSeverity] = useState("ALL");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  useEffect(() => {
    loadLogs();
  }, []);

  const loadLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get("/audit");
      setLogs(response.data || []);
    } catch (error) {
      console.error(error);
      alert("Failed To Load Audit Logs");
    } finally {
      setLoading(false);
    }
  };

  const getSeverity = (log) => {
    const action = (log.action || "").toLowerCase();
    
    if (
      action.includes("failed") || 
      action.includes("error") || 
      action.includes("critical") || 
      action.includes("unauthorized") || 
      action.includes("blocked") || 
      action.includes("locked")
    ) {
      return "CRITICAL";
    }
    if (
      action.includes("denied") || 
      action.includes("invalid") || 
      action.includes("delete") || 
      action.includes("remove") || 
      action.includes("kill")
    ) {
      return "ERROR";
    }
    if (
      action.includes("low stock") || 
      action.includes("warning") || 
      action.includes("update") || 
      action.includes("change") || 
      action.includes("reset")
    ) {
      return "WARNING";
    }
    return "SUCCESS";
  };

  const getSeverityBadgeClass = (severity) => {
    switch (severity) {
      case "CRITICAL":
        return "bg-dark text-white border border-danger";
      case "ERROR":
        return "bg-danger";
      case "WARNING":
        return "bg-warning text-dark";
      case "SUCCESS":
        return "bg-success";
      default:
        return "bg-secondary";
    }
  };

  // Group consecutive duplicate logs
  const groupConsecutiveLogs = (logList) => {
    if (logList.length === 0) return [];
    const grouped = [];
    let current = { ...logList[0], repeatCount: 1 };
    
    for (let i = 1; i < logList.length; i++) {
      const log = logList[i];
      if (
        log.username === current.username &&
        log.action === current.action &&
        (log.moduleName || "").toUpperCase() === (current.moduleName || "").toUpperCase()
      ) {
        current.repeatCount += 1;
        if (new Date(log.actionTime) > new Date(current.actionTime)) {
          current.actionTime = log.actionTime;
        }
      } else {
        grouped.push(current);
        current = { ...log, repeatCount: 1 };
      }
    }
    grouped.push(current);
    return grouped;
  };

  // Statistics Computations
  const totalCount = logs.length;
  const criticalCount = logs.filter(l => getSeverity(l) === "CRITICAL" || getSeverity(l) === "ERROR").length;
  const hrCount = logs.filter(l => ["HR", "LEAVE", "PAYROLL", "ATTENDANCE"].includes((l.moduleName || "").toUpperCase())).length;
  const inventoryCount = logs.filter(l => ["INVENTORY", "PRODUCT", "PURCHASES"].includes((l.moduleName || "").toUpperCase())).length;

  // Filter logic
  const filteredLogs = logs.filter(log => {
    const severity = getSeverity(log);
    const matchesSearch =
      (log.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.action || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesModule = selectedModule === "ALL" || (log.moduleName || "").toUpperCase() === selectedModule.toUpperCase();
    const matchesSeverity = selectedSeverity === "ALL" || severity === selectedSeverity;
    
    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(log.actionTime) >= new Date(startDate);
    }
    if (endDate) {
      // Set to end of the day
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(log.actionTime) <= end;
    }

    return matchesSearch && matchesModule && matchesSeverity && matchesDate;
  });

  // Group duplicate consecutive events
  const displayLogs = groupConsecutiveLogs(filteredLogs);

  // Pagination
  const totalPages = Math.ceil(displayLogs.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = displayLogs.slice(indexOfFirstItem, indexOfLastItem);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ["Log ID", "Username", "Action Description", "Module", "Severity", "Timestamp"];
    const rows = filteredLogs.map(l => [
      l.id,
      l.username,
      l.action,
      l.moduleName || "SYSTEM",
      getSeverity(l),
      new Date(l.actionTime).toLocaleString("en-IN")
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `nova_audit_logs_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export Excel
  const handleExportExcel = () => {
    const worksheetData = filteredLogs.map(l => ({
      "Log ID": l.id,
      "Username": l.username,
      "Action Description": l.action,
      "Module": l.moduleName || "SYSTEM",
      "Severity": getSeverity(l),
      "Timestamp": new Date(l.actionTime).toLocaleString("en-IN")
    }));

    const worksheet = XLSX.utils.json_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Audit Logs Ledger");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8" });
    saveAs(data, `nova_audit_logs_${new Date().toISOString().split("T")[0]}.xlsx`);
  };

  // Distinct Modules found in current dataset
  const distinctModules = ["ALL", ...new Set(logs.map(l => (l.moduleName || "SYSTEM").toUpperCase()).filter(Boolean))];

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex flex-column align-items-center justify-content-center py-5 h-100">
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
          <h5 className="font-semibold text-secondary">Loading Audit Logs Database...</h5>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        
        {/* Title Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="mb-1 text-primary font-bold"><FaHistory /> Enterprise System Audit Ledger</h3>
            <p className="text-secondary mb-0">Track administrative activities, database query logs, and security alert events.</p>
          </div>
          
          {/* Export Controls */}
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary d-flex align-items-center gap-1.5" onClick={handleExportCSV}>
              <FaDownload size={12} /> Export CSV
            </button>
            <button className="btn btn-outline-primary d-flex align-items-center gap-1.5" onClick={handleExportExcel}>
              <FaDownload size={12} /> Export Excel
            </button>
          </div>
        </div>

        {/* Row 1: KPI Statistics Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-primary h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Total Logs</h6>
              <h3 className="font-bold text-dark mb-0">{totalCount}</h3>
              <span className="small text-secondary mt-1">Stored audit trail rows</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-danger h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Security Alerts</h6>
              <h3 className="font-bold text-danger mb-0">{criticalCount}</h3>
              <span className="small text-secondary mt-1">Failed logins or errors</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-warning h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">HR Activities</h6>
              <h3 className="font-bold text-warning mb-0">{hrCount}</h3>
              <span className="small text-secondary mt-1">Leaves, payrolls, checks</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-info h-100 bg-white">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Inventory Activities</h6>
              <h3 className="font-bold text-info mb-0">{inventoryCount}</h3>
              <span className="small text-secondary mt-1">Stock adjustments, PO requests</span>
            </div>
          </div>
        </div>

        {/* Row 2: Search and Advanced Filters */}
        <div className="card shadow-sm p-4 mb-4 bg-white border-0">
          <div className="row g-3">
            
            {/* Search Input */}
            <div className="col-lg-4 col-md-6">
              <label className="form-label font-semibold small text-secondary">Search Audit Description</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaSearch /></span>
                <input
                  className="form-control border-start-0"
                  placeholder="Username, operation details..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* Module Filter */}
            <div className="col-lg-2 col-md-3">
              <label className="form-label font-semibold small text-secondary">Filter Module</label>
              <select
                className="form-select font-medium"
                value={selectedModule}
                onChange={(e) => { setSelectedModule(e.target.value); setCurrentPage(1); }}
              >
                {distinctModules.map(mod => (
                  <option key={mod} value={mod}>{mod}</option>
                ))}
              </select>
            </div>

            {/* Severity Filter */}
            <div className="col-lg-2 col-md-3">
              <label className="form-label font-semibold small text-secondary">Filter Severity</label>
              <select
                className="form-select font-medium"
                value={selectedSeverity}
                onChange={(e) => { setSelectedSeverity(e.target.value); setCurrentPage(1); }}
              >
                <option value="ALL">All Severities</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="WARNING">WARNING</option>
                <option value="ERROR">ERROR</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
            </div>

            {/* Start Date Filter */}
            <div className="col-lg-2 col-md-6">
              <label className="form-label font-semibold small text-secondary">Start Date</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaCalendarAlt /></span>
                <input
                  type="date"
                  className="form-control border-start-0"
                  value={startDate}
                  onChange={(e) => { setStartDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            {/* End Date Filter */}
            <div className="col-lg-2 col-md-6">
              <label className="form-label font-semibold small text-secondary">End Date</label>
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaCalendarAlt /></span>
                <input
                  type="date"
                  className="form-control border-start-0"
                  value={endDate}
                  onChange={(e) => { setEndDate(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

          </div>
        </div>

        {/* Row 3: Audit Logs Table Ledger */}
        <div className="card shadow-sm p-4 mb-3 bg-white border-0">
          <div className="table-responsive">
            <table className="table table-modern align-middle" style={{ fontSize: "14px" }}>
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Username</th>
                  <th>Action</th>
                  <th>Module</th>
                  <th>Severity</th>
                  <th className="text-end">Date & Time</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(log => {
                    const severity = getSeverity(log);
                    return (
                      <tr key={log.id}>
                        <td><code>#{log.id}</code></td>
                        <td><strong>{log.username || "System"}</strong></td>
                        <td>
                          {log.action}
                          {log.repeatCount > 1 && (
                            <span className="badge bg-secondary ms-2" style={{ fontSize: "10px" }}>
                              x{log.repeatCount} duplicate events
                            </span>
                          )}
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border">
                            {log.moduleName || "SYSTEM"}
                          </span>
                        </td>
                        <td>
                          <span className={`badge ${getSeverityBadgeClass(severity)}`} style={{ fontSize: "11px" }}>
                            {severity}
                          </span>
                        </td>
                        <td className="text-end">
                          {new Date(log.actionTime).toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-secondary">No audit logs found matching selected query parameters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination */}
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 border-top pt-3">
            <span className="small text-secondary">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, displayLogs.length)} of {displayLogs.length} entries
            </span>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-xs btn-outline-primary py-1" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              >
                <FaArrowLeft size={11} /> Previous
              </button>
              <span className="font-semibold align-self-center px-2" style={{ fontSize: "13px" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn btn-xs btn-outline-primary py-1" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              >
                Next <FaArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}

export default AuditLogs;
