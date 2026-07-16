import React, { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { 
  FaCalendarPlus, FaCheckCircle, FaTimesCircle, FaHourglassHalf, 
  FaHistory, FaInfoCircle, FaTimes, FaCalendarAlt, FaUser, FaClipboardList 
} from "react-icons/fa";

function Leave() {
  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [employeeId, setEmployeeId] = useState("");
  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [emergencyContact, setEmergencyContact] = useState("");

  const [hrComment, setHrComment] = useState("");
  const [docFile, setDocFile] = useState(null);
  
  // Modals and selection state
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const role = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadLeaves();
    loadEmployees();
    
    // Set up auto-refresh interval for real-time workflow checks
    const interval = setInterval(() => {
      loadLeaves();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Auto calculate total days when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (start > end) {
        setTotalDays(0);
        return;
      }
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(isNaN(diffDays) ? 0 : diffDays);
    } else {
      setTotalDays(0);
    }
  }, [fromDate, toDate]);

  const loadLeaves = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hr/leaves`, getConfig());
      setLeaves(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`, getConfig());
      const employeesList = response.data || [];
      setEmployees(employeesList);
      
      const userRole = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
      const userNm = localStorage.getItem("username") || "";

      if (userRole === "EMPLOYEE") {
        const matched = employeesList.find(e => e.name.toLowerCase() === userNm.toLowerCase());
        if (matched) {
          setCurrentEmployee(matched);
          setEmployeeId(matched.id.toString());
        }
      } else {
        if (employeesList.length > 0) {
          setEmployeeId(employeesList[0].id.toString());
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setDocFile(e.target.files[0]);
    }
  };

  const handleCancelForm = () => {
    setReason("");
    setFromDate("");
    setToDate("");
    setEmergencyContact("");
    setDocFile(null);
    setLeaveType("Casual Leave");
  };

  const submitLeave = async () => {
    // Front-end Validations
    if (!fromDate || !toDate) {
      alert("Validation Error: Please select both From and To dates!");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    if (fromDate < today) {
      alert("Validation Error: Past dates are not allowed!");
      return;
    }
    if (fromDate > toDate) {
      alert("Validation Error: From Date cannot be after To Date!");
      return;
    }
    if (!reason.trim()) {
      alert("Validation Error: Reason cannot be empty!");
      return;
    }
    if (totalDays <= 0) {
      alert("Validation Error: Leave days must be positive!");
      return;
    }
    const balance = getLoggedInEmployeeBalance();
    if (totalDays > balance) {
      alert(`Validation Error: Leave request of ${totalDays} days exceeds your current leave balance (${balance} days remaining)!`);
      return;
    }

    const payload = {
      employeeId: Number(employeeId),
      leaveType,
      reason,
      fromDate,
      toDate,
      totalDays,
      emergencyContact,
      supportingDocPath: docFile ? docFile.name : ""
    };

    try {
      await axios.post(`${BASE_URL}/hr/leaves`, payload, getConfig());
      alert("Leave Request Submitted successfully! The request status is now PENDING.");
      handleCancelForm();
      loadLeaves();
      loadEmployees();
    } catch (error) {
      console.error(error);
      const errMessage = error.response?.data?.message || error.response?.data || "Submission Failed";
      alert(errMessage);
    }
  };

  const handleHRApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this leave request?")) return;
    try {
      await axios.put(`${BASE_URL}/hr/leaves/hr-approve/${id}`, {}, getConfig());
      alert("Leave request APPROVED. Attendance logs and employee leave balances have been updated.");
      setIsDetailsModalOpen(false);
      setSelectedLeave(null);
      loadLeaves();
      loadEmployees();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.response?.data || "Access Denied";
      alert(errMsg);
    }
  };

  const handleHRReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this leave request?")) return;
    try {
      const commentParam = hrComment.trim() ? `?hrComment=${encodeURIComponent(hrComment)}` : "";
      await axios.put(`${BASE_URL}/hr/leaves/reject/${id}${commentParam}`, {}, getConfig());
      alert("Leave request REJECTED. Remarks have been saved successfully.");
      setIsDetailsModalOpen(false);
      setSelectedLeave(null);
      setHrComment("");
      loadLeaves();
      loadEmployees();
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || error.response?.data || "Access Denied";
      alert(errMsg);
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : `Employee ID: ${empId}`;
  };

  const getLoggedInEmployeeBalance = () => {
    if (role === "EMPLOYEE" && currentEmployee) {
      return currentEmployee.leaveBalance || 0;
    }
    const userNm = localStorage.getItem("username") || "";
    const matched = employees.find(e => e.name.toLowerCase() === userNm.toLowerCase());
    return matched ? (matched.leaveBalance || 0) : 15;
  };

  const openDetailsModal = (leave) => {
    setSelectedLeave(leave);
    setHrComment(leave.hrComments || "");
    setIsDetailsModalOpen(true);
  };

  const leaveTypes = [
    "Casual Leave",
    "Sick Leave",
    "Medical Leave",
    "Earned Leave",
    "Maternity Leave",
    "Paternity Leave",
    "Emergency Leave"
  ];

  // Filter leaves based on role
  const displayLeaves = leaves.filter(l => {
    if (role === "EMPLOYEE") {
      const userNm = localStorage.getItem("username") || "";
      const matchedEmp = employees.find(e => e.name.toLowerCase() === userNm.toLowerCase());
      return matchedEmp && l.employeeId === matchedEmp.id;
    }
    return true;
  });

  // Dashboard Stats Calculations
  const pendingCount = displayLeaves.filter(l => l.status === "PENDING" || l.status === "PENDING_DOCS").length;
  const approvedCount = displayLeaves.filter(l => l.status === "APPROVED").length;
  const rejectedCount = displayLeaves.filter(l => l.status === "REJECTED").length;

  const todayStr = new Date().toISOString().split("T")[0];
  const todaysCount = displayLeaves.filter(l => l.appliedDate === todayStr).length;
  const priorityCount = displayLeaves.filter(l => l.leaveType === "Emergency Leave" || l.status === "PENDING_DOCS" || l.aiRecommendation === "REVIEW").length;

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        
        {/* Title Header */}
        <div className="mb-4">
          <h3 className="mb-1 text-primary font-bold">
            <FaClipboardList /> Enterprise Leave & Attendance Approvals
          </h3>
          <p className="text-secondary mb-0">
            Submit leave requests, review employee schedules, track leave balances, and verify AI analysis recommendations.
          </p>
        </div>

        {/* Dashboard Section (Calculated dynamically) */}
        <div className="row mb-4">
          <div className="col-lg col-md-4 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-warning h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="text-secondary font-semibold small uppercase mb-0">Pending Requests</h6>
                <FaHourglassHalf className="text-warning animate-pulse" size={14} />
              </div>
              <h3 className="font-bold text-dark mb-0">{pendingCount}</h3>
              <span className="small text-secondary mt-1">Awaiting HR override</span>
            </div>
          </div>

          <div className="col-lg col-md-4 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-success h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="text-secondary font-semibold small uppercase mb-0">Approved Requests</h6>
                <FaCheckCircle className="text-success" size={14} />
              </div>
              <h3 className="font-bold text-success mb-0">{approvedCount}</h3>
              <span className="small text-secondary mt-1">Balances deducted & logged</span>
            </div>
          </div>

          <div className="col-lg col-md-4 mb-3">
            <div className="card shadow-sm p-3 border-start border-4 border-danger h-100 bg-white">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="text-secondary font-semibold small uppercase mb-0">Rejected Requests</h6>
                <FaTimesCircle className="text-danger" size={14} />
              </div>
              <h3 className="font-bold text-danger mb-0">{rejectedCount}</h3>
              <span className="small text-secondary mt-1">Declined request records</span>
            </div>
          </div>

          {role !== "EMPLOYEE" && (
            <>
              <div className="col-lg col-md-6 mb-3">
                <div className="card shadow-sm p-3 border-start border-4 border-info h-100 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="text-secondary font-semibold small uppercase mb-0">Today's Requests</h6>
                    <FaCalendarAlt className="text-info" size={14} />
                  </div>
                  <h3 className="font-bold text-info mb-0">{todaysCount}</h3>
                  <span className="small text-secondary mt-1">Submitted today</span>
                </div>
              </div>

              <div className="col-lg col-md-6 mb-3">
                <div className="card shadow-sm p-3 border-start border-4 border-primary h-100 bg-white">
                  <div className="d-flex justify-content-between align-items-center mb-1">
                    <h6 className="text-secondary font-semibold small uppercase mb-0">Priority Cases</h6>
                    <FaInfoCircle className="text-primary" size={14} />
                  </div>
                  <h3 className="font-bold text-primary mb-0">{priorityCount}</h3>
                  <span className="small text-secondary mt-1">Flagged for attention</span>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Main Workspaces based on role */}
        {role === "EMPLOYEE" ? (
          <div className="row">
            {/* Employee Apply Form */}
            <div className="col-lg-5 mb-4">
              <div className="card border-0 shadow-sm p-4 mb-4 bg-white" style={{ borderRadius: "14px", background: "linear-gradient(135deg, rgba(16, 185, 129, 0.03) 0%, rgba(59, 130, 246, 0.03) 100%)", border: "1px solid rgba(16, 185, 129, 0.1)" }}>
                <h6 className="font-semibold text-secondary uppercase mb-1" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Available Leave Balance</h6>
                <div className="d-flex align-items-center gap-2">
                  <h3 className="font-bold text-success m-0">{getLoggedInEmployeeBalance()} Days</h3>
                  <span className="badge bg-success-soft text-success small font-bold px-2 py-0.5" style={{ fontSize: "10px" }}>Active Cycle</span>
                </div>
              </div>

              <div className="card shadow-sm p-4 bg-white border-0">
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2 text-dark">
                  <FaCalendarPlus className="text-primary" /> Apply For Leave
                </h5>

                {/* Auto-filled details */}
                {currentEmployee && (
                  <div className="row g-2 mb-3 bg-light p-2.5 rounded text-secondary small border">
                    <div className="col-6"><strong>Emp ID:</strong> {currentEmployee.id}</div>
                    <div className="col-6"><strong>Name:</strong> {currentEmployee.name}</div>
                    <div className="col-6"><strong>Dept:</strong> {currentEmployee.department || "N/A"}</div>
                    <div className="col-6"><strong>Title:</strong> {currentEmployee.designation || "N/A"}</div>
                    <div className="col-12 border-top pt-1 mt-1"><strong>Email:</strong> {currentEmployee.email || "N/A"}</div>
                  </div>
                )}

                <div className="mb-3">
                  <label className="form-label font-semibold small">Leave Type</label>
                  <select className="form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                    {leaveTypes.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">From Date</label>
                    <input type="date" className="form-control" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label font-semibold small">To Date</label>
                    <input type="date" className="form-control" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold text-secondary small">Total Days: <strong className="text-primary">{totalDays} Days</strong></label>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold small">Reason</label>
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="Enter reason for leave request..."
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                  ></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold small">Emergency Contact Number</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Emergency phone contact..."
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                  />
                </div>

                <div className="mb-4">
                  <label className="form-label font-semibold small">Supporting Document / Certificate</label>
                  <input type="file" className="form-control" onChange={handleFileChange} />
                  {docFile && <div className="text-success small mt-1">✓ Attached: {docFile.name}</div>}
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary w-50" onClick={submitLeave}>
                    Submit Request
                  </button>
                  <button className="btn btn-outline-secondary w-50" onClick={handleCancelForm}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>

            {/* Employee Leaves List */}
            <div className="col-lg-7 mb-4">
              <div className="card shadow-sm p-4 bg-white border-0 h-100">
                <h5 className="font-bold mb-4 text-dark">My Leave History</h5>
                <div className="table-responsive">
                  <table className="table table-modern align-middle" style={{ fontSize: "12.5px" }}>
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Type</th>
                        <th>Applied Date</th>
                        <th>Duration</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Remarks</th>
                        <th>Approved By</th>
                        <th>Approved Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayLeaves.length > 0 ? (
                        displayLeaves.map(leave => (
                          <tr key={leave.id}>
                            <td><code>#REQ-{leave.id}</code></td>
                            <td><span className="badge bg-light text-dark border">{leave.leaveType}</span></td>
                            <td>{leave.appliedDate || leave.fromDate}</td>
                            <td>{leave.fromDate} to {leave.toDate}</td>
                            <td><strong>{leave.totalDays}</strong></td>
                            <td>
                              <span className={`badge bg-${
                                leave.status === "APPROVED" ? "success" : 
                                leave.status === "REJECTED" ? "danger" : "warning text-dark"
                              }`} style={{ fontSize: "10.5px" }}>
                                {leave.status}
                              </span>
                            </td>
                            <td><span className="text-secondary text-truncate d-inline-block" style={{ maxWidth: "120px" }}>{leave.hrComments || "None"}</span></td>
                            <td>{leave.approvedBy || "N/A"}</td>
                            <td>{leave.approvedDate || "N/A"}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="9" className="text-center text-secondary py-4">No leave requests registered.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* HR/Admin Approval Panel */
          <div className="row">
            <div className="col-lg-12 mb-4">
              <div className="card shadow-sm p-4 bg-white border-0">
                <h5 className="font-bold mb-4 text-dark d-flex align-items-center gap-2">
                  <FaClipboardList className="text-primary" /> Leave Approval Administration Ledger
                </h5>
                <div className="table-responsive">
                  <table className="table table-modern align-middle" style={{ fontSize: "13px" }}>
                    <thead>
                      <tr>
                        <th>Request ID</th>
                        <th>Employee Name</th>
                        <th>Leave Type</th>
                        <th>From Date</th>
                        <th>To Date</th>
                        <th>Total Days</th>
                        <th>Reason</th>
                        <th>Emergency Contact</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayLeaves.length > 0 ? (
                        displayLeaves.map(leave => {
                          const isPending = leave.status === "PENDING" || leave.status === "PENDING_DOCS";
                          return (
                            <tr key={leave.id}>
                              <td><code>#REQ-{leave.id}</code></td>
                              <td><strong>{getEmpName(leave.employeeId)}</strong></td>
                              <td><span className="badge bg-light text-dark border">{leave.leaveType}</span></td>
                              <td>{leave.fromDate}</td>
                              <td>{leave.toDate}</td>
                              <td><strong>{leave.totalDays} Days</strong></td>
                              <td><span className="text-secondary text-truncate d-inline-block" style={{ maxWidth: "160px" }}>{leave.reason}</span></td>
                              <td>{leave.emergencyContact || "N/A"}</td>
                              <td>
                                <span className={`badge bg-${
                                  leave.status === "APPROVED" ? "success" : 
                                  leave.status === "REJECTED" ? "danger" : "warning text-dark"
                                }`} style={{ fontSize: "11px" }}>
                                  {leave.status}
                                </span>
                              </td>
                              <td className="text-end">
                                <div className="d-flex gap-1 justify-content-end">
                                  {isPending && (
                                    <>
                                      <button className="btn btn-xs btn-success text-white py-1 px-2.5" onClick={() => handleHRApprove(leave.id)}>
                                        Approve
                                      </button>
                                      <button className="btn btn-xs btn-danger text-white py-1 px-2.5" onClick={() => handleHRReject(leave.id)}>
                                        Reject
                                      </button>
                                    </>
                                  )}
                                  <button className="btn btn-xs btn-outline-secondary py-1 px-2.5" onClick={() => openDetailsModal(leave)}>
                                    View Details
                                  </button>
                                </div>
                              </td>
                            </tr>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan="10" className="text-center text-secondary py-4">No leave requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODAL: VIEW DETAILS & AI ANALYSER OVERLAY */}
        {isDetailsModalOpen && selectedLeave && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "650px", borderRadius: "14px", maxHeight: "90vh", overflowY: "auto" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-dark"><FaInfoCircle className="text-secondary" /> Leave Request Details</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsDetailsModalOpen(false)}><FaTimes /></button>
              </div>

              {/* Leave Basic Specs */}
              <div className="row g-3 mb-4 small">
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Request ID:</span>
                  <div className="font-bold">#REQ-{selectedLeave.id}</div>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Employee:</span>
                  <div className="font-bold">{getEmpName(selectedLeave.employeeId)}</div>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Leave Type:</span>
                  <div>{selectedLeave.leaveType}</div>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Duration:</span>
                  <div>{selectedLeave.fromDate} to {selectedLeave.toDate} ({selectedLeave.totalDays} Days)</div>
                </div>
                <div className="col-md-12">
                  <span className="text-secondary font-semibold">Reason:</span>
                  <div className="border p-2 bg-light rounded mt-1">{selectedLeave.reason}</div>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Emergency Contact:</span>
                  <div>{selectedLeave.emergencyContact || "N/A"}</div>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Current Status:</span>
                  <div>
                    <span className={`badge bg-${
                      selectedLeave.status === "APPROVED" ? "success" : 
                      selectedLeave.status === "REJECTED" ? "danger" : "warning text-dark"
                    }`} style={{ fontSize: "11px" }}>
                      {selectedLeave.status}
                    </span>
                  </div>
                </div>
                <div className="col-md-6">
                  <span className="text-secondary font-semibold">Stage:</span>
                  <div className="font-semibold text-secondary">{selectedLeave.stage || "N/A"}</div>
                </div>
                {selectedLeave.supportingDocPath && (
                  <div className="col-md-12">
                    <span className="text-secondary font-semibold">Attached Document:</span>
                    <div className="text-primary font-bold">📄 {selectedLeave.supportingDocPath}</div>
                  </div>
                )}
              </div>

              {/* AI Analysis Section */}
              <div className="card p-3 rounded mb-4 bg-light border-0">
                <h6 className="font-bold text-primary mb-3 d-flex align-items-center gap-1.5" style={{ fontSize: "14px" }}>
                  🤖 AI Decision Analysis
                </h6>
                <div className="row g-2 mb-3 text-secondary small">
                  <div className="col-md-6">
                    <strong>Leave Balance Check:</strong>
                    <div>{selectedLeave.aiLeaveBalance || "Sufficient Balance"}</div>
                  </div>
                  <div className="col-md-6">
                    <strong>Attendance Record:</strong>
                    <div>{selectedLeave.aiAttendanceSummary || "Satisfactory"}</div>
                  </div>
                  <div className="col-md-6">
                    <strong>Team Schedule Coverage:</strong>
                    <div>{selectedLeave.aiTeamAvailability || "No department conflicts"}</div>
                  </div>
                  <div className="col-md-6">
                    <strong>Mandatory Document Compliance:</strong>
                    <div>{selectedLeave.aiMedicalCertificateStatus || "N/A"}</div>
                  </div>
                </div>
                <div className="border-top pt-2 small">
                  <div className="d-flex justify-content-between align-items-center">
                    <span><strong>AI Compliance Check:</strong> {selectedLeave.aiPolicyCompliance || "Passed"}</span>
                    <span><strong>Confidence Score:</strong> <strong className="text-success">{selectedLeave.aiConfidenceScore || 90}%</strong></span>
                  </div>
                  <div className="mt-2 p-2 bg-white rounded border">
                    <div className="small font-bold text-secondary">AI Recommendation Rationale:</div>
                    <p className="m-0 text-dark small mt-0.5">{selectedLeave.aiReason || "No anomalies flagged. Standard parameters satisfied."}</p>
                  </div>
                </div>
              </div>

              {/* HR Override Actions inside Details */}
              {role !== "EMPLOYEE" && selectedLeave.status === "PENDING" && (
                <div className="border-top pt-3">
                  <div className="mb-3">
                    <label className="form-label font-semibold small">Comments / Action Notes</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Add override remarks or rejection reason..." 
                      value={hrComment} 
                      onChange={e => setHrComment(e.target.value)}
                    />
                  </div>
                  <div className="d-flex gap-2">
                    <button className="btn btn-success text-white w-50" onClick={() => handleHRApprove(selectedLeave.id)}>
                      Approve Request
                    </button>
                    <button className="btn btn-danger text-white w-50" onClick={() => handleHRReject(selectedLeave.id)}>
                      Reject Request
                    </button>
                  </div>
                </div>
              )}

              {selectedLeave.hrComments && (
                <div className="p-2.5 rounded bg-light border mt-2 small">
                  <span className="text-secondary font-bold">HR/Admin Action Comments:</span>
                  <p className="m-0 text-dark mt-0.5">{selectedLeave.hrComments}</p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default Leave;
