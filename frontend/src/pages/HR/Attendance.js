import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import {
  FaFingerprint, FaSignOutAlt, FaCalendarCheck, FaEdit, FaTrash, FaEye,
  FaFilePdf, FaFileExcel, FaSearch, FaFilter, FaBrain, FaCheck, FaTimes,
  FaPlus, FaCheckCircle, FaUserClock, FaTimesCircle, FaHourglassHalf, FaInfoCircle
} from "react-icons/fa";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from "recharts";

function Attendance() {
  const [attendance, setAttendance] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [corrections, setCorrections] = useState([]);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState("");
  
  // Navigation tabs
  const [activeTab, setActiveTab] = useState("logs");

  // Modals state
  const [showEditModal, setShowEditModal] = useState(false);
  const [editRecord, setEditRecord] = useState(null);
  const [editCheckIn, setEditCheckIn] = useState("");
  const [editCheckOut, setEditCheckOut] = useState("");
  const [editStatus, setEditStatus] = useState("PRESENT");
  const [editRemarks, setEditRemarks] = useState("");
  const [editDate, setEditDate] = useState("");
  const [modalError, setModalError] = useState("");

  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [detailsRecord, setDetailsRecord] = useState(null);

  const [showCorrectionModal, setShowCorrectionModal] = useState(false);
  const [corrAttendanceId, setCorrAttendanceId] = useState("");
  const [corrDate, setCorrDate] = useState("");
  const [corrCheckIn, setCorrCheckIn] = useState("");
  const [corrCheckOut, setCorrCheckOut] = useState("");
  const [corrReason, setCorrReason] = useState("");

  // AI insights state
  const [aiInsights, setAiInsights] = useState({
    absenteeismPrediction: "Analyzing workforce logs...",
    unusualPatterns: "Scanning biometric anomalies...",
    optimizationSuggestions: "Calculating shift balances...",
    anomalies: "Checking credential alignment..."
  });

  // Search, Filter & Pagination states
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const recordsPerPage = 10;

  const role = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
  const BASE_URL = API_BASE_URL + "/api";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadAttendance();
    loadEmployees();
    loadCorrections();
    loadAiInsights();
  }, []);

  const loadAttendance = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hr/attendance`, getConfig());
      setAttendance(response.data);
    } catch (error) {
      console.error("Error loading attendance:", error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`, getConfig());
      setEmployees(response.data);
      
      const userRole = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
      const userNm = localStorage.getItem("username") || "";

      if (userRole === "EMPLOYEE") {
        const matched = response.data.find(e => e.name.toLowerCase() === userNm.toLowerCase());
        if (matched) {
          setSelectedEmployeeId(matched.id.toString());
        } else if (response.data.length > 0) {
          setSelectedEmployeeId(response.data[0].id.toString());
        }
      } else {
        if (response.data.length > 0) {
          setSelectedEmployeeId(response.data[0].id.toString());
        }
      }
    } catch (error) {
      console.error("Error loading employees:", error);
    }
  };

  const loadCorrections = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hr/attendance/corrections`, getConfig());
      setCorrections(response.data);
    } catch (error) {
      console.error("Error loading corrections:", error);
    }
  };

  const loadAiInsights = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hr/attendance/ai-insights`, getConfig());
      setAiInsights(response.data);
    } catch (error) {
      console.error("Error loading AI insights:", error);
    }
  };

  const handleCheckIn = async () => {
    if (!selectedEmployeeId) {
      alert("Please select an employee!");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/hr/attendance`, { employeeId: Number(selectedEmployeeId) }, getConfig());
      alert("Attendance checked in successfully");
      loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await axios.put(`${BASE_URL}/hr/attendance/checkout/${attendanceId}`, {}, getConfig());
      alert("Checked out successfully");
      loadAttendance();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to check out");
    }
  };

  // Edit action
  const openEditModal = (record) => {
    setEditRecord(record);
    setEditDate(record.date || "");
    setEditCheckIn(record.checkInTime ? record.checkInTime.substring(0, 16) : "");
    setEditCheckOut(record.checkOutTime ? record.checkOutTime.substring(0, 16) : "");
    setEditStatus(record.status || "PRESENT");
    setEditRemarks(record.remarks || "");
    setModalError("");
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    if (editCheckIn && editCheckOut) {
      if (new Date(editCheckOut) < new Date(editCheckIn)) {
        setModalError("Check-Out time cannot be before Check-In time!");
        return;
      }
    }
    const payload = {
      employeeId: editRecord.employeeId,
      date: editDate,
      checkInTime: editCheckIn ? new Date(editCheckIn).toISOString() : null,
      checkOutTime: editCheckOut ? new Date(editCheckOut).toISOString() : null,
      status: editStatus,
      remarks: editRemarks
    };
    try {
      await axios.put(`${BASE_URL}/hr/attendance/${editRecord.id}`, payload, getConfig());
      alert("Attendance log updated successfully.");
      setShowEditModal(false);
      loadAttendance();
    } catch (error) {
      setModalError(error.response?.data?.message || "Failed to update attendance.");
    }
  };

  // Delete action
  const handleDeleteAttendance = async (id) => {
    if (!window.confirm("Are you sure you want to delete this attendance record? This action cannot be undone.")) return;
    try {
      await axios.delete(`${BASE_URL}/hr/attendance/${id}`, getConfig());
      alert("Attendance record deleted successfully.");
      loadAttendance();
    } catch (error) {
      alert("Failed to delete attendance record.");
    }
  };

  // Correction Submit
  const handleOpenCorrection = (record) => {
    setCorrAttendanceId(record ? record.id.toString() : "");
    setCorrDate(record ? record.date : new Date().toISOString().split("T")[0]);
    setCorrCheckIn(record && record.checkInTime ? record.checkInTime.substring(0, 16) : "");
    setCorrCheckOut(record && record.checkOutTime ? record.checkOutTime.substring(0, 16) : "");
    setCorrReason("");
    setShowCorrectionModal(true);
  };

  const handleSaveCorrection = async () => {
    if (!corrDate || !corrCheckIn || !corrCheckOut || !corrReason) {
      alert("Please fill in all fields!");
      return;
    }
    if (new Date(corrCheckOut) < new Date(corrCheckIn)) {
      alert("Check-Out time cannot be before Check-In time!");
      return;
    }
    const payload = {
      attendanceId: corrAttendanceId ? Number(corrAttendanceId) : null,
      requestDate: corrDate,
      requestedCheckIn: new Date(corrCheckIn).toISOString(),
      requestedCheckOut: new Date(corrCheckOut).toISOString(),
      reason: corrReason
    };
    try {
      await axios.post(`${BASE_URL}/hr/attendance/corrections`, payload, getConfig());
      alert("Correction request submitted successfully.");
      setShowCorrectionModal(false);
      loadCorrections();
    } catch (error) {
      alert("Failed to submit request.");
    }
  };

  const handleApproveCorrection = async (id) => {
    try {
      await axios.put(`${BASE_URL}/hr/attendance/corrections/approve/${id}`, {}, getConfig());
      alert("Correction request APPROVED.");
      loadCorrections();
      loadAttendance();
    } catch (error) {
      alert("Failed to approve request.");
    }
  };

  const handleRejectCorrection = async (id) => {
    try {
      await axios.put(`${BASE_URL}/hr/attendance/corrections/reject/${id}`, {}, getConfig());
      alert("Correction request REJECTED.");
      loadCorrections();
    } catch (error) {
      alert("Failed to reject request.");
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : `Employee ID: ${empId}`;
  };

  const getEmpCode = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.empCode : "-";
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      const date = new Date(timeStr);
      if (isNaN(date.getTime())) return timeStr;
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return timeStr;
    }
  };

  // Export to PDF
  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("NovaCore ERP - Corporate Attendance Ledger", 14, 15);
    const tableColumn = ["Employee", "Code", "Date", "Status", "Check In", "Check Out", "Working Hours", "Remarks"];
    const tableRows = [];

    attendance.forEach(item => {
      const rowData = [
        getEmpName(item.employeeId),
        getEmpCode(item.employeeId),
        item.date,
        item.status,
        formatTime(item.checkInTime),
        formatTime(item.checkOutTime),
        item.workingHours ? item.workingHours.toFixed(1) : "-",
        item.remarks || "-"
      ];
      tableRows.push(rowData);
    });

    doc.autoTable(tableColumn, tableRows, { startY: 20 });
    doc.save("NovaCore_Attendance_Logs.pdf");
  };

  // Export to Excel
  const exportExcel = () => {
    const data = attendance.map(item => ({
      "Employee": getEmpName(item.employeeId),
      "Employee Code": getEmpCode(item.employeeId),
      "Date": item.date,
      "Status": item.status,
      "Check In": item.checkInTime ? new Date(item.checkInTime).toLocaleString() : "-",
      "Check Out": item.checkOutTime ? new Date(item.checkOutTime).toLocaleString() : "-",
      "Working Hours": item.workingHours || 0,
      "Overtime (Hours)": item.overtime || 0,
      "Late Minutes": item.lateMinutes || 0,
      "Early Leaving Minutes": item.earlyLeavingMinutes || 0,
      "Remarks": item.remarks || ""
    }));
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance Logs");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, "NovaCore_Attendance_Logs.xlsx");
  };

  // Analytics logic
  const todayDateStr = new Date().toISOString().split("T")[0];
  const totalEmployeesCount = employees.length;
  const presentTodayCount = attendance.filter(item => item.date === todayDateStr && (item.status === "PRESENT" || item.status === "LATE" || item.status === "HALF_DAY")).length;
  const lateTodayCount = attendance.filter(item => item.date === todayDateStr && item.status === "LATE").length;
  const absentTodayCount = Math.max(0, totalEmployeesCount - presentTodayCount);
  const overtimeTodayCount = attendance.filter(item => item.date === todayDateStr && item.overtime > 0).length;

  // Chart Data: Status Distribution
  const chartData = [
    { name: "Present", value: attendance.filter(i => i.status === "PRESENT").length, fill: "#22c55e" },
    { name: "Late", value: attendance.filter(i => i.status === "LATE").length, fill: "#eab308" },
    { name: "Absent", value: attendance.filter(i => i.status === "ABSENT").length, fill: "#ef4444" },
    { name: "Half Day", value: attendance.filter(i => i.status === "HALF_DAY").length, fill: "#3b82f6" }
  ];

  // Active check-in record for current user
  const activeRecord = attendance.find(
    (item) =>
      item.employeeId.toString() === selectedEmployeeId &&
      item.date === todayDateStr &&
      !item.checkOutTime
  );

  // Search & filter logic
  const filteredAttendance = attendance
    .filter(item => {
      // Role filter
      if (role === "EMPLOYEE" && selectedEmployeeId) {
        return item.employeeId.toString() === selectedEmployeeId;
      }
      return true;
    })
    .filter(item => {
      // Search by employee name or code
      const name = getEmpName(item.employeeId).toLowerCase();
      const code = getEmpCode(item.employeeId).toLowerCase();
      const q = searchQuery.toLowerCase();
      return name.includes(q) || code.includes(q);
    })
    .filter(item => {
      // Status filter
      if (statusFilter === "ALL") return true;
      return item.status === statusFilter;
    })
    .filter(item => {
      // Date filter
      if (!dateFilter) return true;
      return item.date === dateFilter;
    });

  // Pagination logic
  const indexOfLastRecord = currentPage * recordsPerPage;
  const indexOfFirstRecord = indexOfLastRecord - recordsPerPage;
  const currentRecords = filteredAttendance.slice(indexOfFirstRecord, indexOfLastRecord);
  const totalPages = Math.ceil(filteredAttendance.length / recordsPerPage);

  const handlePageChange = (pageNo) => {
    if (pageNo >= 1 && pageNo <= totalPages) {
      setCurrentPage(pageNo);
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        {/* Banner Title */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="mb-1 text-primary font-bold">Attendance Command Center</h3>
            <p className="text-secondary mb-0">Monitor logs, approve correction workflows, and analyze workforce metrics.</p>
          </div>
          <div className="d-flex gap-2">
            <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={exportPDF}>
              <FaFilePdf className="text-danger" /> Export PDF
            </button>
            <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-1" onClick={exportExcel}>
              <FaFileExcel className="text-success" /> Export Excel
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="row mb-4">
          <div className="col-md-2-4 col-sm-6 mb-3">
            <div className="card glass-panel p-3 text-center h-100" style={{ minHeight: "125px", borderRadius: "14px" }}>
              <FaUserClock className="text-primary mx-auto mb-2" size={24} />
              <h6 className="text-secondary font-semibold mb-1" style={{ fontSize: "13px" }}>Total Employees</h6>
              <h3 className="font-bold text-primary mb-0">{totalEmployeesCount}</h3>
            </div>
          </div>
          <div className="col-md-2-4 col-sm-6 mb-3">
            <div className="card glass-panel p-3 text-center h-100" style={{ minHeight: "125px", borderRadius: "14px" }}>
              <FaCheckCircle className="text-success mx-auto mb-2" size={24} />
              <h6 className="text-secondary font-semibold mb-1" style={{ fontSize: "13px" }}>Present Today</h6>
              <h3 className="font-bold text-success mb-0">{presentTodayCount}</h3>
            </div>
          </div>
          <div className="col-md-2-4 col-sm-6 mb-3">
            <div className="card glass-panel p-3 text-center h-100" style={{ minHeight: "125px", borderRadius: "14px" }}>
              <FaHourglassHalf className="text-warning mx-auto mb-2" size={24} />
              <h6 className="text-secondary font-semibold mb-1" style={{ fontSize: "13px" }}>Late Arrivals</h6>
              <h3 className="font-bold text-warning mb-0">{lateTodayCount}</h3>
            </div>
          </div>
          <div className="col-md-2-4 col-sm-6 mb-3">
            <div className="card glass-panel p-3 text-center h-100" style={{ minHeight: "125px", borderRadius: "14px" }}>
              <FaTimesCircle className="text-danger mx-auto mb-2" size={24} />
              <h6 className="text-secondary font-semibold mb-1" style={{ fontSize: "13px" }}>Absent Today</h6>
              <h3 className="font-bold text-danger mb-0">{absentTodayCount}</h3>
            </div>
          </div>
          <div className="col-md-2-4 col-sm-6 mb-3">
            <div className="card glass-panel p-3 text-center h-100" style={{ minHeight: "125px", borderRadius: "14px" }}>
              <FaCalendarCheck className="text-info mx-auto mb-2" size={24} />
              <h6 className="text-secondary font-semibold mb-1" style={{ fontSize: "13px" }}>Overtime Today</h6>
              <h3 className="font-bold text-info mb-0">{overtimeTodayCount}</h3>
            </div>
          </div>
        </div>

        {/* Tab Selection */}
        <ul className="nav nav-tabs mb-4">
          <li className="nav-item">
            <button className={`nav-link font-semibold ${activeTab === "logs" ? "active text-primary" : "text-secondary"}`} onClick={() => setActiveTab("logs")}>
              Attendance Logs
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link font-semibold ${activeTab === "corrections" ? "active text-primary" : "text-secondary"}`} onClick={() => setActiveTab("corrections")}>
              Correction Requests {corrections.filter(c => c.status === "PENDING").length > 0 && <span className="badge bg-danger ms-1">{corrections.filter(c => c.status === "PENDING").length}</span>}
            </button>
          </li>
          <li className="nav-item">
            <button className={`nav-link font-semibold ${activeTab === "ai-insights" ? "active text-primary" : "text-secondary"}`} onClick={() => setActiveTab("ai-insights")}>
              AI Attendance Insights
            </button>
          </li>
        </ul>

        {activeTab === "logs" && (
          <div className="row">
            {/* Left Column: Biometric Punch */}
            <div className="col-lg-4 mb-4">
              <div className="card glass-panel p-4 mb-4">
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                  <FaFingerprint /> Biometric punch terminal
                </h5>
                <p className="text-secondary" style={{ fontSize: "13px" }}>
                  Perform biometric clock punches here. System automatically registers Late statuses after 9:15 AM.
                </p>

                {role !== "EMPLOYEE" && (
                  <div className="mb-3">
                    <label className="form-label font-semibold">Select Employee</label>
                    <select
                      className="form-select"
                      value={selectedEmployeeId}
                      onChange={(e) => setSelectedEmployeeId(e.target.value)}
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.name} {emp.empCode ? `(${emp.empCode})` : `(ID: ${emp.id})`} - {emp.department}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {activeRecord ? (
                  <button className="btn btn-danger w-100 py-2 font-semibold d-flex align-items-center justify-content-center gap-2" onClick={() => handleCheckOut(activeRecord.id)}>
                    <FaSignOutAlt /> Record Check-Out
                  </button>
                ) : (
                  <button className="btn btn-success w-100 py-2 font-semibold d-flex align-items-center justify-content-center gap-2" onClick={handleCheckIn}>
                    <FaFingerprint /> Record Check-In
                  </button>
                )}

                <hr />
                <button className="btn btn-outline-primary btn-sm w-100 font-semibold" onClick={() => handleOpenCorrection(null)}>
                  <FaPlus /> Submit Correction Request
                </button>
              </div>

              {/* Status Chart */}
              <div className="card glass-panel p-4">
                <h5 className="font-bold mb-3">Attendance Distribution</h5>
                <div style={{ width: "100%", height: 180 }}>
                  <ResponsiveContainer>
                    <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 5 }}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={11} />
                      <YAxis stroke="#888888" fontSize={11} />
                      <Tooltip />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Right Column: Attendance Logs Ledger */}
            <div className="col-lg-8 mb-4">
              <div className="card glass-panel p-4">
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                  <FaCalendarCheck /> Attendance Logs Ledger
                </h5>

                {/* Filters */}
                <div className="row g-2 mb-3">
                  <div className="col-md-5">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-transparent border-end-0">
                        <FaSearch className="text-secondary" />
                      </span>
                      <input
                        type="text"
                        className="form-control border-start-0"
                        placeholder="Search Employee / Code"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="input-group input-group-sm">
                      <span className="input-group-text bg-transparent border-end-0">
                        <FaFilter className="text-secondary" />
                      </span>
                      <select className="form-select border-start-0" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                        <option value="ALL">All Statuses</option>
                        <option value="PRESENT">Present</option>
                        <option value="LATE">Late</option>
                        <option value="ABSENT">Absent</option>
                        <option value="HALF_DAY">Half Day</option>
                      </select>
                    </div>
                  </div>
                  <div className="col-md-3">
                    <input
                      type="date"
                      className="form-control form-control-sm"
                      value={dateFilter}
                      onChange={(e) => setDateFilter(e.target.value)}
                    />
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-modern align-middle">
                    <thead>
                      <tr>
                        <th>Employee</th>
                        <th>Status</th>
                        <th>Date</th>
                        <th>Check In/Out</th>
                        <th>Hours / Overtime</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {currentRecords.length > 0 ? (
                        currentRecords.map((item) => (
                          <tr key={item.id}>
                            <td>
                              <h6 className="m-0 font-semibold">{getEmpName(item.employeeId)}</h6>
                              <span className="text-secondary" style={{ fontSize: "11px" }}>{getEmpCode(item.employeeId)}</span>
                            </td>
                            <td>
                              <span className={`badge-modern ${
                                item.status === "PRESENT" ? "bg-success text-white" :
                                item.status === "LATE" ? "bg-warning text-dark" :
                                item.status === "HALF_DAY" ? "bg-primary text-white" : "bg-danger text-white"
                              }`}>
                                {item.status}
                              </span>
                            </td>
                            <td>{item.date}</td>
                            <td>
                              <div style={{ fontSize: "12px" }}>In: {formatTime(item.checkInTime)}</div>
                              <div style={{ fontSize: "12px" }}>Out: {formatTime(item.checkOutTime)}</div>
                            </td>
                            <td>
                              <div>H: {item.workingHours ? item.workingHours.toFixed(1) : "-"}</div>
                              {item.overtime > 0 && <span className="text-success" style={{ fontSize: "11px", fontWeight: "bold" }}>OT: +{item.overtime.toFixed(1)}h</span>}
                            </td>
                            <td>
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-outline-info" onClick={() => { setDetailsRecord(item); setShowDetailsModal(true); }} title="View details">
                                  <FaEye />
                                </button>
                                {role !== "EMPLOYEE" && (
                                  <>
                                    <button className="btn btn-sm btn-outline-primary" onClick={() => openEditModal(item)} title="Edit Attendance">
                                      <FaEdit />
                                    </button>
                                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAttendance(item.id)} title="Delete record">
                                      <FaTrash />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center py-4 text-secondary">No matching attendance logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="d-flex justify-content-between align-items-center mt-3">
                    <span className="text-secondary" style={{ fontSize: "13px" }}>
                      Showing {indexOfFirstRecord + 1} to {Math.min(indexOfLastRecord, filteredAttendance.length)} of {filteredAttendance.length} records
                    </span>
                    <nav>
                      <ul className="pagination pagination-sm mb-0">
                        <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => handlePageChange(currentPage - 1)}>Previous</button>
                        </li>
                        {[...Array(totalPages)].map((_, i) => (
                          <li key={i} className={`page-item ${currentPage === i + 1 ? "active" : ""}`}>
                            <button className="page-link" onClick={() => handlePageChange(i + 1)}>{i + 1}</button>
                          </li>
                        ))}
                        <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
                          <button className="page-link" onClick={() => handlePageChange(currentPage + 1)}>Next</button>
                        </li>
                      </ul>
                    </nav>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Correction Requests tab */}
        {activeTab === "corrections" && (
          <div className="card glass-panel p-4">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h5 className="font-bold mb-0">Attendance Correction requests</h5>
              <button className="btn btn-primary btn-sm" onClick={() => handleOpenCorrection(null)}>
                <FaPlus /> Submit Correction
              </button>
            </div>

            <div className="table-responsive">
              <table className="table table-modern align-middle">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Request Date</th>
                    <th>Requested check-In</th>
                    <th>Requested check-Out</th>
                    <th>Reason</th>
                    <th>Status</th>
                    {role !== "EMPLOYEE" && <th>Actions</th>}
                  </tr>
                </thead>
                <tbody>
                  {corrections.length > 0 ? (
                    corrections.map((req) => (
                      <tr key={req.id}>
                        <td>
                          <h6 className="m-0 font-semibold">{getEmpName(req.employeeId)}</h6>
                          <span className="text-secondary" style={{ fontSize: "11px" }}>{getEmpCode(req.employeeId)}</span>
                        </td>
                        <td>{req.requestDate}</td>
                        <td>{req.requestedCheckIn ? new Date(req.requestedCheckIn).toLocaleString() : "-"}</td>
                        <td>{req.requestedCheckOut ? new Date(req.requestedCheckOut).toLocaleString() : "-"}</td>
                        <td>{req.reason}</td>
                        <td>
                          <span className={`badge-modern ${
                            req.status === "APPROVED" ? "bg-success text-white" :
                            req.status === "REJECTED" ? "bg-danger text-white" : "bg-warning text-dark"
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        {role !== "EMPLOYEE" && (
                          <td>
                            {req.status === "PENDING" && (
                              <div className="d-flex gap-1">
                                <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleApproveCorrection(req.id)}>
                                  <FaCheck /> Approve
                                </button>
                                <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={() => handleRejectCorrection(req.id)}>
                                  <FaTimes /> Reject
                                </button>
                              </div>
                            )}
                          </td>
                        )}
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={role === "EMPLOYEE" ? 6 : 7} className="text-center py-4 text-secondary">No correction requests logged.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* AI insights tab */}
        {activeTab === "ai-insights" && (
          <div className="card glass-panel p-4">
            <h5 className="font-bold mb-3 text-primary d-flex align-items-center gap-2">
              <FaBrain className="text-purple-500" /> AI Attendance Analytics Insights
            </h5>
            
            <div className="row">
              <div className="col-md-6 mb-3">
                <div className="card p-3 border-start border-4 border-info h-100 glass-panel">
                  <h6 className="font-semibold text-info d-flex align-items-center gap-1">
                    <FaInfoCircle /> Absenteeism Prediction
                  </h6>
                  <p className="text-secondary mt-2 mb-0" style={{ fontSize: "14px" }}>
                    {aiInsights.absenteeismPrediction}
                  </p>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="card p-3 border-start border-4 border-warning h-100 glass-panel">
                  <h6 className="font-semibold text-warning d-flex align-items-center gap-1">
                    <FaInfoCircle /> Unusual Patterns Detected
                  </h6>
                  <p className="text-secondary mt-2 mb-0" style={{ fontSize: "14px" }}>
                    {aiInsights.unusualPatterns}
                  </p>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="card p-3 border-start border-4 border-success h-100 glass-panel">
                  <h6 className="font-semibold text-success d-flex align-items-center gap-1">
                    <FaInfoCircle /> Optimization Recommendations
                  </h6>
                  <p className="text-secondary mt-2 mb-0" style={{ fontSize: "14px" }}>
                    {aiInsights.optimizationSuggestions}
                  </p>
                </div>
              </div>

              <div className="col-md-6 mb-3">
                <div className="card p-3 border-start border-4 border-primary h-100 glass-panel">
                  <h6 className="font-semibold text-primary d-flex align-items-center gap-1">
                    <FaInfoCircle /> Security punch Anomalies
                  </h6>
                  <p className="text-secondary mt-2 mb-0" style={{ fontSize: "14px" }}>
                    {aiInsights.anomalies}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ✏️ EDIT MODAL */}
      {showEditModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border border-primary p-3">
              <div className="modal-header">
                <h5 className="modal-title font-bold text-primary">Edit Attendance Record</h5>
                <button type="button" className="btn-close" onClick={() => setShowEditModal(false)}></button>
              </div>
              <div className="modal-body">
                {modalError && <div className="alert alert-danger p-2 mb-3 small">{modalError}</div>}
                
                <div className="mb-3">
                  <label className="form-label font-semibold">Employee Name</label>
                  <input type="text" className="form-control" value={getEmpName(editRecord.employeeId)} disabled />
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold">Date</label>
                  <input type="date" className="form-control" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold">Check-In Time</label>
                  <input type="datetime-local" className="form-control" value={editCheckIn} onChange={(e) => setEditCheckIn(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold">Check-Out Time</label>
                  <input type="datetime-local" className="form-control" value={editCheckOut} onChange={(e) => setEditCheckOut(e.target.value)} />
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold">Status</label>
                  <select className="form-select" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="PRESENT">Present</option>
                    <option value="LATE">Late</option>
                    <option value="ABSENT">Absent</option>
                    <option value="HALF_DAY">Half Day</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold">Remarks</label>
                  <textarea className="form-control" placeholder="e.g. Approved medical leave" value={editRemarks} onChange={(e) => setEditRemarks(e.target.value)} rows="2"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveEdit}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 👁️ VIEW DETAILS MODAL */}
      {showDetailsModal && detailsRecord && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border border-info p-3">
              <div className="modal-header">
                <h5 className="modal-title font-bold text-info">Attendance Details</h5>
                <button type="button" className="btn-close" onClick={() => setShowDetailsModal(false)}></button>
              </div>
              <div className="modal-body">
                <table className="table table-bordered table-sm small">
                  <tbody>
                    <tr>
                      <th className="bg-light w-40">Employee</th>
                      <td>{getEmpName(detailsRecord.employeeId)} ({getEmpCode(detailsRecord.employeeId)})</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Date</th>
                      <td>{detailsRecord.date}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Status</th>
                      <td>
                        <span className={`badge-modern ${
                          detailsRecord.status === "PRESENT" ? "bg-success text-white" :
                          detailsRecord.status === "LATE" ? "bg-warning text-dark" : "bg-danger text-white"
                        }`}>{detailsRecord.status}</span>
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-light">Check In</th>
                      <td>{detailsRecord.checkInTime ? new Date(detailsRecord.checkInTime).toLocaleString() : "-"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Check Out</th>
                      <td>{detailsRecord.checkOutTime ? new Date(detailsRecord.checkOutTime).toLocaleString() : "-"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Hours Worked</th>
                      <td>{detailsRecord.workingHours ? `${detailsRecord.workingHours.toFixed(1)} hours` : "-"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Overtime</th>
                      <td>{detailsRecord.overtime ? `${detailsRecord.overtime.toFixed(1)} hours` : "0.0 hours"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Late Minutes</th>
                      <td>{detailsRecord.lateMinutes ? `${detailsRecord.lateMinutes} min` : "0 min"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Early Leaving</th>
                      <td>{detailsRecord.earlyLeavingMinutes ? `${detailsRecord.earlyLeavingMinutes} min` : "0 min"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Remarks</th>
                      <td>{detailsRecord.remarks || "-"}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-info" onClick={() => setShowDetailsModal(false)}>Close</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CORRECTION REQUEST MODAL */}
      {showCorrectionModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content glass-panel border border-primary p-3">
              <div className="modal-header">
                <h5 className="modal-title font-bold text-primary">Attendance Correction Request</h5>
                <button type="button" className="btn-close" onClick={() => setShowCorrectionModal(false)}></button>
              </div>
              <div className="modal-body">
                <div className="mb-3">
                  <label className="form-label font-semibold">Employee Name</label>
                  <input type="text" className="form-control" value={getEmpName(Number(selectedEmployeeId))} disabled />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold">Target Date</label>
                  <input type="date" className="form-control" value={corrDate} onChange={(e) => setCorrDate(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold">Requested Check-In</label>
                  <input type="datetime-local" className="form-control" value={corrCheckIn} onChange={(e) => setCorrCheckIn(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold">Requested Check-Out</label>
                  <input type="datetime-local" className="form-control" value={corrCheckOut} onChange={(e) => setCorrCheckOut(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold">Reason for Correction</label>
                  <textarea className="form-control" placeholder="e.g. Forgot to clock out / Client meeting onsite" value={corrReason} onChange={(e) => setCorrReason(e.target.value)} rows="3"></textarea>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-outline-secondary" onClick={() => setShowCorrectionModal(false)}>Cancel</button>
                <button type="button" className="btn btn-primary" onClick={handleSaveCorrection}>Submit Request</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default Attendance;