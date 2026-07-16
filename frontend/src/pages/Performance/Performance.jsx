import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaSearch, FaFilter, FaSortAmountDown, FaSortAmountUp, FaUserShield, FaSync } from "react-icons/fa";

function Performance() {
  const [performanceList, setPerformanceList] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [monthFilter, setMonthFilter] = useState("ALL");
  const [deptFilter, setDeptFilter] = useState("ALL");
  const [sortByScore, setSortByScore] = useState("DESC"); // "DESC" | "ASC" | "NONE"

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const loadPerformance = async () => {
    try {
      const response = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/performance", getConfig());
      setPerformanceList(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    loadPerformance();
    // Auto-refresh for live synchronization
    const interval = setInterval(() => {
      loadPerformance();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const getBadgeColor = (rating) => {
    if (!rating) return "secondary";
    const r = rating.toUpperCase();
    if (r === "EXCELLENT") return "success";
    if (r === "GOOD") return "primary";
    if (r === "AVERAGE") return "warning text-dark";
    return "danger";
  };

  // Extract unique departments & months for dropdown filters
  const departments = ["ALL", ...new Set(performanceList.map(p => p.department).filter(Boolean))];
  const months = ["ALL", ...new Set(performanceList.map(p => p.monthName).filter(Boolean))];

  // Process filters and search
  let filteredList = performanceList.filter(item => {
    // 1. Employee role filtering
    const userRole = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
    const userNm = localStorage.getItem("username") || "";
    if (userRole === "EMPLOYEE") {
      return (item.employeeName || "").toLowerCase() === userNm.toLowerCase();
    }
    return true;
  }).filter(item => {
    // 2. Search query
    const matchSearch = (item.employeeName || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                        (item.employeeId || "").toString().includes(searchTerm);
    // 3. Month Filter
    const matchMonth = monthFilter === "ALL" || item.monthName === monthFilter;
    // 4. Department Filter
    const matchDept = deptFilter === "ALL" || item.department === deptFilter;

    return matchSearch && matchMonth && matchDept;
  });

  // Sort by score
  if (sortByScore === "ASC") {
    filteredList.sort((a, b) => (a.score || 0) - (b.score || 0));
  } else if (sortByScore === "DESC") {
    filteredList.sort((a, b) => (b.score || 0) - (a.score || 0));
  }

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return dateStr.split("T")[0];
      return date.toLocaleString("en-IN", { hour12: true, month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
    } catch (e) {
      return dateStr;
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        
        {/* Title Header */}
        <div className="mb-4">
          <h3 className="mb-1 text-primary font-bold">
            <FaUserShield /> Employee Performance Dashboard
          </h3>
          <p className="text-secondary mb-0">
            Real-time scorecards, quota achievements, and executive reviews.
          </p>
        </div>

        {/* Filter Toolbar Card */}
        <div className="card shadow-sm p-3 mb-4 bg-white border-0">
          <div className="row g-2 align-items-center">
            
            {/* Search Bar */}
            <div className="col-lg-4 col-md-6">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaSearch className="text-secondary" />
                </span>
                <input
                  type="text"
                  className="form-control bg-light border-start-0 ps-0"
                  placeholder="Search executive name or ID..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Department Filter */}
            <div className="col-lg-2 col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaFilter className="text-secondary" style={{ fontSize: "11px" }} />
                </span>
                <select
                  className="form-select bg-light border-start-0 ps-0"
                  value={deptFilter}
                  onChange={e => setDeptFilter(e.target.value)}
                  style={{ fontSize: "13px" }}
                >
                  <option disabled value="">Dept</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d === "ALL" ? "All Depts" : d}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Month Filter */}
            <div className="col-lg-2 col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-light border-end-0">
                  <FaFilter className="text-secondary" style={{ fontSize: "11px" }} />
                </span>
                <select
                  className="form-select bg-light border-start-0 ps-0"
                  value={monthFilter}
                  onChange={e => setMonthFilter(e.target.value)}
                  style={{ fontSize: "13px" }}
                >
                  <option disabled value="">Month</option>
                  {months.map(m => (
                    <option key={m} value={m}>{m === "ALL" ? "All Months" : m}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Sort Toggle */}
            <div className="col-lg-3 col-md-6">
              <div className="btn-group w-100" role="group">
                <button
                  type="button"
                  className={`btn btn-sm ${sortByScore === "DESC" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setSortByScore("DESC")}
                  style={{ fontSize: "12px" }}
                >
                  <FaSortAmountDown /> High Score First
                </button>
                <button
                  type="button"
                  className={`btn btn-sm ${sortByScore === "ASC" ? "btn-primary" : "btn-outline-primary"}`}
                  onClick={() => setSortByScore("ASC")}
                  style={{ fontSize: "12px" }}
                >
                  <FaSortAmountUp /> Low Score First
                </button>
              </div>
            </div>

            {/* Refresh Button */}
            <div className="col-lg-1 col-md-6 text-end">
              <button className="btn btn-outline-secondary w-100 py-1.5" onClick={loadPerformance} title="Force Sync Now">
                <FaSync className="animate-spin-slow" />
              </button>
            </div>

          </div>
        </div>

        {/* Performance Scores Directory Table */}
        <div className="card shadow-sm p-4 bg-white border-0">
          <div className="table-responsive">
            <table className="table table-modern align-middle" style={{ fontSize: "13.5px" }}>
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Employee Name</th>
                  <th>Department</th>
                  <th>Month</th>
                  <th className="text-center">Target (Units)</th>
                  <th className="text-center">Achieved (Units)</th>
                  <th className="text-center">Achievement %</th>
                  <th className="text-center">Performance Score</th>
                  <th>Rating Badge</th>
                  <th>Last Updated</th>
                </tr>
              </thead>
              <tbody>
                {filteredList.length > 0 ? (
                  filteredList.map(item => (
                    <tr key={item.id}>
                      <td><code>#EMP-{item.employeeId}</code></td>
                      <td><strong>{item.employeeName}</strong></td>
                      <td><span className="badge bg-light text-dark border">{item.department || "Sales"}</span></td>
                      <td>{item.monthName}</td>
                      <td className="text-center font-semibold text-secondary">{item.targetQuantity || 0}</td>
                      <td className="text-center font-semibold text-primary">{item.achievedQuantity || 0}</td>
                      <td className="text-center">
                        <div className="d-flex align-items-center justify-content-center gap-2">
                          <span className="font-bold text-dark">{Math.round(item.achievementPercentage || 0)}%</span>
                          <div className="progress" style={{ width: "60px", height: "5px" }}>
                            <div 
                              className={`progress-bar bg-${getBadgeColor(item.rating)}`} 
                              style={{ width: `${item.achievementPercentage > 100 ? 100 : (item.achievementPercentage || 0)}%` }}
                            ></div>
                          </div>
                        </div>
                      </td>
                      <td className="text-center">
                        <span className="h6 mb-0 font-bold text-dark">{item.score || 0} pts</span>
                      </td>
                      <td>
                        <span className={`badge bg-${getBadgeColor(item.rating)} px-3 py-1 font-semibold`} style={{ fontSize: "11px" }}>
                          {item.rating || "POOR"}
                        </span>
                      </td>
                      <td className="text-secondary" style={{ fontSize: "12px" }}>
                        {formatDateTime(item.lastUpdated)}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-secondary py-4">No performance metrics recorded for this selection.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </MainLayout>
  );
}

export default Performance;
