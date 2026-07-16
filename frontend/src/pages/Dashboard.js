import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, Legend, Line
} from "recharts";
import {
  FaUserCheck, FaCalendarMinus, FaTasks, FaDollarSign,
  FaCoins, FaChartLine, FaBoxOpen, FaIndustry, FaStar, FaBullseye,
  FaShieldAlt, FaLeaf, FaWrench, FaExclamationTriangle,
  FaListOl, FaPlay, FaBrain, FaClock, FaCalendarAlt,
  FaCalendarPlus, FaTimesCircle, FaCheckCircle, FaInfoCircle, FaTimes, FaHourglassHalf
} from "react-icons/fa";

function Dashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.trim().toUpperCase().replace("ROLE_", "") : "";
  const username = localStorage.getItem("username");
  const employeeId = localStorage.getItem("employeeId");
  const isEmployee = role === "EMPLOYEE" || !!employeeId || (username && username.startsWith("EMP"));
  const [activeTab, setActiveTab] = useState("operational");
  const [dashboard, setDashboard] = useState({
    employees: 0,
    products: 0,
    customerCount: 0,
    salesCount: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    checkedOutToday: 0,
    pendingLeaves: 0,
    pendingTasks: 0,
    todaySalesAmount: 0,
    revenue: 0,
    expense: 0,
    profit: 0,
    lowStockProducts: 0,
    productionCount: 0,
    targetAchievement: 0,
    performanceRating: 0,
    timeline: [],
    financeTrendData: [],
    productDistribution: []
  });

  const canSeeHR = role === "ADMIN" || role === "HR";
  const canSeeInventory = role === "ADMIN" || role === "INVENTORY";
  const canSeeSales = role === "ADMIN" || role === "SALES" || role === "FINANCE";
  const canSeeFinance = role === "ADMIN" || role === "FINANCE";

  const [healthScores, setHealthScores] = useState({ overall: 0, finance: 0, hr: 0, inventory: 0, sales: 0 });
  const [aiRisks, setAiRisks] = useState([]);
  const [simulation, setSimulation] = useState(null);
  const [smartAlerts, setSmartAlerts] = useState([]);
  const [carbon, setCarbon] = useState(null);
  const [maintenance, setMaintenance] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [emergencyPurchasesLog, setEmergencyPurchasesLog] = useState([]);
  const [simParams, setSimParams] = useState({ priceChangePct: 0, expenseChangePct: 0, workforceChangePct: 0 });

  const [loading, setLoading] = useState(true);
  const [recentActivities, setRecentActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [activitiesError, setActivitiesError] = useState("");
  const [backendStatus, setBackendStatus] = useState("checking");

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [currentEmployee, setCurrentEmployee] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [attendanceLogs, setAttendanceLogs] = useState([]);
  const [payslips, setPayslips] = useState([]);
  const [employeePortalTab, setEmployeePortalTab] = useState(() => {
    const path = window.location.pathname;
    const search = window.location.search;
    if (search.includes("tab=payslips")) return "payslips";
    if (path === "/employee-dashboard") return "dashboard";
    if (path === "/employee/profile") return "profile";
    if (path === "/employee/attendance") return "attendance";
    if (path === "/employee/apply-leave") return "apply-leave";
    if (path === "/employee/my-leaves") return "my-leaves";
    return "dashboard";
  });

  const [leaveType, setLeaveType] = useState("Casual Leave");
  const [dayType, setDayType] = useState("Full Day");
  const [reason, setReason] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [totalDays, setTotalDays] = useState(0);
  const [emergencyContact, setEmergencyContact] = useState("");
  const [docFile, setDocFile] = useState(null);

  const [dbProducts, setDbProducts] = useState([]);
  const [dbPurchases, setDbPurchases] = useState([]);
  const [dbSuppliers, setDbSuppliers] = useState([]);

  const API_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/dashboard";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const checkBackendHealth = async () => {
    try {
      await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/health");
      setBackendStatus("connected");
      return true;
    } catch (err) {
      setBackendStatus("disconnected");
      setActivitiesLoading(false);
      setLoading(false);
      return false;
    }
  };

  // Auto calculate total days when dates change
  useEffect(() => {
    if (fromDate && toDate) {
      const start = new Date(fromDate);
      const end = new Date(toDate);
      if (start > end) {
        setTotalDays(0);
        return;
      }
      if (dayType === "Half Day") {
        setTotalDays(0.5);
        return;
      }
      const diffTime = Math.abs(end - start);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
      setTotalDays(isNaN(diffDays) ? 0 : diffDays);
    } else {
      setTotalDays(0);
    }
  }, [fromDate, toDate, dayType]);

  useEffect(() => {
    const path = location.pathname;
    const search = location.search;
    if (search.includes("tab=payslips")) setEmployeePortalTab("payslips");
    else if (path === "/employee-dashboard") setEmployeePortalTab("dashboard");
    else if (path === "/employee/profile") setEmployeePortalTab("profile");
    else if (path === "/employee/attendance") setEmployeePortalTab("attendance");
    else if (path === "/employee/apply-leave") setEmployeePortalTab("apply-leave");
    else if (path === "/employee/my-leaves") setEmployeePortalTab("my-leaves");
  }, [location.pathname, location.search]);

  const loadInventoryDashboardData = async () => {
    if (role !== "ADMIN" && role !== "INVENTORY") return;
    try {
      const prodRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory/products", getConfig());
      setDbProducts(prodRes.data || []);
      const purRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory/purchases", getConfig());
      setDbPurchases(purRes.data || []);
      const supRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory/suppliers", getConfig());
      setDbSuppliers(supRes.data || []);
    } catch (err) {
      console.error("Error loading inventory dashboard details:", err);
    }
  };

  useEffect(() => {
    checkBackendHealth();
    loadDashboard();
    loadAIData();
    loadRecentActivities();
    loadEmployeeDashboardData();
    loadInventoryDashboardData();
    const interval = setInterval(() => {
      checkBackendHealth();
      loadDashboard();
      loadAIData();
      loadRecentActivities();
      loadEmployeeDashboardData();
      loadInventoryDashboardData();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadEmployeeDashboardData = async () => {
    if (!isEmployee) return;
    
    const results = await Promise.allSettled([
      axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employee/leaves", getConfig()),
      axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employee/profile", getConfig()),
      axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/notifications", getConfig()),
      axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employee/attendance", getConfig()),
      axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employee/payslips", getConfig())
    ]);

    // 1. Leaves
    if (results[0].status === "fulfilled") {
      setLeaves(results[0].value.data || []);
    } else {
      console.error("Failed to load leaves:", results[0].reason);
    }

    // 2. Profile
    if (results[1].status === "fulfilled") {
      setCurrentEmployee(results[1].value.data);
    } else {
      console.error("Failed to load employee profile:", results[1].reason);
    }

    // 3. Notifications
    if (results[2].status === "fulfilled") {
      setNotifications(results[2].value.data || []);
    } else {
      console.error("Failed to load notifications:", results[2].reason);
    }

    // 4. Attendance logs
    if (results[3].status === "fulfilled") {
      setAttendanceLogs(results[3].value.data || []);
    } else {
      console.error("Failed to load attendance logs:", results[3].reason);
    }

    // 5. Payslips
    if (results[4].status === "fulfilled") {
      setPayslips(results[4].value.data || []);
    } else {
      console.error("Failed to load payslips:", results[4].reason);
    }
  };

  const handleCancelForm = () => {
    setReason("");
    setFromDate("");
    setToDate("");
    setEmergencyContact("");
    setDocFile(null);
    setLeaveType("Casual Leave");
    setDayType("Full Day");
  };

  const submitLeave = async () => {
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
    const balance = currentEmployee ? (currentEmployee.leaveBalance || 0) : 15;
    if (totalDays > balance) {
      alert(`Validation Error: Leave request of ${totalDays} days exceeds your current leave balance (${balance} days remaining)!`);
      return;
    }

    const payload = {
      employeeId: currentEmployee ? currentEmployee.id : null,
      leaveType,
      dayType,
      reason,
      fromDate,
      toDate,
      totalDays,
      emergencyContact,
      supportingDocPath: docFile ? docFile.name : ""
    };

    try {
      await axios.post((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employee/leaves", payload, getConfig());
      alert("Leave Request Submitted successfully! The request status is now PENDING and an email alert has been sent to HR.");
      handleCancelForm();
      loadEmployeeDashboardData();
    } catch (error) {
      console.error(error);
      const errMessage = error.response?.data?.message || error.response?.data || "Submission Failed";
      alert(errMessage);
    }
  };

  const loadDashboard = async () => {
    try {
      const response = await axios.get(API_URL, getConfig());
      setDashboard(response.data);
      setBackendStatus("connected");
    } catch (error) {
      console.log("Error loading dashboard:", error);
      if (!error.response || error.code === 'ERR_NETWORK') {
        setBackendStatus("disconnected");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadAIData = async () => {
    try {
      if (role === "ADMIN" || role === "FINANCE") {
        const healthRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/health-score", getConfig());
        setHealthScores(healthRes.data);
      }
      const risksRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/risks", getConfig());
      setAiRisks(risksRes.data || []);

      const alertsRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/alerts", getConfig());
      setSmartAlerts(alertsRes.data || []);

      if (role === "ADMIN" || role === "INVENTORY") {
        const carbonRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/carbon-footprint", getConfig());
        setCarbon(carbonRes.data);

        const maintRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/predictive-maintenance", getConfig());
        setMaintenance(maintRes.data || []);
      }

      const leaderboardRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/leaderboard", getConfig());
      setLeaderboard(leaderboardRes.data || []);
      setBackendStatus("connected");
    } catch (err) {
      console.log("Error loading cognitive AI data:", err);
      if (!err.response || err.code === 'ERR_NETWORK') {
        setBackendStatus("disconnected");
      }
    }
  };

  const loadRecentActivities = async () => {
    try {
      const response = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/audit-logs/recent", getConfig());
      setRecentActivities(response.data || []);
      setActivitiesError("");
      setBackendStatus("connected");
    } catch (err) {
      console.error("Error loading activities:", err);
      if (!err.response || err.code === 'ERR_NETWORK') {
        setBackendStatus("disconnected");
      } else {
        setActivitiesError("Failed to synchronize activities.");
      }
    } finally {
      setActivitiesLoading(false);
    }
  };

  const getRelativeTime = (timeStr) => {
    if (!timeStr) return "-";
    try {
      const date = new Date(timeStr);
      const now = new Date();
      const diffMs = now - date;
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffMins < 1) return "just now";
      if (diffMins < 60) return `${diffMins} min ago`;
      if (diffHours < 24) return `${diffHours} hours ago`;
      return `${diffDays} days ago`;
    } catch (e) {
      return timeStr;
    }
  };

  const getModuleBadge = (moduleName) => {
    const mod = (moduleName || "SYSTEM").toUpperCase();
    let bg = "bg-secondary";
    if (mod.includes("HR") || mod.includes("ATTENDANCE")) bg = "bg-success text-white";
    else if (mod.includes("INVENTORY") || mod.includes("PRODUCT")) bg = "bg-primary text-white";
    else if (mod.includes("SECURITY")) bg = "bg-danger text-white";
    else if (mod.includes("CLOUD")) bg = "bg-info text-dark";
    else if (mod.includes("FINANCE") || mod.includes("TRANSACTION")) bg = "bg-warning text-dark";
    return <span className={`badge ${bg}`} style={{ fontSize: "9px" }}>{mod}</span>;
  };

  const handleSimulate = async () => {
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_BASE_URL || (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + ""}/api/ai/simulate?priceChangePct=${simParams.priceChangePct}&expenseChangePct=${simParams.expenseChangePct}&workforceChangePct=${simParams.workforceChangePct}`, getConfig());
      setSimulation(response.data);
    } catch (error) {
      console.log("Simulation error:", error);
    }
  };

  const handleTriggerEmergencyPurchases = async () => {
    try {
      const response = await axios.post((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/emergency-purchase", {}, getConfig());
      setEmergencyPurchasesLog(response.data || []);
      loadDashboard();
    } catch (error) {
      console.log(error);
    }
  };


  const financeTrendData = dashboard.financeTrendData || [];
  const productDistribution = dashboard.productDistribution || [];

  const attendanceData = [
    { name: "Present", value: dashboard.presentToday || 0 },
    { name: "Absent", value: dashboard.absentToday || 0 },
    { name: "Late", value: dashboard.lateToday || 0 }
  ];

  const COLORS = ["#10b981", "#ef4444", "#f59e0b"];

  const criticalAlertsList = [
    canSeeInventory && dashboard.lowStockProducts > 0 && { title: "Low Stock Alert", text: `${dashboard.lowStockProducts} products below safety margin`, type: "danger" },
    canSeeHR && dashboard.pendingLeaves > 0 && { title: "Pending Leaves", text: `${dashboard.pendingLeaves} leave requests awaiting manager approval`, type: "warning" },
    canSeeHR && dashboard.pendingTasks > 0 && { title: "Tasks Pipeline", text: `${dashboard.pendingTasks} employee tasks pending completion`, type: "info" },
    canSeeSales && { title: "Sales Quota", text: `Target achievement currently at ${dashboard.targetAchievement.toFixed(1)}%`, type: "success" }
  ].filter(Boolean);

  const handleCheckIn = async () => {
    if (!currentEmployee) {
      alert("Error: No linked employee profile resolved for your account.");
      return;
    }
    try {
      await axios.post((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employee/attendance/checkin", {}, getConfig());
      alert("✓ Checked In successfully!");
      loadEmployeeDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to check in");
    }
  };

  const handleCheckOut = async (attendanceId) => {
    try {
      await axios.put(`${process.env.REACT_APP_API_BASE_URL || (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + ""}/api/employee/attendance/checkout/${attendanceId}`, {}, getConfig());
      alert("✓ Checked Out successfully!");
      loadEmployeeDashboardData();
    } catch (error) {
      alert(error.response?.data?.message || "Failed to check out");
    }
  };

  const EmployeeDashboardView = () => {
    const myLeaves = leaves.filter(l => currentEmployee && l.employeeId === currentEmployee.id);
    const balance = currentEmployee ? (currentEmployee.leaveBalance || 0) : 15;
    const myAttendance = attendanceLogs.filter(a => currentEmployee && a.employeeId === currentEmployee.id);
    const myPayslips = payslips.filter(p => currentEmployee && p.employeeId === currentEmployee.id);

    const todayStr = new Date().toISOString().split("T")[0];
    const activePunch = attendanceLogs.find(
      (item) =>
        currentEmployee &&
        item.employeeId === currentEmployee.id &&
        item.date === todayStr &&
        !item.checkOutTime
    );

    const holidays = [
      { date: "2026-01-01", name: "New Year's Day", type: "National Holiday" },
      { date: "2026-01-26", name: "Republic Day", type: "National Gazetted Holiday" },
      { date: "2026-04-14", name: "Dr. B.R. Ambedkar Jayanti", type: "Gazetted Holiday" },
      { date: "2026-05-01", name: "May Day / Labor Day", type: "Corporate Holiday" },
      { date: "2026-08-15", name: "Independence Day", type: "National Gazetted Holiday" },
      { date: "2026-10-02", name: "Gandhi Jayanti", type: "National Gazetted Holiday" },
      { date: "2026-11-01", name: "Deepavali / Kannada Rajyotsava", type: "Regional Holiday" },
      { date: "2026-12-25", name: "Christmas Day", type: "Gazetted Holiday" }
    ];

    return (
      <div className="animate-fade-in">
        {/* Welcome Section */}
        <div className="row mb-4">
          <div className="col-12">
            <div className="card border-0 p-4 bg-white shadow-sm" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
              <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
                <div>
                  <h4 className="font-bold text-dark mb-1" style={{ fontSize: "22px" }}>
                    Welcome, {currentEmployee ? currentEmployee.name : (localStorage.getItem("username") || "Employee")}!
                  </h4>
                  <p className="text-secondary m-0" style={{ fontSize: "13.5px" }}>NovaCore Employee Self Service Portal</p>
                </div>
                <div className="d-flex gap-2">
                  <span className="badge bg-primary px-3 py-2" style={{ fontSize: "12px" }}>ID: {currentEmployee ? (currentEmployee.empCode || currentEmployee.id) : "N/A"}</span>
                  <span className="badge bg-success px-3 py-2" style={{ fontSize: "12px" }}>Dept: {currentEmployee ? currentEmployee.department : "N/A"}</span>
                </div>
              </div>
            </div>
          </div>
        </div>



        {employeePortalTab === "dashboard" && (
          <div className="row">
            {/* ROW 1: Quick Stats / Overview */}
            <div className="col-12 mb-4">
              <div className="row g-3">
                {/* Leave Balance Widget */}
                <div className="col-md-3">
                  <div className="card shadow-sm border-0 p-3 bg-white h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-circle text-primary" style={{ backgroundColor: "rgba(37,99,235,0.08)" }}>
                        <FaCalendarAlt size={20} />
                      </div>
                      <div>
                        <span className="text-secondary small d-block" style={{ fontSize: "11px" }}>Available Leave Balance</span>
                        <h4 className="font-bold m-0 text-dark" style={{ fontSize: "18px" }}>{balance} Days</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Today's Attendance Widget */}
                <div className="col-md-3">
                  <div className="card shadow-sm border-0 p-3 bg-white h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-circle text-success" style={{ backgroundColor: "rgba(16,185,129,0.08)" }}>
                        <FaClock size={20} />
                      </div>
                      <div>
                        <span className="text-secondary small d-block" style={{ fontSize: "11px" }}>Today's Punch Status</span>
                        <h4 className="font-bold m-0 text-dark" style={{ fontSize: "14px" }}>
                          {activePunch ? `Checked In (${activePunch.status})` : "Not Checked In"}
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Next Salary Date Widget */}
                <div className="col-md-3">
                  <div className="card shadow-sm border-0 p-3 bg-white h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-circle text-info" style={{ backgroundColor: "rgba(6,182,212,0.08)" }}>
                        <FaDollarSign size={20} />
                      </div>
                      <div>
                        <span className="text-secondary small d-block" style={{ fontSize: "11px" }}>Next Salary Disbursement</span>
                        <h4 className="font-bold m-0 text-dark" style={{ fontSize: "16px" }}>28th {new Date().toLocaleString('default', { month: 'long' })}</h4>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Pending Leaves Widget */}
                <div className="col-md-3">
                  <div className="card shadow-sm border-0 p-3 bg-white h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                    <div className="d-flex align-items-center gap-3">
                      <div className="p-3 rounded-circle text-warning" style={{ backgroundColor: "rgba(245,158,11,0.08)" }}>
                        <FaHourglassHalf size={20} />
                      </div>
                      <div>
                        <span className="text-secondary small d-block" style={{ fontSize: "11px" }}>Pending Leave Requests</span>
                        <h4 className="font-bold m-0 text-dark" style={{ fontSize: "18px" }}>
                          {myLeaves.filter(l => l.status === "PENDING").length} Requests
                        </h4>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ROW 2: Self-Service Details */}
            <div className="col-lg-8 col-md-12 mb-3">

              {/* Pending Requests Details */}
              <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                <h5 className="font-bold mb-3 text-dark" style={{ fontSize: "16px" }}>Recent Leave Submissions</h5>
                <div className="table-responsive">
                  <table className="table table-hover align-middle m-0 text-secondary small">
                    <thead>
                      <tr>
                        <th>Dates</th>
                        <th>Type</th>
                        <th>Total Days</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.slice(0, 5).map(l => (
                        <tr key={l.id}>
                          <td className="text-dark font-medium">{l.fromDate} to {l.toDate}</td>
                          <td>{l.leaveType}</td>
                          <td>{l.totalDays} Days</td>
                          <td>
                            <span className={`badge ${l.status === 'APPROVED' ? 'bg-success' : l.status === 'REJECTED' ? 'bg-danger' : 'bg-warning'}`}>
                              {l.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {myLeaves.length === 0 && (
                        <tr>
                          <td colSpan="4" className="text-center py-3">No leave requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* ROW 3: Upcoming Holidays & Notifications */}
            <div className="col-lg-4 col-md-12 mb-3">
              {/* Upcoming Holidays */}
              <div className="card shadow-sm border-0 p-4 bg-white mb-4" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                <h5 className="font-bold mb-3 text-dark" style={{ fontSize: "16px" }}>Upcoming Company Holidays</h5>
                <div className="d-flex flex-column gap-3">
                  {holidays.filter(h => new Date(h.date) >= new Date()).slice(0, 3).map((h, i) => (
                    <div key={i} className="d-flex justify-content-between align-items-center border-bottom pb-2">
                      <div>
                        <strong className="text-dark d-block" style={{ fontSize: "13px" }}>{h.name}</strong>
                        <span className="text-secondary small" style={{ fontSize: "10.5px" }}>{h.type}</span>
                      </div>
                      <span className="badge bg-secondary text-secondary-soft" style={{ fontSize: "11px" }}>{h.date}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Notifications */}
              <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                <h5 className="font-bold mb-3 text-dark" style={{ fontSize: "16px" }}>Recent Notifications</h5>
                <div className="d-flex flex-column gap-3">
                  {notifications.slice(0, 3).map(n => (
                    <div key={n.id} className="pb-2 border-bottom">
                      <strong className="text-dark d-block" style={{ fontSize: "13.5px" }}>{n.title}</strong>
                      <p className="text-secondary m-0 small" style={{ fontSize: "11.5px" }}>{n.message}</p>
                    </div>
                  ))}
                  {notifications.length === 0 && (
                    <p className="text-secondary m-0 small text-center py-3">No notifications found.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: PROFILE */}
        {employeePortalTab === "profile" && (
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-3 text-dark">Profile Details</h5>
                <div className="d-flex flex-column gap-2 text-secondary small">
                  <div className="border-bottom pb-2"><strong>Employee Code:</strong> <span className="text-dark float-end">{currentEmployee ? currentEmployee.empCode : "N/A"}</span></div>
                  <div className="border-bottom pb-2"><strong>Full Name:</strong> <span className="text-dark float-end">{currentEmployee ? currentEmployee.name : "N/A"}</span></div>
                  <div className="border-bottom pb-2"><strong>Email Address:</strong> <span className="text-dark float-end">{currentEmployee ? currentEmployee.email : "N/A"}</span></div>
                  <div className="border-bottom pb-2"><strong>Phone Number:</strong> <span className="text-dark float-end">{currentEmployee ? currentEmployee.phoneNumber : "N/A"}</span></div>
                  <div className="border-bottom pb-2"><strong>Department:</strong> <span className="text-dark float-end">{currentEmployee ? currentEmployee.department : "N/A"}</span></div>
                  <div className="border-bottom pb-2"><strong>Designation:</strong> <span className="text-dark float-end">{currentEmployee ? currentEmployee.designation : "N/A"}</span></div>
                  <div className="border-bottom pb-2"><strong>Base Salary:</strong> <span className="text-dark float-end">₹{currentEmployee ? (currentEmployee.salary || 0).toLocaleString() : "0"}</span></div>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-3 text-dark">Notifications</h5>
                <div style={{ maxHeight: "250px", overflowY: "auto" }}>
                  {notifications.length > 0 ? (
                    notifications.map(n => (
                      <div key={n.id} className={`p-3 border rounded mb-2 ${n.readStatus ? "bg-light text-muted" : "bg-primary-soft text-dark"}`}>
                        <div className="font-bold small">{n.title}</div>
                        <div className="small">{n.message}</div>
                      </div>
                    ))
                  ) : (
                    <div className="text-secondary small text-center py-4">No notifications.</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: ATTENDANCE */}
        {employeePortalTab === "attendance" && (
          <div className="row">
            <div className="col-lg-4 mb-4">
              <div className="card shadow-sm p-4 text-center bg-white border-0" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-3 text-dark">Work Punch</h5>
                <p className="text-secondary small mb-4">Record your check-in and check-out timestamps directly into the database.</p>
                <div className="mb-4 bg-light p-3 rounded border">
                  <div className="text-secondary small mb-1">Today's Date</div>
                  <h5 className="font-bold text-dark mb-0">{new Date().toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</h5>
                </div>
                {activePunch ? (
                  <div>
                    <div className="alert alert-success py-2 mb-4" style={{ fontSize: "12.5px" }}>
                      Checked in at: <strong>{activePunch.checkInTime}</strong>
                    </div>
                    <button className="btn btn-danger w-100 py-2.5 font-bold" onClick={() => handleCheckOut(activePunch.id)}>
                      Check Out
                    </button>
                  </div>
                ) : (
                  <div>
                    <div className="alert alert-secondary py-2 mb-4" style={{ fontSize: "12.5px" }}>
                      Status: <strong>Not Checked In Today</strong>
                    </div>
                    <button className="btn btn-success w-100 py-2.5 font-bold" onClick={handleCheckIn}>
                      Check In
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="col-lg-8 mb-4">
              <div className="card shadow-sm p-4 bg-white border-0 h-100" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-4 text-dark">Biometric Punch History</h5>
                <div className="table-responsive">
                  <table className="table table-modern align-middle" style={{ fontSize: "12.5px" }}>
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Check In</th>
                        <th>Check Out</th>
                        <th>Hours</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myAttendance.length > 0 ? (
                        myAttendance.map(log => (
                          <tr key={log.id}>
                            <td><strong>{log.date}</strong></td>
                            <td><code>{log.checkInTime}</code></td>
                            <td><code>{log.checkOutTime || "—"}</code></td>
                            <td><strong>{log.workHours ? log.workHours.toFixed(2) : "0.00"} Hrs</strong></td>
                            <td>
                              <span className={`badge bg-${log.status === "PRESENT" ? "success" : log.status === "LATE" ? "warning text-dark" : "danger"}`}>
                                {log.status}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="5" className="text-center text-secondary py-4">No logs found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: APPLY LEAVE */}
        {employeePortalTab === "apply-leave" && (
          <div className="row">
            <div className="col-12 col-lg-8 mx-auto mb-4">
              <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-3 text-dark">Apply For Leave</h5>
                
                {/* Real ERP Auto-fill header */}
                <div className="bg-light p-3 rounded mb-4 border">
                  <h6 className="font-bold text-secondary small uppercase border-bottom pb-2 mb-3">Auto-filled Corporate Details</h6>
                  <div className="row g-3 small text-secondary">
                    <div className="col-md-6"><strong>Employee ID:</strong> <span className="text-dark ms-2">{currentEmployee ? currentEmployee.empCode : "N/A"}</span></div>
                    <div className="col-md-6"><strong>Employee Name:</strong> <span className="text-dark ms-2">{currentEmployee ? currentEmployee.name : "N/A"}</span></div>
                    <div className="col-md-6"><strong>Department:</strong> <span className="text-dark ms-2">{currentEmployee ? currentEmployee.department : "N/A"}</span></div>
                    <div className="col-md-6"><strong>Designation:</strong> <span className="text-dark ms-2">{currentEmployee ? currentEmployee.designation : "N/A"}</span></div>
                    <div className="col-md-6"><strong>Reporting Manager:</strong> <span className="text-dark ms-2">HR Department</span></div>
                    <div className="col-md-6"><strong>Corporate Email:</strong> <span className="text-dark ms-2">{currentEmployee ? currentEmployee.email : "N/A"}</span></div>
                    <div className="col-md-6"><strong>Leave Balance:</strong> <span className="text-success ms-2 font-bold">{balance} Days Available</span></div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold small">Leave Type</label>
                  <select className="form-select" value={leaveType} onChange={(e) => setLeaveType(e.target.value)}>
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Medical Leave">Medical Leave</option>
                    <option value="Earned Leave">Earned Leave</option>
                    <option value="Maternity Leave">Maternity Leave</option>
                    <option value="Paternity Leave">Paternity Leave</option>
                    <option value="Emergency Leave">Emergency Leave</option>
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold small">Day Option</label>
                  <select className="form-select" value={dayType} onChange={(e) => setDayType(e.target.value)}>
                    <option value="Full Day">Full Day</option>
                    <option value="Half Day">Half Day</option>
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
                  <textarea className="form-control" rows="3" placeholder="Explain the reason for leave request..." value={reason} onChange={(e) => setReason(e.target.value)}></textarea>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold small">Emergency Contact Number</label>
                  <input type="text" className="form-control" placeholder="Emergency phone contact..." value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
                </div>

                <div className="mb-4">
                  <label className="form-label font-semibold small">Supporting Certificate / Attachment (Optional)</label>
                  <input type="file" className="form-control" onChange={(e) => {
                    if (e.target.files && e.target.files.length > 0) {
                      setDocFile(e.target.files[0]);
                    }
                  }} />
                  {docFile && <div className="text-success small mt-1">✓ Attached: {docFile.name}</div>}
                </div>

                <div className="d-flex gap-2">
                  <button className="btn btn-primary w-50" onClick={submitLeave}>Submit Request</button>
                  <button className="btn btn-outline-secondary w-50" onClick={handleCancelForm}>Cancel</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: MY LEAVES & BALANCE */}
        {employeePortalTab === "my-leaves" && (
          <div className="row">
            <div className="col-md-4 mb-3">
              <div className="card shadow-sm p-4 border-start border-4 border-success bg-white mb-3" style={{ borderRadius: "14px" }}>
                <h6 className="text-secondary font-semibold small uppercase mb-1">Total Leave Balance</h6>
                <h3 className="font-bold text-success m-0" style={{ fontSize: "28px" }}>{balance} Days</h3>
              </div>
              <div className="card shadow-sm p-4 bg-white" style={{ borderRadius: "14px" }}>
                <h6 className="text-secondary font-semibold small mb-2 border-bottom pb-2">Leave Summary</h6>
                <div className="d-flex flex-column gap-2 small">
                  <div>Approved: <strong className="text-success float-end">{myLeaves.filter(l => l.status === "APPROVED").length} Requests</strong></div>
                  <div>Pending: <strong className="text-warning float-end">{myLeaves.filter(l => l.status === "PENDING").length} Requests</strong></div>
                  <div>Rejected: <strong className="text-danger float-end">{myLeaves.filter(l => l.status === "REJECTED").length} Requests</strong></div>
                </div>
              </div>
            </div>

            <div className="col-md-8 mb-3">
              <div className="card shadow-sm p-4 bg-white border-0 h-100" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-4 text-dark">My Leave Requests</h5>
                <div className="table-responsive">
                  <table className="table table-modern align-middle" style={{ fontSize: "12.5px" }}>
                    <thead>
                      <tr>
                        <th>Req ID</th>
                        <th>Type</th>
                        <th>Duration</th>
                        <th>Days</th>
                        <th>Status</th>
                        <th>Remarks</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myLeaves.length > 0 ? (
                        myLeaves.map(leave => (
                          <tr key={leave.id}>
                            <td><code>#REQ-{leave.id}</code></td>
                            <td><span className="badge bg-light text-dark border">{leave.leaveType}</span></td>
                            <td>{leave.fromDate} to {leave.toDate}</td>
                            <td><strong>{leave.totalDays}</strong></td>
                            <td>
                              <span className={`badge bg-${leave.status === "APPROVED" ? "success" : leave.status === "REJECTED" ? "danger" : "warning text-dark"}`}>
                                {leave.status}
                              </span>
                            </td>
                            <td><span className="text-secondary small">{leave.hrComments || "No comment"}</span></td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="6" className="text-center text-secondary py-4">No leave requests found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB: HOLIDAY CALENDAR */}
        {employeePortalTab === "holiday" && (
          <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
            <h5 className="font-bold mb-4 text-dark">Holiday Calendar (2026)</h5>
            <div className="table-responsive">
              <table className="table table-modern align-middle" style={{ fontSize: "12.5px" }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Holiday Name</th>
                    <th>Type</th>
                  </tr>
                </thead>
                <tbody>
                  {holidays.map((h, i) => (
                    <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                      <td><strong>{new Date(h.date).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</strong></td>
                      <td>{h.name}</td>
                      <td>
                        <span className={`badge bg-${h.type.includes("National") ? "primary" : h.type.includes("Corporate") ? "success" : "info"}`}>
                          {h.type}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB: PAYSLIPS */}
        {employeePortalTab === "payslips" && (
          <div className="card shadow-sm p-4 bg-white border-0" style={{ borderRadius: "14px" }}>
            <h5 className="font-bold mb-4 text-dark">My Payslips</h5>
            <div className="table-responsive">
              <table className="table table-modern align-middle" style={{ fontSize: "12.5px" }}>
                <thead>
                  <tr>
                    <th>Slip ID</th>
                    <th>Salary Month</th>
                    <th>Basic Salary</th>
                    <th>Allowances</th>
                    <th>Deductions</th>
                    <th>Net Salary</th>
                    <th>Payment Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {myPayslips.length > 0 ? (
                    myPayslips.map(slip => (
                      <tr key={slip.id}>
                        <td><code>#SLIP-{slip.id}</code></td>
                        <td><strong>{slip.salaryMonth}</strong></td>
                        <td>₹{slip.basicSalary.toLocaleString()}</td>
                        <td>₹{slip.allowances.toLocaleString()}</td>
                        <td>₹{slip.deductions.toLocaleString()}</td>
                        <td><strong className="text-primary">₹{slip.netSalary.toLocaleString()}</strong></td>
                        <td>
                          <span className={`badge bg-${slip.paymentStatus === "PAID" ? "success" : "warning text-dark"}`}>
                            {slip.paymentStatus}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => alert(`Salary Slip for ${slip.salaryMonth}\n\nBasic: ₹${slip.basicSalary}\nAllowances: ₹${slip.allowances}\nDeductions: ₹${slip.deductions}\nNet Transfer: ₹${slip.netSalary}\n\nStatus: ${slip.paymentStatus}`)}>
                            View Breakdown
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="text-center text-secondary py-4">No payslips registered for current employee profile.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <MainLayout>
      <div className="container-fluid" style={{ padding: "0 4px" }}>
        {/* Dynamic header with tab navigation */}
        <div className="d-flex justify-content-between align-items-center mb-3 flex-wrap gap-2">
          <div>
            <h2 className="font-bold m-0" style={{ fontSize: "28px", color: "var(--text-primary)" }}>Enterprise Command Center</h2>
            <p className="text-secondary m-0" style={{ fontSize: "12px" }}>Auto-Refreshing (5s)</p>
          </div>
          <div className="d-flex gap-2">
            {(role === "ADMIN" || role === "HR" || role === "FINANCE" || role === "INVENTORY" || role === "SALES" || role === "PRODUCTION" || role === "MANAGER") && (
              <button 
                className={`btn btn-sm ${activeTab === "operational" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("operational")}
              >
                Operational Command Center
              </button>
            )}
            {(role === "ADMIN" || role === "FINANCE") && (
              <button 
                className={`btn btn-sm ${activeTab === "ceo" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("ceo")}
              >
                CEO Executive Dashboard
              </button>
            )}
            {role === "ADMIN" && (
              <button 
                className={`btn btn-sm ${activeTab === "twin" ? "btn-primary" : "btn-outline-primary"}`}
                onClick={() => setActiveTab("twin")}
              >
                Digital Twin & Operations
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center py-5">
            <div className="spinner-border text-primary mb-3" role="status" style={{ width: "3rem", height: "3rem" }}>
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-secondary font-semibold">Synchronizing command center metrics with live database...</p>
          </div>
        ) : (role === "EMPLOYEE" || location.pathname.startsWith("/employee")) ? (
          <EmployeeDashboardView />
        ) : (
          <>
            {/* ==================== TAB 1: OPERATIONAL DASHBOARD ==================== */}
            {activeTab === "operational" && (
              <>
                {backendStatus === "disconnected" && (
                  <div className="alert alert-danger d-flex align-items-center gap-2 mb-3 shadow-sm py-2 px-3 border-danger animate-fade-in" style={{ borderRadius: "10px", fontSize: "13.5px" }}>
                    <FaExclamationTriangle className="text-danger flex-shrink-0" />
                    <div className="font-semibold text-dark">
                      ⚠️ NovaCore ERP Backend Server is currently offline. Please ensure the Spring Boot server is started and running on port 8080.
                    </div>
                  </div>
                )}
                {/* ROW 1: Enterprise Command Center */}
                <div className="row mb-3">
                  {/* Left: Welcome & Status */}
                  <div className="col-lg-5 col-md-12 mb-2">
                    <div className="card border-0 p-3 h-100" style={{ background: "linear-gradient(135deg, rgba(37,99,235,0.04) 0%, rgba(139,92,246,0.04) 100%)", borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                      <h4 className="font-bold text-dark mb-1" style={{ fontSize: "18px" }}>Welcome Back, {localStorage.getItem("username") || "User"}!</h4>
                      <p className="text-secondary m-0" style={{ fontSize: "13px" }}>Here is your enterprise overview. Command center metrics are synced with the live database.</p>
                      <div className="d-flex gap-4 mt-3">
                        <div>
                          <span className="text-secondary small uppercase d-block" style={{ fontSize: "10px" }}>Department</span>
                          <span className="badge bg-primary-soft text-primary mt-1" style={{ fontSize: "11px" }}>{role}</span>
                        </div>
                        <div>
                          <span className="text-secondary small uppercase d-block" style={{ fontSize: "10px" }}>Status</span>
                          <span className="badge bg-success-soft text-success mt-1" style={{ fontSize: "11px" }}>Active</span>
                        </div>
                        <div>
                          <span className="text-secondary small uppercase d-block" style={{ fontSize: "10px" }}>Cloud / Server</span>
                          <span className={`badge ${backendStatus === "connected" ? "bg-success-soft text-success" : backendStatus === "checking" ? "bg-info-soft text-info" : "bg-danger-soft text-danger"} mt-1`} style={{ fontSize: "11px" }}>
                            {backendStatus === "connected" ? "Online" : backendStatus === "checking" ? "Verifying..." : "Offline (Port 8080)"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Center: Compact Notifications (max 4, scrollable) */}
                  <div className="col-lg-4 col-md-6 mb-2">
                    <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                      <h6 className="text-dark font-bold mb-2 uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Critical Alerts & Tasks</h6>
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: "100px", overflowY: "auto" }}>
                        {criticalAlertsList.length > 0 ? (
                          criticalAlertsList.map((alert, idx) => (
                            <div key={idx} className="d-flex align-items-center justify-content-between p-1.5 rounded" style={{ background: "rgba(0,0,0,0.02)", fontSize: "12px" }}>
                              <div className="d-flex align-items-center gap-2">
                                <span className="rounded-circle d-inline-block" style={{ width: "8px", height: "8px", background: alert.type === "danger" ? "#ef4444" : alert.type === "warning" ? "#f59e0b" : alert.type === "success" ? "#10b981" : "#3b82f6" }}></span>
                                <span className="text-dark font-medium">{alert.title}</span>
                              </div>
                              <span className="text-secondary" style={{ fontSize: "11px" }}>{alert.text}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-secondary py-3" style={{ fontSize: "12px" }}>All processes running within thresholds.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Quick Actions */}
                  <div className="col-lg-3 col-md-6 mb-2">
                    <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                      <h6 className="text-dark font-bold mb-2 uppercase" style={{ fontSize: "11px", letterSpacing: "0.5px" }}>Quick Actions</h6>
                      <div className="d-flex flex-wrap gap-1.5">
                        {canSeeInventory ? (
                          <>
                            <Link to="/products" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>+ Add Product</Link>
                            <Link to="/stock-management" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>+ Update Stock</Link>
                            <Link to="/purchase-orders" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>+ Create PO</Link>
                            <Link to="/stock-management" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>+ Stock Transfer</Link>
                            <Link to="/stock-management" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>+ Warehouse</Link>
                            <Link to="/reports" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>+ Reports</Link>
                          </>
                        ) : (
                          <>
                            <Link to="/reports" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>Reports</Link>
                            {canSeeHR && <Link to="/employees" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>Employees</Link>}
                            {canSeeHR && <Link to="/leave" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>Leaves</Link>}
                            {canSeeSales && <Link to="/sales" className="btn btn-xs btn-outline-primary py-1 px-2 text-decoration-none" style={{ fontSize: "11px", fontWeight: "500" }}>Sales</Link>}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ROW 2: KPI Grid (Compact cards) */}
                <div className="row mb-2">
                  {canSeeHR && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card success">
                        <div className="kpi-details">
                          <h6>Attendance Today</h6>
                          <h2>{dashboard.presentToday} Present</h2>
                          <span className="small text-secondary">↑ 2% vs Avg Headcount</span>
                        </div>
                        <FaUserCheck className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeHR && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card warning">
                        <div className="kpi-details">
                          <h6>Pending Leaves</h6>
                          <h2>{dashboard.pendingLeaves} Request(s)</h2>
                          <span className="small text-secondary">↓ 4% vs Week Average</span>
                        </div>
                        <FaCalendarMinus className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeHR && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card danger">
                        <div className="kpi-details">
                          <h6>Pending Tasks</h6>
                          <h2>{dashboard.pendingTasks} Tasks</h2>
                          <span className="small text-secondary">Awaiting completion</span>
                        </div>
                        <FaTasks className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeSales && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card">
                        <div className="kpi-details">
                          <h6>Today's Sales</h6>
                          <h2>₹{(dashboard.todaySalesAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                          <span className="small text-secondary">↑ 8% vs Yesterday</span>
                        </div>
                        <FaDollarSign className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeFinance && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card success">
                        <div className="kpi-details">
                          <h6>Financial Revenue</h6>
                          <h2>₹{(dashboard.income || dashboard.revenue || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                          <span className="small text-secondary">↑ 12% vs Last Month</span>
                        </div>
                        <FaCoins className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeFinance && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card danger">
                        <div className="kpi-details">
                          <h6>Financial Expense</h6>
                          <h2>₹{(dashboard.expense || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                          <span className="small text-secondary">↓ 5% vs Target Budget</span>
                        </div>
                        <FaCoins className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeFinance && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card success">
                        <div className="kpi-details">
                          <h6>Net Profit</h6>
                          <h2>₹{(dashboard.profit || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</h2>
                          <span className="small text-secondary">↑ 15% vs Last Qtr</span>
                        </div>
                        <FaChartLine className="kpi-icon" />
                      </div>
                    </div>
                  )}

                  {canSeeInventory && (
                    <div className="col-lg-3 col-md-6 mb-3">
                      <div className="kpi-card warning">
                        <div className="kpi-details">
                          <h6>Low Stock Alerts</h6>
                          <h2>{dashboard.lowStockProducts} Product(s)</h2>
                          <span className="small text-danger">Requires PO generation</span>
                        </div>
                        <FaBoxOpen className="kpi-icon" />
                      </div>
                    </div>
                  )}
                </div>

                {/* ROW 3: Charts (50% / 50% grid layout) */}
                <div className="row mb-3">
                  {canSeeFinance && (
                    <div className="col-lg-6 col-md-12 mb-3">
                      <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                        <h5 className="font-bold mb-3" style={{ fontSize: "15px", color: "var(--text-primary)" }}>Monthly Financial Revenue vs Expense</h5>
                        <ResponsiveContainer width="100%" height={250}>
                          <AreaChart data={financeTrendData}>
                            <defs>
                              <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.05}/>
                              </linearGradient>
                              <linearGradient id="colorExp" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05}/>
                              </linearGradient>
                            </defs>
                            <XAxis dataKey="month" stroke="var(--text-secondary)" style={{ fontSize: "11px" }} />
                            <YAxis stroke="var(--text-secondary)" style={{ fontSize: "11px" }} />
                            <Tooltip contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }} />
                            <Legend />
                            <Area type="monotone" dataKey="revenue" stroke="#3b82f6" fillOpacity={1} fill="url(#colorRev)" name="Revenue" />
                            <Area type="monotone" dataKey="expense" stroke="#ef4444" fillOpacity={1} fill="url(#colorExp)" name="Expense" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}

                  <div className={canSeeFinance ? "col-lg-6 col-md-12 mb-3" : "col-lg-12 col-md-12 mb-3"}>
                    <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                      {canSeeHR ? (
                        <>
                          <h5 className="font-bold mb-3" style={{ fontSize: "15px", color: "var(--text-primary)" }}>Attendance Distribution</h5>
                          <ResponsiveContainer width="100%" height={250}>
                            <PieChart>
                              <Pie
                                data={attendanceData}
                                dataKey="value"
                                outerRadius={80}
                                label
                              >
                                {attendanceData.map((entry, index) => (
                                  <Cell key={index} fill={COLORS[index]} />
                                ))}
                              </Pie>
                              <Tooltip />
                              <Legend />
                            </PieChart>
                          </ResponsiveContainer>
                        </>
                      ) : (
                        <>
                          <h5 className="font-bold mb-3" style={{ fontSize: "15px", color: "var(--text-primary)" }}>Product Sales Distribution</h5>
                          <ResponsiveContainer width="100%" height={250}>
                            <BarChart data={productDistribution}>
                              <XAxis dataKey="name" stroke="var(--text-secondary)" style={{ fontSize: "11px" }} />
                              <YAxis stroke="var(--text-secondary)" style={{ fontSize: "11px" }} />
                              <Tooltip />
                              <Bar dataKey="value" fill="#8b5cf6" radius={[10, 10, 0, 0]}>
                                {productDistribution.map((entry, index) => (
                                  <Cell key={index} fill={index === 0 ? "#2563eb" : index === 1 ? "#8b5cf6" : "#ec4899"} />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* INVENTORY WORKSPACE TABLES (PRIMARY OPERATIONAL MODULES) */}
                {canSeeInventory && (
                  <div className="row mb-4">
                    {/* Low Stock Alerts */}
                    <div className="col-lg-6 mb-3">
                      <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="font-bold text-dark m-0" style={{ fontSize: "16px" }}>Low Stock Alerts</h5>
                          <Link to="/low-stock-alerts" className="text-primary small text-decoration-none font-semibold">View All</Link>
                        </div>
                        <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                          <table className="table table-hover align-middle m-0 text-secondary small">
                            <thead>
                              <tr>
                                <th>SKU</th>
                                <th>Product</th>
                                <th>Stock</th>
                                <th>Min</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dbProducts.filter(p => p.stock <= p.minStock).length > 0 ? (
                                dbProducts.filter(p => p.stock <= p.minStock).slice(0, 5).map((p) => (
                                  <tr key={p.id}>
                                    <td className="font-bold">{p.sku}</td>
                                    <td className="font-semibold text-dark">{p.name || p.productName}</td>
                                    <td className="text-danger font-bold">{p.stock}</td>
                                    <td>{p.minStock}</td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="4" className="text-center py-3">All stocks running above margin levels.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>

                    {/* Purchase Orders */}
                    <div className="col-lg-6 mb-3">
                      <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                        <div className="d-flex justify-content-between align-items-center mb-3">
                          <h5 className="font-bold text-dark m-0" style={{ fontSize: "16px" }}>Purchase Orders</h5>
                          <Link to="/purchase-orders" className="text-primary small text-decoration-none font-semibold">Manage POs</Link>
                        </div>
                        <div className="table-responsive" style={{ maxHeight: "250px", overflowY: "auto" }}>
                          <table className="table table-hover align-middle m-0 text-secondary small">
                            <thead>
                              <tr>
                                <th>PO ID</th>
                                <th>Product</th>
                                <th>Qty</th>
                                <th>Price</th>
                                <th>Status</th>
                              </tr>
                            </thead>
                            <tbody>
                              {dbPurchases.length > 0 ? (
                                dbPurchases.slice(0, 5).map((req) => (
                                  <tr key={req.id}>
                                    <td className="font-bold">#PO-{req.id}</td>
                                    <td className="font-semibold text-dark">{req.productName}</td>
                                    <td className="font-bold">{req.quantity}</td>
                                    <td>${req.price ? req.price.toFixed(2) : "0.00"}</td>
                                    <td>
                                      <span className={`badge ${req.status === "APPROVED" ? "bg-success-soft text-success" : req.status === "REJECTED" ? "bg-danger-soft text-danger" : "bg-warning-soft text-warning"}`}>
                                        {req.status}
                                      </span>
                                    </td>
                                  </tr>
                                ))
                              ) : (
                                <tr>
                                  <td colSpan="5" className="text-center py-3">No purchase orders registered.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* ROW 4: AI Recommendations & Recent Activities */}
                <div className="row mb-3">
                  {/* Left: AI Operational Insights Panel */}
                  <div className="col-lg-6 col-md-12 mb-3">
                    <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                      <h5 className="font-bold text-primary mb-3 d-flex align-items-center gap-2" style={{ fontSize: "16px" }}>
                        <FaBrain /> AI Cognitive Hub Recommendations
                      </h5>
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: "280px", overflowY: "auto" }}>
                        {aiRisks.length > 0 ? (
                          aiRisks.slice(0, 4).map((risk, index) => (
                            <div key={index} className="p-2.5 rounded d-flex justify-content-between align-items-center" style={{
                              background: risk.level === "CRITICAL" ? "rgba(239, 68, 68, 0.04)" : "rgba(59, 130, 246, 0.04)",
                              border: risk.level === "CRITICAL" ? "1px solid rgba(239, 68, 68, 0.15)" : "1px solid rgba(59, 130, 246, 0.15)"
                            }}>
                              <div>
                                <span className={`badge mb-1 ${risk.level === "CRITICAL" ? "bg-danger" : "bg-primary"}`} style={{ fontSize: "9px" }}>{risk.level} Priority</span>
                                <div className="font-bold text-dark" style={{ fontSize: "13px" }}>{risk.category} Sector Anomaly</div>
                                <p className="m-0 text-secondary" style={{ fontSize: "11.5px" }}>{risk.description}</p>
                              </div>
                              <button className="btn btn-xs btn-outline-primary py-1 px-2 flex-shrink-0" style={{ fontSize: "11px" }} onClick={() => navigate(risk.category === "Inventory" ? "/products" : "/dashboard")}>Action</button>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-secondary py-4" style={{ fontSize: "12px" }}>No anomalies reported.</div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Activity Timeline */}
                  <div className="col-lg-6 col-md-12 mb-3">
                    <div className="card border-0 p-3 h-100" style={{ borderRadius: "14px", border: "1px solid var(--border-card)", background: "var(--bg-card)" }}>
                      <h5 className="font-bold mb-3 d-flex align-items-center gap-2" style={{ fontSize: "16px", color: "var(--text-primary)" }}>
                        <FaClock className="text-secondary" /> Recent System Activities
                      </h5>
                      <div className="timeline-list" style={{ maxHeight: "280px", overflowY: "auto" }}>
                        {activitiesLoading ? (
                          <div className="d-flex justify-content-center align-items-center py-5">
                            <div className="spinner-border text-primary spinner-border-sm" role="status"></div>
                            <span className="ms-2 text-secondary" style={{ fontSize: "12.5px" }}>Loading activities...</span>
                          </div>
                        ) : activitiesError ? (
                          <div className="alert alert-danger p-2 small m-3" style={{ fontSize: "12px" }}>{activitiesError}</div>
                        ) : recentActivities && recentActivities.length > 0 ? (
                          recentActivities.map((act) => (
                            <div key={act.id} className="timeline-item d-flex gap-3 align-items-start border-bottom pb-2 mb-2" style={{ fontSize: "12.5px" }}>
                              <span className="text-secondary font-semibold" style={{ fontSize: "10.5px", minWidth: "75px" }}>
                                <FaCalendarAlt size={10} className="me-1" />
                                {getRelativeTime(act.actionTime)}
                              </span>
                              <div className="timeline-content text-dark flex-grow-1">
                                <span className="font-bold text-primary me-1">@{act.username}</span>
                                <span>{act.action}</span>
                              </div>
                              <div className="ms-auto flex-shrink-0">
                                {getModuleBadge(act.moduleName)}
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center text-secondary py-5" style={{ fontSize: "12.5px" }}>No recent activities logged.</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Employee Self Service Section for Departmental Employees */}
                {isEmployee && (
                  <div className="row mt-4 mb-3">
                    <div className="col-12">
                      <div className="card shadow-sm border-0 p-4 bg-white" style={{ borderRadius: "14px", border: "1px solid var(--border-card)" }}>
                        <h5 className="font-bold text-dark mb-3 border-bottom pb-2" style={{ fontSize: "16px" }}>
                          <FaUserCheck className="text-primary me-2" /> Employee Self Service
                        </h5>
                        <div className="row g-3">
                          {/* Attendance Punch status & quick action */}
                          <div className="col-md-3">
                            <div className="card p-3 bg-light border-0 h-100" style={{ borderRadius: "10px" }}>
                              <span className="text-secondary small d-block">Today's Attendance</span>
                              <strong className="text-dark d-block mt-1">
                                {attendanceLogs.find(a => currentEmployee && a.employeeId === currentEmployee.id && a.date === new Date().toISOString().split("T")[0] && !a.checkOutTime) ? "Checked In" : "Not Checked In"}
                              </strong>
                              <Link to="/employee/attendance" className="btn btn-xs btn-primary mt-2 py-1 w-100 font-semibold" style={{ fontSize: "11px" }}>Go to Attendance</Link>
                            </div>
                          </div>

                          {/* Leave Balance */}
                          <div className="col-md-3">
                            <div className="card p-3 bg-light border-0 h-100" style={{ borderRadius: "10px" }}>
                              <span className="text-secondary small d-block">Leave Balance</span>
                              <strong className="text-dark d-block mt-1">{currentEmployee ? (currentEmployee.leaveBalance || 0) : 15} Days Available</strong>
                              <Link to="/employee/apply-leave" className="btn btn-xs btn-outline-primary mt-2 py-1 w-100 font-semibold" style={{ fontSize: "11px" }}>Apply for Leave</Link>
                            </div>
                          </div>

                          {/* Upcoming Holidays */}
                          <div className="col-md-3">
                            <div className="card p-3 bg-light border-0 h-100" style={{ borderRadius: "10px" }}>
                              <span className="text-secondary small d-block">Upcoming Holiday</span>
                              <strong className="text-dark d-block mt-1" style={{ fontSize: "12.5px" }}>Aug 15 - Independence Day</strong>
                              <Link to="/employee/my-leaves" className="btn btn-xs btn-link text-decoration-none mt-2 p-0 w-100 text-center font-semibold" style={{ fontSize: "11px" }}>View Holidays</Link>
                            </div>
                          </div>

                          {/* Recent Leave Requests */}
                          <div className="col-md-3">
                            <div className="card p-3 bg-light border-0 h-100" style={{ borderRadius: "10px" }}>
                              <span className="text-secondary small d-block">Recent Leave Request</span>
                              <strong className="text-dark d-block mt-1" style={{ fontSize: "12.5px" }}>
                                {leaves.filter(l => currentEmployee && l.employeeId === currentEmployee.id).slice(-1)[0]?.status || "No requests"}
                              </strong>
                              <Link to="/employee/my-leaves" className="btn btn-xs btn-outline-secondary mt-2 py-1 w-100 font-semibold" style={{ fontSize: "11px" }}>View Leave History</Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}

            {/* ==================== TAB 2: CEO EXECUTIVE DASHBOARD ==================== */}
            {activeTab === "ceo" && (
              <>
                {/* Row 1: Full-width Enterprise Health Analyzer */}
                <div className="row mb-4">
                  <div className="col-12">
                    <div className="card glass-panel p-4">
                      <h4 className="font-bold mb-3 text-primary d-flex align-items-center gap-2">
                        <FaBullseye /> Enterprise Health Analyzer
                      </h4>
                      <div className="row text-center mt-3">
                        <div className="col-md-4 mb-3">
                          <div className="p-3 border rounded" style={{ background: "rgba(59, 130, 246, 0.05)" }}>
                            <h6 className="text-secondary font-semibold">Business Health Score</h6>
                            <h1 className="font-bold text-primary m-0" style={{ fontSize: "52px" }}>{healthScores.overall}%</h1>
                            <p className="text-secondary m-0" style={{ fontSize: "11px" }}>Weighted Multi-factor Index</p>
                          </div>
                        </div>
                        <div className="col-md-8">
                          <div className="row">
                            <div className="col-6 col-md-3 mb-2">
                              <div className="p-2 border rounded">
                                <span style={{ fontSize: "12px" }} className="text-secondary">Finance Health</span>
                                <h4 className="m-0 font-bold text-success">{healthScores.finance}%</h4>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                              <div className="p-2 border rounded">
                                <span style={{ fontSize: "12px" }} className="text-secondary">HR Staffing</span>
                                <h4 className="m-0 font-bold text-primary">{healthScores.hr}%</h4>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                              <div className="p-2 border rounded">
                                <span style={{ fontSize: "12px" }} className="text-secondary">Stock Index</span>
                                <h4 className="m-0 font-bold text-warning">{healthScores.inventory}%</h4>
                              </div>
                            </div>
                            <div className="col-6 col-md-3 mb-2">
                              <div className="p-2 border rounded">
                                <span style={{ fontSize: "12px" }} className="text-secondary">Sales Performance</span>
                                <h4 className="m-0 font-bold text-danger">{healthScores.sales}%</h4>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Row 2: Grid column layout beneath the Health Analyzer */}
                <div className="row">
                  {/* Left Column: Business Simulator & AI Risk Analyzer */}
                  <div className="col-lg-8">
                    {/* What-If Simulation Engine */}
                    <div className="card glass-panel p-4 mb-4">
                      <h4 className="font-bold mb-3 text-success d-flex align-items-center gap-2">
                        <FaChartLine /> Business Simulator (What-If Analysis)
                      </h4>
                      <div className="row mt-2">
                        <div className="col-md-4 mb-3">
                          <label className="form-label" style={{ fontSize: "13px" }}>Product Prices: {simParams.priceChangePct >= 0 ? "+" : ""}{simParams.priceChangePct}%</label>
                          <input 
                            type="range" className="form-range" min="-25" max="25" step="1" 
                            value={simParams.priceChangePct} 
                            onChange={(e) => setSimParams({...simParams, priceChangePct: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label" style={{ fontSize: "13px" }}>Overhead Expenses: {simParams.expenseChangePct >= 0 ? "+" : ""}{simParams.expenseChangePct}%</label>
                          <input 
                            type="range" className="form-range" min="-25" max="25" step="1" 
                            value={simParams.expenseChangePct} 
                            onChange={(e) => setSimParams({...simParams, expenseChangePct: parseInt(e.target.value)})}
                          />
                        </div>
                        <div className="col-md-4 mb-3">
                          <label className="form-label" style={{ fontSize: "13px" }}>Workforce Size: {simParams.workforceChangePct >= 0 ? "+" : ""}{simParams.workforceChangePct}%</label>
                          <input 
                            type="range" className="form-range" min="-25" max="25" step="1" 
                            value={simParams.workforceChangePct} 
                            onChange={(e) => setSimParams({...simParams, workforceChangePct: parseInt(e.target.value)})}
                          />
                        </div>
                      </div>
                      <button className="btn btn-success d-flex align-items-center gap-2 mt-2" onClick={handleSimulate}>
                        <FaPlay size={12} /> Run Predictive Simulation
                      </button>

                      {simulation && (
                        <div className="mt-4 p-3 rounded border" style={{ background: "rgba(16, 185, 129, 0.04)" }}>
                          <h6 className="font-bold text-success mb-3">Simulation Results</h6>
                          <div className="row text-center">
                            <div className="col-md-4 mb-2">
                              <div className="p-2 border bg-white rounded">
                                <span className="text-secondary" style={{ fontSize: "12px" }}>Simulated Income</span>
                                <h5 className="m-0 font-bold text-primary">₹{Math.round(simulation.simulatedIncome || 0).toLocaleString()}</h5>
                              </div>
                            </div>
                            <div className="col-md-4 mb-2">
                              <div className="p-2 border bg-white rounded">
                                <span className="text-secondary" style={{ fontSize: "12px" }}>Simulated Expense</span>
                                <h5 className="m-0 font-bold text-danger">₹{Math.round(simulation.simulatedExpense || 0).toLocaleString()}</h5>
                              </div>
                            </div>
                            <div className="col-md-4 mb-2">
                              <div className="p-2 border bg-white rounded">
                                <span className="text-secondary" style={{ fontSize: "12px" }}>Simulated Net Profit</span>
                                <h5 className="m-0 font-bold text-success">₹{Math.round(simulation.simulatedProfit || 0).toLocaleString()}</h5>
                              </div>
                            </div>
                          </div>
                          <div className="mt-2 text-center">
                            <span className="badge bg-success px-3 py-2">Predicted Health Index: {Math.round(simulation.healthScore)}%</span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* AI Risk Analyzer */}
                    <div className="card glass-panel p-4 mb-4">
                      <h4 className="font-bold mb-3 text-danger d-flex align-items-center gap-2">
                        <FaShieldAlt /> AI Operational Risk Analyzer
                      </h4>
                      <div className="d-flex flex-column gap-2 mt-2">
                        {aiRisks.map((risk, index) => (
                          <div key={index} className="d-flex gap-3 align-items-center p-3 rounded" style={{
                            background: risk.level === "CRITICAL" ? "rgba(239, 68, 68, 0.08)" : risk.level === "HIGH" ? "rgba(249, 115, 22, 0.08)" : "rgba(59, 130, 246, 0.08)",
                            border: risk.level === "CRITICAL" ? "1px solid rgba(239, 68, 68, 0.2)" : "1px solid rgba(59, 130, 246, 0.2)"
                          }}>
                            <span className={`badge px-2 py-1 ${risk.level === "CRITICAL" ? "bg-danger text-white" : risk.level === "HIGH" ? "bg-warning text-white" : "bg-primary text-white"}`}>{risk.level}</span>
                            <div>
                              <strong className="text-primary">{risk.category} Sector:</strong>
                              <p className="m-0 text-secondary" style={{ fontSize: "13px" }}>{risk.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Column: Department Leaderboard & Smart Anomalies */}
                  <div className="col-lg-4">
                    {/* Department Gamification Leaderboard */}
                    <div className="card glass-panel p-4 mb-4">
                      <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                        <FaListOl className="text-warning" /> Department Performance
                      </h5>
                      <div className="d-flex flex-column gap-3 mt-2">
                        {leaderboard.map((item, index) => (
                          <div key={index} className="d-flex justify-content-between align-items-center p-2 border-bottom">
                            <div className="d-flex align-items-center gap-2">
                              <span className="font-bold text-secondary">#{index + 1}</span>
                              <span style={{ fontSize: "13.5px" }} className="font-semibold">{item.department}</span>
                            </div>
                            <div className="text-end">
                              <span className="badge bg-primary">{item.score} pts</span>
                              <div className="text-secondary" style={{ fontSize: "11px" }}>{item.metric}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Smart Anomaly Alerts */}
                    <div className="card glass-panel p-4 mb-4">
                      <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                        <FaExclamationTriangle className="text-warning" /> Cognitive Anomalies
                      </h5>
                      <div className="d-flex flex-column gap-2 mt-2">
                        {smartAlerts.map((alert, idx) => (
                          <div key={idx} className="alert alert-warning m-0 p-2 d-flex align-items-center gap-2" style={{ fontSize: "12.5px" }}>
                            <FaExclamationTriangle className="text-warning flex-shrink-0" />
                            <span>{alert}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ==================== TAB 3: DIGITAL TWIN DASHBOARD ==================== */}
            {activeTab === "twin" && (
              <div className="row">
                {/* Warehouse Rack Space */}
                <div className="col-lg-8 mb-4">
                  <div className="card glass-panel p-4 h-100">
                    <h4 className="font-bold mb-4 text-primary d-flex align-items-center gap-2">
                      <FaBoxOpen /> Warehouse Rack Space (Digital Twin)
                    </h4>
                    <p className="text-secondary" style={{ fontSize: "13.5px" }}>Virtualized layout of real-time inventory levels mapping from database stock quantity:</p>
                    
                    {/* Visual rack simulator */}
                    <div className="border rounded p-4 text-center mt-3" style={{ background: "rgba(0,0,0,0.02)" }}>
                      <div className="row row-cols-3 g-3">
                        <div className="col">
                          <div className="p-3 border rounded bg-white">
                            <span style={{ fontSize: "12px" }}>Aisle A - Laptops</span>
                            <h6 className="font-bold text-success mt-2">{dashboard.products > 0 ? "87% Capacity" : "Empty"}</h6>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                              <div className="progress-bar bg-success" style={{ width: "87%" }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="col">
                          <div className="p-3 border rounded bg-white">
                            <span style={{ fontSize: "12px" }}>Aisle B - Keyboards</span>
                            <h6 className="font-bold text-warning mt-2">{dashboard.products > 0 ? "43% Capacity" : "Empty"}</h6>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                              <div className="progress-bar bg-warning" style={{ width: "43%" }}></div>
                            </div>
                          </div>
                        </div>
                        <div className="col">
                          <div className="p-3 border rounded bg-white">
                            <span style={{ fontSize: "12px" }}>Aisle C - Accessories</span>
                            <h6 className="font-bold text-danger mt-2">{dashboard.products > 0 ? "9% Capacity" : "Empty"}</h6>
                            <div className="progress mt-2" style={{ height: "6px" }}>
                              <div className="progress-bar bg-danger" style={{ width: "9%" }}></div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Emergency Purchase Action Trigger */}
                    <div className="mt-4 p-3 border rounded bg-light">
                      <h6 className="font-bold text-primary">Emergency Purchase Automation</h6>
                      <p className="text-secondary" style={{ fontSize: "12.5px" }}>If stock quantity drops below safety minimums, trigger emergency ordering to suppliers via automated email alert.</p>
                      <button className="btn btn-sm btn-warning d-flex align-items-center gap-2" onClick={handleTriggerEmergencyPurchases}>
                        <FaBoxOpen size={13} /> Auto-Replenish Low Stocks (Emergency PO)
                      </button>

                      {emergencyPurchasesLog.length > 0 && (
                        <div className="mt-3 p-2 border rounded bg-white" style={{ fontSize: "12.5px" }}>
                          <strong className="text-success">Emergency replenishment completed successfully:</strong>
                          <ul className="ps-3 m-0 mt-1 text-secondary">
                            {emergencyPurchasesLog.map((log, i) => (
                              <li key={i}>{log.productName}: Restocked 50 units. Supplier notification sent.</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right column: Carbon Analytics & Predictive Maintenance */}
                <div className="col-lg-4">
                  {/* Carbon Footprint */}
                  <div className="card glass-panel p-4 mb-4">
                    <h5 className="font-bold mb-3 text-success d-flex align-items-center gap-2">
                      <FaLeaf /> Carbon Footprint Analytics
                    </h5>
                    {carbon ? (
                      <div className="mt-2">
                        <p className="text-secondary" style={{ fontSize: "13px" }}>Estimated emissions calculated based on operational production cycles:</p>
                        <h3 className="font-bold text-success mb-1">{carbon.carbonEmissionsKg.toFixed(1)} Kg CO2</h3>
                        <p className="text-secondary" style={{ fontSize: "12px" }}>Offset target: <strong>{carbon.offsetTargetKg.toFixed(1)} Kg</strong></p>
                        <div className="d-flex justify-content-between align-items-center border-top pt-2">
                          <span className="text-secondary" style={{ fontSize: "13px" }}>Green efficiency rating</span>
                          <span className="badge bg-success px-2 py-1">{carbon.greenRating}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center text-secondary py-3">Calculating emissions index...</div>
                    )}
                  </div>

                  {/* Predictive Maintenance */}
                  <div className="card glass-panel p-4 mb-4">
                    <h5 className="font-bold mb-3 text-warning d-flex align-items-center gap-2">
                      <FaWrench /> Predictive Maintenance
                    </h5>
                    <div className="d-flex flex-column gap-3 mt-2">
                      {maintenance.map((m, idx) => (
                        <div key={idx} className="p-2 border rounded bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-1">
                            <strong style={{ fontSize: "13px" }}>{m.machineName}</strong>
                            <span style={{ fontSize: "12px" }} className={m.wearPct > 60 ? "text-danger" : "text-success"}>{m.wearPct.toFixed(1)}% Wear</span>
                          </div>
                          <div className="progress" style={{ height: "4px" }}>
                            <div className={`progress-bar ${m.wearPct > 60 ? "bg-danger" : "bg-warning"}`} style={{ width: `${m.wearPct}%` }}></div>
                          </div>
                          <span style={{ fontSize: "11px" }} className="text-secondary mt-1 d-block">Est. Service Date: {m.nextMaintenanceDate}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Factory Line State */}
                  <div className="card glass-panel p-4 mb-4">
                    <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                      <FaIndustry /> Production Assembly Line State
                    </h5>
                    <div className="d-flex align-items-center gap-3 p-3 border rounded bg-light mt-2">
                      <span className={`rounded-circle d-inline-block`} style={{ width: "16px", height: "16px", background: dashboard.productionCount > 0 ? "#10b981" : "#6b7280" }}></span>
                      <div>
                        <h6 className="m-0 font-bold">{dashboard.productionCount > 0 ? "LINE ACTIVE" : "LINE IDLE"}</h6>
                        <p className="m-0 text-secondary" style={{ fontSize: "12px" }}>{dashboard.productionCount} Active production order(s) processed currently.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
}

export default Dashboard;
