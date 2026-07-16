import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaUserShield, FaExclamationTriangle, FaHeartbeat, FaInfoCircle, FaSearch, FaFilter, FaTimes } from "react-icons/fa";

function HRBurnoutDashboard() {
  const [data, setData] = useState({
    totalEmployees: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    criticalRiskCount: 0,
    averageScore: 0.0,
    highestRiskEmployee: "N/A",
    departmentBurnoutDistribution: {},
    top10Employees: [],
    allEmployees: []
  });

  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDept, setSelectedDept] = useState("ALL");
  const [selectedRisk, setSelectedRisk] = useState("ALL");
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserRole = localStorage.getItem("role") || "EMPLOYEE";
  const isEmployeeOnly = currentUserRole.trim().toUpperCase() === "EMPLOYEE";

  const API_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/hr/burnout";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token ? token.trim() : ""}` }
    };
  };

  useEffect(() => {
    loadBurnoutData();
  }, []);

  const loadBurnoutData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE, getConfig());
      setData(response.data);
      setFilteredEmployees(response.data.allEmployees || []);
    } catch (err) {
      console.error("Error loading burnout metrics:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filter logic
  useEffect(() => {
    if (!data.allEmployees) return;
    let filtered = [...data.allEmployees];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        e =>
          (e.employeeName && e.employeeName.toLowerCase().includes(q)) ||
          (e.empCode && e.empCode.toLowerCase().includes(q))
      );
    }

    if (selectedDept !== "ALL") {
      filtered = filtered.filter(e => e.department === selectedDept);
    }

    if (selectedRisk !== "ALL") {
      filtered = filtered.filter(e => e.riskLevel === selectedRisk);
    }

    setFilteredEmployees(filtered);
  }, [searchQuery, selectedDept, selectedRisk, data.allEmployees]);

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case "LOW":
        return "bg-success text-white";
      case "MEDIUM":
        return "bg-warning text-dark";
      case "HIGH":
        return "bg-danger text-white";
      case "CRITICAL":
        return "bg-dark text-danger font-bold";
      default:
        return "bg-secondary text-white";
    }
  };

  const getScoreColor = (score) => {
    if (score <= 30) return "#10b981"; // Success Green
    if (score <= 60) return "#f59e0b"; // Warning Orange
    if (score <= 80) return "#ef4444"; // Danger Red
    return "#7f1d1d"; // Dark Red for Critical
  };

  // Unique departments for filter dropdown
  const departments = data.allEmployees
    ? ["ALL", ...new Set(data.allEmployees.map(e => e.department).filter(Boolean))]
    : ["ALL"];

  return (
    <MainLayout>
      <div className="container-fluid py-4" style={{ color: "var(--text-color)" }}>
        {/* Title Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="font-bold text-primary mb-1">
              <FaHeartbeat className="me-2 text-danger animate-pulse" />
              AI HR Burnout Predictor
            </h2>
            <p className="text-secondary small mb-0">
              Workforce wellness indicators and stress analysis based on live ERP patterns.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={loadBurnoutData}>
            Refresh Analytics
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading wellness metrics...</span>
            </div>
            <p className="text-secondary mt-2">Analyzing work patterns...</p>
          </div>
        ) : (
          <>
            {/* Critical Alert Panel (Burnout Score > 80) */}
            {!isEmployeeOnly && data.allEmployees && data.allEmployees.some(e => e.burnoutScore > 80) && (
              <div className="card border-danger mb-4 shadow-sm" style={{ background: "rgba(220, 38, 38, 0.04)", borderRadius: "12px" }}>
                <div className="card-header bg-danger text-white d-flex align-items-center justify-content-between py-2.5">
                  <span className="font-bold d-flex align-items-center">
                    <FaExclamationTriangle className="me-2" /> Critical Employee Wellness Alerts
                  </span>
                  <span className="badge bg-light text-danger font-bold">
                    {data.allEmployees.filter(e => e.burnoutScore > 80).length} Employee(s)
                  </span>
                </div>
                <div className="card-body p-3" style={{ maxHeight: "200px", overflowY: "auto" }}>
                  {data.allEmployees
                    .filter(e => e.burnoutScore > 80)
                    .map(e => (
                      <div key={e.employeeId} className="d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between p-2 mb-2 bg-white border-start border-danger border-4 rounded shadow-sm text-dark">
                        <div>
                          <strong className="text-danger" style={{ fontSize: "14px" }}>
                            {e.employeeName} ({e.empCode}) - {e.department}
                          </strong>
                          <div className="small text-secondary mt-0.5">
                            <strong>Reason:</strong> High late arrivals ({e.lateCheckIns}), low attendance ({e.attendanceRate}%), consecutive stretch ({e.consecutiveDays} days) & pending tasks ({e.pendingTasks}).
                          </div>
                        </div>
                        <div className="mt-2 mt-md-0 text-md-end">
                          <span className="badge bg-dark text-danger me-2">Score: {e.burnoutScore}</span>
                          <button className="btn btn-xs btn-outline-danger py-0.5 px-2" onClick={() => setSelectedEmployee(e)}>
                            View Actions
                          </button>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Standard Dashboard Widgets (Hidden for Employee role) */}
            {!isEmployeeOnly ? (
              <>
                {/* Scorecards */}
                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                      <span className="text-secondary small font-semibold">Total Monitored</span>
                      <h3 className="font-bold mt-1 mb-0">{data.totalEmployees} Employees</h3>
                      <div className="small text-muted mt-2">Active database records</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                      <span className="text-secondary small font-semibold">System Average Score</span>
                      <h3 className="font-bold mt-1 mb-0" style={{ color: getScoreColor(data.averageScore) }}>
                        {data.averageScore} / 100
                      </h3>
                      <div className="small text-muted mt-2">Global stress index</div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                      <span className="text-secondary small font-semibold">Critical & High Risk</span>
                      <h3 className="font-bold mt-1 mb-0 text-danger">
                        {data.criticalRiskCount + data.highRiskCount} Count
                      </h3>
                      <div className="small text-danger mt-2 font-bold">
                        {data.criticalRiskCount} Critical | {data.highRiskCount} High
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6 col-lg-3">
                    <div className="card p-3 shadow-sm border-0" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                      <span className="text-secondary small font-semibold">Highest Risk Employee</span>
                      <h6 className="font-bold mt-2 mb-0 text-truncate text-danger" title={data.highestRiskEmployee}>
                        {data.highestRiskEmployee}
                      </h6>
                      <div className="small text-muted mt-2">Awaiting HR feedback</div>
                    </div>
                  </div>
                </div>

                {/* Visualizations Chart Sections */}
                <div className="row g-4 mb-4">
                  {/* Risk Distribution Chart */}
                  <div className="col-12 col-lg-5">
                    <div className="card p-4 shadow-sm border-0 h-100" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                      <h6 className="font-bold mb-3">Risk Distribution</h6>
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Critical Risk (81-100)</span>
                            <span className="font-bold text-danger">{data.criticalRiskCount}</span>
                          </div>
                          <div className="progress" style={{ height: "10px" }}>
                            <div className="progress-bar bg-dark" style={{ width: `${data.totalEmployees > 0 ? (data.criticalRiskCount / data.totalEmployees) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>High Risk (61-80)</span>
                            <span className="font-bold text-danger">{data.highRiskCount}</span>
                          </div>
                          <div className="progress" style={{ height: "10px" }}>
                            <div className="progress-bar bg-danger" style={{ width: `${data.totalEmployees > 0 ? (data.highRiskCount / data.totalEmployees) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Medium Risk (31-60)</span>
                            <span className="font-bold text-warning">{data.mediumRiskCount}</span>
                          </div>
                          <div className="progress" style={{ height: "10px" }}>
                            <div className="progress-bar bg-warning" style={{ width: `${data.totalEmployees > 0 ? (data.mediumRiskCount / data.totalEmployees) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                        <div>
                          <div className="d-flex justify-content-between small mb-1">
                            <span>Low Risk (0-30)</span>
                            <span className="font-bold text-success">{data.lowRiskCount}</span>
                          </div>
                          <div className="progress" style={{ height: "10px" }}>
                            <div className="progress-bar bg-success" style={{ width: `${data.totalEmployees > 0 ? (data.lowRiskCount / data.totalEmployees) * 100 : 0}%` }}></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Department Burnout Distribution */}
                  <div className="col-12 col-lg-7">
                    <div className="card p-4 shadow-sm border-0 h-100" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                      <h6 className="font-bold mb-3">Department-wise Burnout Distribution (Avg Score)</h6>
                      <div className="d-flex flex-column gap-3">
                        {Object.entries(data.departmentBurnoutDistribution || {}).map(([dept, score]) => (
                          <div key={dept}>
                            <div className="d-flex justify-content-between small mb-1">
                              <span className="font-semibold">{dept}</span>
                              <span className="font-bold" style={{ color: getScoreColor(score) }}>{score} / 100</span>
                            </div>
                            <div className="progress" style={{ height: "8px" }}>
                              <div className="progress-bar" style={{ width: `${score}%`, backgroundColor: getScoreColor(score) }}></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employees Score Table and Filter Controls */}
                <div className="card p-4 shadow-sm border-0" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <h5 className="font-bold mb-3">Employee Wellness Scores</h5>
                  
                  {/* Filters bar */}
                  <div className="row g-2 mb-3">
                    <div className="col-12 col-md-5">
                      <div className="input-group input-group-sm">
                        <span className="input-group-text bg-transparent border-end-0"><FaSearch /></span>
                        <input
                          type="text"
                          className="form-control border-start-0"
                          placeholder="Search employee or code..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-6 col-md-3">
                      <select className="form-select form-select-sm" value={selectedDept} onChange={(e) => setSelectedDept(e.target.value)}>
                        <option value="ALL">All Departments</option>
                        {departments.filter(d => d !== "ALL").map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-6 col-md-4">
                      <select className="form-select form-select-sm" value={selectedRisk} onChange={(e) => setSelectedRisk(e.target.value)}>
                        <option value="ALL">All Risk Levels</option>
                        <option value="LOW">Low Risk</option>
                        <option value="MEDIUM">Medium Risk</option>
                        <option value="HIGH">High Risk</option>
                        <option value="CRITICAL">Critical Risk</option>
                      </select>
                    </div>
                  </div>

                  <div className="table-responsive">
                    <table className="table table-hover align-middle" style={{ color: "var(--text-color)", borderColor: "var(--border-card)" }}>
                      <thead>
                        <tr className="text-secondary small uppercase">
                          <th>Employee</th>
                          <th>Department</th>
                          <th>Attendance Rate</th>
                          <th>Overtime (hrs)</th>
                          <th>Pending Tasks</th>
                          <th>Burnout Score</th>
                          <th>Risk Level</th>
                          <th className="text-end">Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredEmployees.length > 0 ? (
                          filteredEmployees.map(e => (
                            <tr key={e.employeeId}>
                              <td>
                                <div className="font-semibold">{e.employeeName}</div>
                                <div className="small text-secondary">{e.empCode}</div>
                              </td>
                              <td>{e.department}</td>
                              <td>{e.attendanceRate}%</td>
                              <td>{e.overtimeHours} hrs</td>
                              <td>
                                <span className={`badge ${e.pendingTasks > 3 ? "bg-warning text-dark" : "bg-light text-dark"}`}>
                                  {e.pendingTasks}
                                </span>
                              </td>
                              <td>
                                <div className="d-flex align-items-center gap-2">
                                  <span className="font-bold" style={{ color: getScoreColor(e.burnoutScore) }}>{e.burnoutScore}</span>
                                  <div className="progress flex-grow-1" style={{ height: "4px", width: "40px" }}>
                                    <div className="progress-bar" style={{ width: `${e.burnoutScore}%`, backgroundColor: getScoreColor(e.burnoutScore) }}></div>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`badge ${getRiskBadgeClass(e.riskLevel)}`}>{e.riskLevel}</span>
                              </td>
                              <td className="text-end">
                                <button className="btn btn-xs btn-outline-primary" onClick={() => setSelectedEmployee(e)}>
                                  Analyze
                                </button>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="8" className="text-center text-muted py-4">No matching employee records found.</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              /* Personal Scorecard View for Employees */
              <div className="row justify-content-center">
                <div className="col-12 col-md-8 col-lg-6">
                  {data.allEmployees && data.allEmployees[0] ? (
                    (() => {
                      const personal = data.allEmployees[0];
                      return (
                        <div className="card p-4 shadow-lg border-0" style={{ background: "var(--bg-card)", borderRadius: "16px" }}>
                          <div className="text-center mb-4">
                            <FaUserShield size={48} className="text-primary mb-3" />
                            <h4 className="font-bold mb-1">{personal.employeeName}</h4>
                            <div className="text-secondary small">{personal.empCode} | {personal.department}</div>
                          </div>

                          <div className="card p-3 border-0 text-center mb-4" style={{ backgroundColor: "rgba(37, 99, 235, 0.03)" }}>
                            <span className="text-secondary small font-semibold">Your Burnout Score</span>
                            <h1 className="font-bold display-4 my-2" style={{ color: getScoreColor(personal.burnoutScore) }}>
                              {personal.burnoutScore}
                            </h1>
                            <div>
                              <span className={`badge px-3 py-1.5 ${getRiskBadgeClass(personal.riskLevel)}`} style={{ fontSize: "12px" }}>
                                {personal.riskLevel} RISK
                              </span>
                            </div>
                          </div>

                          <h6 className="font-bold border-bottom pb-2 mb-3">AI Recommendation</h6>
                          <p className="small text-secondary mb-4 leading-relaxed bg-light p-3 rounded border-start border-primary border-4" style={{ color: "#374151" }}>
                            {personal.recommendation}
                          </p>

                          <h6 className="font-bold border-bottom pb-2 mb-3">Activity Breakdown</h6>
                          <div className="row g-3">
                            <div className="col-6">
                              <div className="small text-secondary">Attendance Rate</div>
                              <div className="font-bold">{personal.attendanceRate}%</div>
                            </div>
                            <div className="col-6">
                              <div className="small text-secondary">Late Arrivals</div>
                              <div className="font-bold text-warning">{personal.lateCheckIns} Check-ins</div>
                            </div>
                            <div className="col-6">
                              <div className="small text-secondary">Leaves Approved</div>
                              <div className="font-bold">{personal.leavesTaken} Days</div>
                            </div>
                            <div className="col-6">
                              <div className="small text-secondary">Overtime Logged</div>
                              <div className="font-bold">{personal.overtimeHours} Hours</div>
                            </div>
                            <div className="col-6">
                              <div className="small text-secondary">Work Streak</div>
                              <div className="font-bold">{personal.consecutiveDays} Consecutive Days</div>
                            </div>
                            <div className="col-6">
                              <div className="small text-secondary">Pending Tasks</div>
                              <div className="font-bold text-danger">{personal.pendingTasks} Assigned</div>
                            </div>
                          </div>
                        </div>
                      );
                    })()
                  ) : (
                    <div className="text-center text-muted py-5">No personal scorecard logs found. Contact HR.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Details Slide-out Drawer / Modal */}
      {selectedEmployee && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
          <div className="modal-dialog modal-dialog-centered modal-md">
            <div className="modal-content border-0 shadow" style={{ background: "var(--bg-card)", borderRadius: "14px", color: "var(--text-color)" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title font-bold">Employee Stress Assessment</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedEmployee(null)}></button>
              </div>
              <div className="modal-body p-4">
                <div className="text-center mb-4">
                  <h4 className="font-bold mb-1 text-primary">{selectedEmployee.employeeName}</h4>
                  <div className="small text-secondary">{selectedEmployee.empCode} | {selectedEmployee.department}</div>
                </div>

                <div className="d-flex align-items-center justify-content-between p-3 rounded mb-4 shadow-sm" style={{ backgroundColor: "rgba(37, 99, 235, 0.03)" }}>
                  <div>
                    <div className="small text-secondary">Burnout Score</div>
                    <h2 className="font-bold m-0" style={{ color: getScoreColor(selectedEmployee.burnoutScore) }}>
                      {selectedEmployee.burnoutScore} / 100
                    </h2>
                  </div>
                  <span className={`badge px-3 py-2 ${getRiskBadgeClass(selectedEmployee.riskLevel)}`}>
                    {selectedEmployee.riskLevel} RISK
                  </span>
                </div>

                <div className="mb-4">
                  <span className="small text-secondary font-bold d-block mb-1">DYNAMIC AI RECOMMENDATION</span>
                  <div className="p-3 bg-light rounded border-start border-4 border-primary small text-dark leading-relaxed">
                    {selectedEmployee.recommendation}
                  </div>
                </div>

                <h6 className="font-bold border-bottom pb-1.5 mb-3">Work Patterns Audit</h6>
                <div className="row g-3">
                  <div className="col-6">
                    <div className="small text-secondary">Attendance Rate</div>
                    <div className="font-semibold">{selectedEmployee.attendanceRate}%</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Late Check-ins</div>
                    <div className="font-semibold text-warning">{selectedEmployee.lateCheckIns} Check-ins</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Leaves Taken</div>
                    <div className="font-semibold">{selectedEmployee.leavesTaken} Days</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Overtime Logged</div>
                    <div className="font-semibold">{selectedEmployee.overtimeHours} Hours</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Max Work Streak</div>
                    <div className="font-semibold">{selectedEmployee.consecutiveDays} Days</div>
                  </div>
                  <div className="col-6">
                    <div className="small text-secondary">Pending Tasks</div>
                    <div className="font-semibold text-danger">{selectedEmployee.pendingTasks} Tasks</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-secondary w-100" onClick={() => setSelectedEmployee(null)}>
                  Close Analysis
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default HRBurnoutDashboard;
