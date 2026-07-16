import { useEffect, useState, useRef } from "react";
import { 
  FaBell, FaSun, FaMoon, FaSearch, FaUserCircle, 
  FaChevronDown, FaSignOutAlt, FaBars, FaTimes, FaUserAlt, FaCog
} from "react-icons/fa";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

function Navbar() {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
  const rawUsername = localStorage.getItem("username");
  const username = (rawUsername && rawUsername !== "undefined") ? rawUsername : "User";
  const employeeId = localStorage.getItem("employeeId");
  const isEmployee = role === "EMPLOYEE" || !!employeeId || (username && username.startsWith("EMP"));

  const getDashboardRoute = () => {
    if (role === "EMPLOYEE") return "/employee-dashboard";
    if (role === "ADMIN") return "/dashboard";
    if (role === "HR") return "/hr-dashboard";
    if (role === "SALES") return "/sales-dashboard";
    if (role === "FINANCE") return "/finance-dashboard";
    if (role === "INVENTORY") return "/inventory-dashboard";
    if (role === "PRODUCTION") return "/production-dashboard";
    if (role === "MANAGER") return "/manager-dashboard";
    return "/dashboard";
  };

  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  const dropdownRef = useRef(null);
  const API_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        const searchInput = document.querySelector(".search-input");
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      }
      if (e.key === "Escape") {
        setActiveDropdown(null);
        setShowNotifications(false);
        setShowProfileMenu(false);
        setMobileOpen(false);
        setShowSearchDropdown(false);
      }
    };
    window.addEventListener("keydown", handleGlobalKeyDown);
    return () => window.removeEventListener("keydown", handleGlobalKeyDown);
  }, []);

  useEffect(() => {
    const theme = localStorage.getItem("theme");
    if (theme === "dark") {
      document.body.classList.add("dark-mode");
      setDarkMode(true);
    }
    loadNotifications();
    const interval = setInterval(loadNotifications, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleTheme = () => {
    if (darkMode) {
      document.body.classList.remove("dark-mode");
      localStorage.setItem("theme", "light");
      setDarkMode(false);
    } else {
      document.body.classList.add("dark-mode");
      localStorage.setItem("theme", "dark");
      setDarkMode(true);
    }
  };

  const loadNotifications = async () => {
    try {
      const response = await axios.get(`${API_BASE}/notifications`, getConfig());
      setNotifications(response.data || []);
    } catch (err) {
      console.log("Error loading notifications:", err);
    }
  };

  const markAllRead = async () => {
    try {
      await axios.put(`${API_BASE}/notifications/mark-all-read`, {}, getConfig());
      loadNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  const markSingleRead = async (id) => {
    try {
      await axios.put(`${API_BASE}/notifications/${id}/read`, {}, getConfig());
      loadNotifications();
    } catch (err) {
      console.log(err);
    }
  };

  const handleSearchChange = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    const q = value.toLowerCase();
    let sugg = null;
    if (q.includes("order") || q.includes("today's orders") || q.includes("sales")) {
      sugg = { text: "Show today's orders", route: "/sales", label: "Navigate to Sales Orders" };
    } else if (q.includes("invoice") || q.includes("unpaid") || q.includes("revenue") || q.includes("expense")) {
      sugg = { text: "Show unpaid invoices", route: "/invoices", label: "Navigate to Invoices" };
    } else if (q.includes("customer") || q.includes("chennai")) {
      sugg = { text: "Show customers from Chennai", route: "/customers", label: "Navigate to Customer CRM" };
    } else if (q.includes("stock") || q.includes("product") || q.includes("below") || q.includes("minimum")) {
      sugg = { text: "Show products below minimum stock", route: "/products", label: "Navigate to Catalog Products" };
    } else if (q.includes("employee") || q.includes("staff") || q.includes("attendance")) {
      sugg = { text: "Show employee headcount / attendance", route: "/employees", label: "Navigate to Employee Directory" };
    }
    setAiSuggestion(sugg);

    const clientResults = [];
    if (value.trim().length > 1) {
      const depts = [
        { title: "Department: Human Resources", type: "HR", route: "/employees", details: "Manage employee directory, profiles & shifts." },
        { title: "Department: Finance & Accounts", type: "FINANCE", route: "/finance", details: "Ledger, invoices, tax filings & payroll." },
        { title: "Department: Inventory Control", type: "INVENTORY", route: "/products", details: "Product catalog, low stock alerts & suppliers." },
        { title: "Department: Sales & Billing", type: "SALES", route: "/sales", details: "Point of sale billing, orders & customer accounts." }
      ];
      depts.forEach(d => {
        if (d.title.toLowerCase().includes(q) || d.type.toLowerCase().includes(q) || d.details.toLowerCase().includes(q)) {
          clientResults.push(d);
        }
      });

      const reports = [
        { title: "Report: Attendance Analytics", type: "REPORTS", route: "/reports", details: "Employee check-in analytics & late trends." },
        { title: "Report: Leave Logs & Balance", type: "REPORTS", route: "/leave", details: "Workforce leave rate & balance logs." },
        { title: "Report: Tax Summary & GST", type: "REPORTS", route: "/tax-reports", details: "Quarterly tax reports & tax summaries." },
        { title: "Report: Profit & Loss Statement", type: "REPORTS", route: "/profit-loss", details: "Revenues vs expenses monthly summaries." },
        { title: "Report: Revenue Audit Ledger", type: "REPORTS", route: "/revenue", details: "Incoming invoice payments details." },
        { title: "Report: Expense Audit Ledger", type: "REPORTS", route: "/expenses", details: "Corporate outgoing expense logs." },
        { title: "Report: Sales Quotas & Targets", type: "REPORTS", route: "/sales-target", details: "Monthly sales executive quota achievements." }
      ];
      reports.forEach(r => {
        if (r.title.toLowerCase().includes(q) || r.details.toLowerCase().includes(q)) {
          clientResults.push(r);
        }
      });

      try {
        const response = await axios.get(`${API_BASE}/search?q=${value}`, getConfig());
        const apiResults = response.data || [];
        setSearchResults([...clientResults, ...apiResults].slice(0, 8));
        setShowSearchDropdown(true);
      } catch (err) {
        console.log(err);
      }
    } else {
      setSearchResults(null);
      setShowSearchDropdown(!!sugg);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && aiSuggestion) {
      navigate(aiSuggestion.route);
      setShowSearchDropdown(false);
    }
  };

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  const getNavLinks = () => {
    const links = [];
    const getDashboardRoute = () => {
      if (isEmployee) return "/employee-dashboard";
      if (role === "ADMIN") return "/dashboard";
      if (role === "HR") return "/hr-dashboard";
      if (role === "SALES") return "/sales-dashboard";
      if (role === "FINANCE") return "/finance-dashboard";
      if (role === "INVENTORY") return "/inventory-dashboard";
      if (role === "PRODUCTION") return "/production-dashboard";
      if (role === "MANAGER") return "/manager-dashboard";
      return "/dashboard";
    };

    links.push({ label: "Dashboard", route: getDashboardRoute() });

    if (role === "ADMIN") {
      links.push({
        label: "HR",
        isDropdown: true,
        items: [
          { label: "Employee Directory", route: "/employees", desc: "Manage profiles & directories" },
          { label: "Attendance Log", route: "/attendance", desc: "Track daily check-ins & late logs" },
          { label: "Leave Requests", route: "/leave", desc: "Approve leaves and view balances" },
          { label: "Payroll Ledger", route: "/payroll", desc: "Salary slips & payroll summaries" },
          { label: "Recruitment Pipeline", route: "/recruitment", desc: "Job vacancies & resume logs" },
          { label: "Performance Rating", route: "/performance", desc: "Employee ratings & evaluations" },
          { label: "HR Burnout Predictor", route: "/hr-burnout", desc: "AI fatigue anomaly detection" },
          { label: "Sales Quotas Config", route: "/sales-target", desc: "Assign targets and parameters" }
        ]
      });

      links.push({
        label: "Sales",
        isDropdown: true,
        items: [
          { label: "Customers CRM", route: "/customers", desc: "Client portfolios & contacts" },
          { label: "Sales Orders", route: "/sales", desc: "Sales transactions & invoices" },
          { label: "CRM Pipeline Hub", route: "/crm", desc: "Track active leads & interactions" },
          { label: "Sales Reports", route: "/sales-analytics", desc: "Sales target analysis reports" },
          { label: "Credit Risk Analyzer", route: "/credit-risk", desc: "Client credit worthiness audits" }
        ]
      });

      links.push({
        label: "Inventory",
        isDropdown: true,
        items: [
          { label: "Product Catalog", route: "/products", desc: "Finished goods and parameters" },
          { label: "Stock Management", route: "/stock-management", desc: "Manual stock register changes" },
          { label: "Low Stock Alerts", route: "/low-stock-alerts", desc: "SKU deficiency safety limits" },
          { label: "Suppliers Roster", route: "/suppliers", desc: "Vendor catalogs & ratings" },
          { label: "Purchase Orders", route: "/purchase-orders", desc: "Submit procurement requests" }
        ]
      });

      links.push({
        label: "Finance",
        isDropdown: true,
        items: [
          { label: "Revenue Ledger", route: "/revenue", desc: "Invoice payments collections" },
          { label: "Expense Ledger", route: "/expenses", desc: "Track outgoing cash flows" },
          { label: "Profit & Loss Reports", route: "/profit-loss", desc: "Monthly margins calculations" },
          { label: "Corporate Invoices", route: "/invoices", desc: "Issue client bills & invoicing details" },
          { label: "Tax & GST Filings", route: "/tax-reports", desc: "Summarize tax filings easily" }
        ]
      });

      links.push({ label: "AI Hub", route: "/ai-hub" });
      links.push({ label: "Reports", route: "/reports" });

      links.push({
        label: "Administration",
        isDropdown: true,
        items: [
          { label: "User Management", route: "/users", desc: "Manage accounts and permissions" },
          { label: "Sync Mappings Audit", route: "/sync-audit", desc: "Resolve Employee-User mismatches" },
          { label: "Security Audit Logs", route: "/audit-logs", desc: "Inspect operations logs timeline" },
          { label: "System Settings", route: "/settings", desc: "Module parameters configuration" }
        ]
      });
    } else if (role === "HR") {
      links.push({ label: "Employee", route: "/employees" });
      links.push({ label: "Leave Approval", route: "/leave" });
      links.push({ label: "Attendance", route: "/attendance" });
      links.push({ label: "Payroll", route: "/payroll" });
      links.push({ label: "Recruitment", route: "/recruitment" });
      links.push({ label: "Sync Audit", route: "/sync-audit" });
      links.push({ label: "Reports", route: "/reports" });
    } else {
      if (role === "INVENTORY") {
        links.push({
          label: "Inventory",
          isDropdown: true,
          items: [
            { label: "Product Catalog", route: "/products", desc: "Finished goods list and details" },
            { label: "Categories", route: "/categories", desc: "Manage product categories" },
            { label: "Suppliers", route: "/suppliers", desc: "Vendor details & ratings" },
            { label: "Purchase Orders", route: "/purchase-orders", desc: "Submit procurement requests" },
            { label: "Stock In", route: "/stock-in", desc: "Incoming stock management" },
            { label: "Stock Out", route: "/stock-out", desc: "Outgoing stock management" },
            { label: "Warehouse", route: "/stock-management", desc: "Warehouse slots allocation" },
            { label: "Reports", route: "/reports", desc: "System reports" }
          ]
        });
      } else if (role === "SALES") {
        links.push({ label: "Customers", route: "/customers" });
        links.push({ label: "Sales", route: "/sales" });
        links.push({ label: "Sales Target", route: "/sales-target" });
        links.push({ label: "Performance", route: "/performance" });
      } else if (role === "FINANCE") {
        links.push({
          label: "Finance",
          isDropdown: true,
          items: [
            { label: "Revenue Ledger", route: "/revenue", desc: "Invoice payments collections" },
            { label: "Expense Ledger", route: "/expenses", desc: "Track outgoing cash flows" },
            { label: "Profit & Loss Reports", route: "/profit-loss", desc: "Monthly margins calculations" },
            { label: "Corporate Invoices", route: "/invoices", desc: "Issue client bills & invoicing details" },
            { label: "Tax & GST Filings", route: "/tax-reports", desc: "Summarize tax filings easily" }
          ]
        });
        links.push({ label: "Reports", route: "/reports" });
      } else if (role === "PRODUCTION") {
        links.push({ label: "Production", route: "/production" });
        links.push({ label: "Reports", route: "/reports" });
      }

      if (isEmployee) {
        links.push({
          label: "Employee",
          isDropdown: true,
          items: [
            { label: "Attendance", route: "/employee/attendance", desc: "Daily check-in / check-out logs" },
            { label: "Apply Leave", route: "/employee/apply-leave", desc: "Submit leave request form" },
            { label: "My Leave Requests", route: "/employee/my-leaves", desc: "View leaves history" },
            { label: "Holiday Calendar", route: "/employee/holiday-calendar", desc: "View holiday roster" },
            { label: "Payslips", route: "/employee/profile?tab=payslips", desc: "Monthly salary statements" }
          ]
        });
      }
    }

    return links;
  };

  const navLinks = getNavLinks();

  return (
    <div className="navbar-modern" ref={dropdownRef}>
      {/* Logo & Hamburg Button */}
      <div className="left d-flex align-items-center gap-3">
        <button 
          className="mobile-hamburger-btn" 
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle navigation drawer"
        >
          {mobileOpen ? <FaTimes /> : <FaBars />}
        </button>
        <Link to={getDashboardRoute()} className="text-decoration-none d-flex align-items-center">
          <h4 className="m-0 text-gradient font-bold d-flex align-items-center" style={{ fontSize: "16px", height: "38px", fontWeight: "700", color: "var(--accent)", letterSpacing: "0.5px" }}>
            NovaCore ERP
          </h4>
        </Link>
      </div>

      {/* Center Horizontal Menu (Desktop) */}
      <ul className="nav-menu-list">
        {navLinks.map((link, idx) => (
          <li 
            key={idx} 
            className="nav-menu-item"
            onMouseEnter={() => link.isDropdown && setActiveDropdown(idx)}
            onMouseLeave={() => setActiveDropdown(null)}
          >
            {link.isDropdown ? (
              <>
                <button className="nav-menu-link border-0 bg-transparent">
                  {link.label} <FaChevronDown size={10} />
                </button>
                {activeDropdown === idx && (
                  <div className="mega-dropdown">
                    {link.items.map((sub, sIdx) => (
                      <Link 
                        key={sIdx} 
                        to={sub.route} 
                        className="mega-dropdown-link"
                        onClick={() => setActiveDropdown(null)}
                      >
                        <strong>{sub.label}</strong>
                        <span>{sub.desc}</span>
                      </Link>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Link to={link.route} className="nav-menu-link">
                {link.label}
              </Link>
            )}
          </li>
        ))}
      </ul>

      {/* Right Controls */}
      <div className="right navbar-controls">
        {/* Global Search Bar */}
        <div className="search-container d-none d-md-block">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Global Search... (Ctrl+K)"
            value={searchQuery}
            onChange={handleSearchChange}
            onKeyDown={handleKeyDown}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            onFocus={() => (searchQuery.trim().length > 1 || aiSuggestion) && setShowSearchDropdown(true)}
          />
          {showSearchDropdown && (searchResults || aiSuggestion) && (
            <div className="glass-panel position-absolute w-100 mt-2 p-3 shadow" style={{ top: "42px", left: 0, zIndex: 1050, maxHeight: "350px", overflowY: "auto", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "14px" }}>
              {aiSuggestion && (
                <div 
                  className="mb-3 p-3 bg-light rounded hover-lift animate-fade-in" 
                  onClick={() => { navigate(aiSuggestion.route); setShowSearchDropdown(false); }} 
                  style={{ borderLeft: "4px solid #8b5cf6", cursor: "pointer", background: "rgba(139, 92, 246, 0.03)" }}
                >
                  <span className="badge mb-2 font-bold" style={{ fontSize: "10px", background: "rgba(139, 92, 246, 0.15)", color: "#8b5cf6" }}>✨ AI Smart Search Suggestion</span>
                  <div className="font-bold text-dark">{aiSuggestion.text}</div>
                  <div className="small text-secondary">{aiSuggestion.label}</div>
                </div>
              )}
              <h6 className="text-secondary font-bold text-uppercase mb-2" style={{ fontSize: "11px" }}>Search Results</h6>
              {Array.isArray(searchResults) && searchResults.length > 0 ? (
                <div className="search-results-list">
                  {searchResults.map((item, idx) => (
                    <div 
                      key={idx} 
                      className="p-2 border-bottom hover-bg d-flex flex-column" 
                      style={{ fontSize: "12px", cursor: "pointer", transition: "background 0.2s" }}
                      onClick={() => { navigate(item.route); setShowSearchDropdown(false); }}
                    >
                      <div className="d-flex align-items-center justify-content-between">
                        <strong>{item.title}</strong>
                        <span className={`badge ${
                          item.type === "HR" ? "bg-primary" :
                          item.type === "INVENTORY" ? "bg-success" :
                          item.type === "SALES" ? "bg-info" :
                          item.type === "REPORTS" ? "bg-secondary" : "bg-warning text-dark"
                        }`} style={{ fontSize: "9px" }}>{item.type}</span>
                      </div>
                      <div className="small text-secondary mt-1">{item.details}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-secondary py-2" style={{ fontSize: "12.5px" }}>No matching records found.</div>
              )}
            </div>
          )}
        </div>

        {/* Theme Toggle */}
        <button className="nav-icon-btn" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {darkMode ? <FaSun size={22} className="text-warning" /> : <FaMoon size={22} className="text-primary" />}
        </button>

        {/* Notification Bell */}
        <button className="nav-icon-btn" onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }} title="Notifications">
          <FaBell size={22} />
          {notifications.filter(n => !n.readStatus).length > 0 && (
            <span className="badge-count" style={{ top: "2px", right: "2px" }}>{notifications.filter(n => !n.readStatus).length}</span>
          )}
        </button>

        {showNotifications && (
          <div className="notifications-dropdown glass-panel shadow-lg p-3" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "12px", width: "320px", position: "absolute", right: "20px", top: "45px", zIndex: 1050 }}>
            <div className="d-flex justify-content-between align-items-center mb-2 border-bottom pb-2">
              <h6 className="m-0 font-bold" style={{ fontSize: "13px" }}>Unread Alerts</h6>
              {notifications.filter(n => !n.readStatus).length > 0 && (
                <button className="btn btn-xs btn-link text-primary p-0 font-semibold" style={{ fontSize: "11px", textDecoration: "none" }} onClick={markAllRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div style={{ maxHeight: "280px", overflowY: "auto" }}>
              {notifications.filter(n => !n.readStatus).length > 0 ? (
                notifications.filter(n => !n.readStatus).map(n => (
                  <div key={n.id} className="notification-item p-2 mb-1 border-bottom" style={{ fontSize: "11.5px" }}>
                    <div className="d-flex justify-content-between align-items-start gap-1">
                      <span className="badge bg-secondary mb-1" style={{ fontSize: "8.5px" }}>{n.category || "ALERT"}</span>
                      <button className="btn btn-xs btn-outline-primary py-0 px-1" style={{ fontSize: "9px" }} onClick={() => markSingleRead(n.id)}>Mark</button>
                    </div>
                    <p className="m-0 text-dark font-semibold">{n.title}</p>
                    <p className="m-0 text-secondary mt-0.5">{n.message}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-secondary py-4" style={{ fontSize: "12px" }}>No alerts found.</div>
              )}
            </div>
          </div>
        )}

        {/* User Profile Dropdown */}
        <div className="position-relative">
          <div className="user-profile-menu d-flex align-items-center gap-2" style={{ cursor: "pointer" }} onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}>
            <FaUserCircle size={40} className="text-primary" />
            <div className="d-none d-lg-flex flex-column text-start" style={{ lineHeight: "1.2" }}>
              <span className="text-dark font-semibold" style={{ fontSize: "14px" }}>{username}</span>
              <span className="text-secondary" style={{ fontSize: "11px" }}>{role}</span>
            </div>
          </div>
          {showProfileMenu && (
            <div className="glass-panel position-absolute shadow-lg p-2" style={{ right: 0, top: "48px", width: "180px", background: "var(--bg-card)", border: "1px solid var(--border-card)", borderRadius: "12px", zIndex: 1050 }}>
              <Link to={isEmployee ? "/employee/profile" : getDashboardRoute()} className="dropdown-item p-2 rounded text-decoration-none d-flex align-items-center gap-2 text-secondary" style={{ fontSize: "13px" }} onClick={() => setShowProfileMenu(false)}>
                <FaUserAlt size={12} /> My Profile
              </Link>
              {role === "ADMIN" && (
                <Link to="/settings" className="dropdown-item p-2 rounded text-decoration-none d-flex align-items-center gap-2 text-secondary" style={{ fontSize: "13px" }} onClick={() => setShowProfileMenu(false)}>
                  <FaCog size={12} /> Settings
                </Link>
              )}
              <hr className="my-1" />
              <button className="dropdown-item w-100 text-start p-2 rounded border-0 bg-transparent text-danger d-flex align-items-center gap-2" style={{ fontSize: "13px" }} onClick={logout}>
                <FaSignOutAlt size={12} /> Logout
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Drawer (Visible on Small Screens) */}
      {mobileOpen && (
        <div className="mobile-drawer open">
          <h5 className="font-bold mb-3 border-bottom pb-2">Menu Directory</h5>
          <div className="d-flex flex-column gap-3">
            {navLinks.map((link, idx) => (
              <div key={idx} className="border-bottom pb-2">
                {link.isDropdown ? (
                  <>
                    <strong className="text-secondary small uppercase tracking-wider d-block mb-1">{link.label}</strong>
                    <div className="d-flex flex-column gap-1 ps-2">
                      {link.items.map((sub, sIdx) => (
                        <Link 
                          key={sIdx} 
                          to={sub.route} 
                          className="text-decoration-none text-dark py-1"
                          style={{ fontSize: "13.5px" }}
                          onClick={() => setMobileOpen(false)}
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  </>
                ) : (
                  <Link 
                    to={link.route} 
                    className="text-decoration-none text-dark font-semibold d-block" 
                    style={{ fontSize: "14px" }}
                    onClick={() => setMobileOpen(false)}
                  >
                    {link.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Navbar;