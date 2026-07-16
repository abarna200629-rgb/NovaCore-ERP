import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaUserCheck, FaSync, FaExclamationTriangle, FaCheckCircle, FaUserPlus, FaLink } from "react-icons/fa";

function SyncAudit() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [repairing, setRepairing] = useState(false);
  const [selectedUserForEmp, setSelectedUserForEmp] = useState({});

  const API_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/sync";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token ? token.trim() : ""}` }
    };
  };

  const loadReport = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await axios.get(`${API_URL}/report`, getConfig());
      setReport(res.data);
    } catch (err) {
      console.error(err);
      setError("Failed to load synchronization audit report. Make sure backend is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
  }, []);

  const handleCreateUser = async (employeeId) => {
    try {
      setRepairing(true);
      await axios.post(`${API_URL}/create-user`, { employeeId }, getConfig());
      alert("User account successfully created and mapped to employee!");
      loadReport();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data || "Failed to create user account.");
    } finally {
      setRepairing(false);
    }
  };

  const handleLinkUser = async (employeeId) => {
    const userId = selectedUserForEmp[employeeId];
    if (!userId) {
      alert("Please select a user to link!");
      return;
    }
    try {
      setRepairing(true);
      await axios.post(`${API_URL}/repair`, { employeeId, userId: parseInt(userId) }, getConfig());
      alert("User mapping successfully repaired!");
      loadReport();
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || err.response?.data || "Failed to link user.");
    } finally {
      setRepairing(false);
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid py-4">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="font-bold m-0" style={{ fontSize: "28px", color: "var(--text-primary)" }}>
              User-Employee Synchronization Audit
            </h2>
            <p className="text-secondary small m-0">
              Audit mappings and resolve mismatches between Employee Directory and User Accounts.
            </p>
          </div>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={loadReport} disabled={loading || repairing}>
            <FaSync className={loading ? "spin" : ""} /> Refresh Report
          </button>
        </div>

        {error && (
          <div className="alert alert-danger" role="alert">
            {error}
          </div>
        )}

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary mt-2">Running database synchronization integrity checks...</p>
          </div>
        ) : report ? (
          <>
            {/* Summary Banner */}
            <div className={`card border-0 p-4 mb-4 ${report.status === "SYNCHRONIZED" ? "bg-light-success text-success border-start border-4 border-success" : "bg-light-warning text-warning border-start border-4 border-warning"}`} style={{ borderRadius: "12px" }}>
              <div className="d-flex align-items-center gap-3">
                {report.status === "SYNCHRONIZED" ? (
                  <FaCheckCircle size={32} className="text-success" />
                ) : (
                  <FaExclamationTriangle size={32} className="text-warning" />
                )}
                <div>
                  <h5 className="font-bold mb-1">
                    System State: {report.status === "SYNCHRONIZED" ? "Fully Synchronized" : "Mismatched Records Detected"}
                  </h5>
                  <p className="m-0 text-secondary" style={{ fontSize: "13.5px" }}>
                    {report.status === "SYNCHRONIZED" 
                      ? "Excellent! Every registered employee has exactly one linked active user account." 
                      : "Action Required: There are mismatched employee profiles and user accounts that need mapping repair."}
                  </p>
                </div>
              </div>
            </div>

            <div className="row">
              {/* Unmapped Employees List */}
              <div className="col-lg-7 mb-4">
                <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
                  <h5 className="font-bold mb-3 text-dark d-flex align-items-center gap-2">
                    <FaUserPlus /> Mismatched Employees (No User Account)
                  </h5>
                  <p className="text-secondary small mb-4">
                    The following employees exist in the directory but do not have a linked login user account.
                  </p>

                  <div className="table-responsive">
                    <table className="table align-middle" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Employee</th>
                          <th>Dept/Role</th>
                          <th>Action Mappings</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.unmappedEmployees && report.unmappedEmployees.length > 0 ? (
                          report.unmappedEmployees.map((emp) => (
                            <tr key={emp.id}>
                              <td>
                                <strong>{emp.name}</strong>
                                <span className="text-secondary d-block" style={{ fontSize: "11px" }}>{emp.empCode}</span>
                              </td>
                              <td>
                                <span className="badge bg-light text-dark border me-1">{emp.department}</span>
                                <span className="badge bg-info">{emp.role}</span>
                              </td>
                              <td>
                                <div className="d-flex flex-column gap-2">
                                  <button className="btn btn-sm btn-primary py-1" onClick={() => handleCreateUser(emp.id)} disabled={repairing}>
                                    <FaUserPlus /> Auto-Create User
                                  </button>
                                  <div className="d-flex gap-1">
                                    <select 
                                      className="form-select form-select-sm"
                                      value={selectedUserForEmp[emp.id] || ""}
                                      onChange={(e) => setSelectedUserForEmp({ ...selectedUserForEmp, [emp.id]: e.target.value })}
                                    >
                                      <option value="">-- Link to Existing --</option>
                                      {report.unmappedUsers && report.unmappedUsers.map(u => (
                                        <option key={u.id} value={u.id}>{u.username} ({u.role})</option>
                                      ))}
                                    </select>
                                    <button className="btn btn-sm btn-outline-success" onClick={() => handleLinkUser(emp.id)} disabled={repairing}>
                                      <FaLink /> Link
                                    </button>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center py-4 text-secondary">
                              No unmapped employee profiles found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Unmapped Users List */}
              <div className="col-lg-5 mb-4">
                <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
                  <h5 className="font-bold mb-3 text-dark d-flex align-items-center gap-2">
                    <FaUserCheck /> Mismatched Users (No Linked Employee)
                  </h5>
                  <p className="text-secondary small mb-4">
                    The following active user accounts are not linked to any employee record.
                  </p>

                  <div className="table-responsive">
                    <table className="table align-middle" style={{ fontSize: "13px" }}>
                      <thead>
                        <tr>
                          <th>Username</th>
                          <th>Role</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {report.unmappedUsers && report.unmappedUsers.length > 0 ? (
                          report.unmappedUsers.map((user) => (
                            <tr key={user.id}>
                              <td>
                                <strong>{user.username}</strong>
                                <span className="text-secondary d-block" style={{ fontSize: "11px" }}>{user.email || "No Email"}</span>
                              </td>
                              <td><span className="badge bg-secondary">{user.role}</span></td>
                              <td>
                                <span className={`badge bg-${user.status === "ACTIVE" ? "success" : "warning text-dark"}`}>
                                  {user.status}
                                </span>
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td colSpan="3" className="text-center py-4 text-secondary">
                              No unmapped active user accounts found.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </MainLayout>
  );
}

export default SyncAudit;
