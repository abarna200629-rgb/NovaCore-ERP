import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaTachometerAlt,
  FaUsers,
  FaUserCheck,
  FaMoneyBillWave,
  FaBoxOpen,
  FaIndustry,
  FaChartBar,
  FaChevronDown,
  FaChevronRight,
  FaSignOutAlt,
  FaBrain,
  FaBuilding,
  FaUser,
  FaCalendarMinus,
  FaCalendarCheck
} from "react-icons/fa";

function Sidebar() {
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.trim().toUpperCase().replace("ROLE_", "") : "";
  const username = localStorage.getItem("username");
  const employeeId = localStorage.getItem("employeeId");
  const isEmployee = role === "EMPLOYEE" || !!employeeId || (username && username.startsWith("EMP"));
  const navigate = useNavigate();

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

  const [hrOpen, setHrOpen] = useState(false);
  const [departmentsOpen, setDepartmentsOpen] = useState(false);
  const [financeOpen, setFinanceOpen] = useState(false);
  const [inventoryOpen, setInventoryOpen] = useState(false);
  const [productionOpen, setProductionOpen] = useState(false);
  const [salesOpen, setSalesOpen] = useState(false);
  const [adminOpen, setAdminOpen] = useState(false);
  const [employeeOpen, setEmployeeOpen] = useState(false);

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="sidebar">
      <div className="logo-section">
        <h2>NovaCore</h2>
        <p>AI-Powered Suite</p>
      </div>

      <ul>
        <li>
          <Link to={getDashboardRoute()}>
            <FaTachometerAlt /> Dashboard
          </Link>
        </li>



        {!isEmployee && (
          <li>
            <Link to="/ai-hub">
              <FaBrain /> AI Cognitive Hub
            </Link>
          </li>
        )}

        {/* HR */}
        {(role === "ADMIN" || role === "HR") && (
          <>
            <li className="menu-title" onClick={() => setHrOpen(!hrOpen)}>
              <span>
                <FaUsers /> HR Management
              </span>
              {hrOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>

            {hrOpen && (
              <div className="submenu">
                {(role === "ADMIN" || role === "HR") && (
                  <Link to="/employees">Employee Management</Link>
                )}
                <Link to="/attendance">Attendance</Link>
                <Link to="/leave">Leave Management</Link>
                <Link to="/payroll">Payroll</Link>
                {(role === "ADMIN" || role === "HR") && (
                  <Link to="/recruitment">Recruitment</Link>
                )}
                <Link to="/performance">Performance Evaluation</Link>
                {(role === "ADMIN" || role === "HR") && (
                  <Link to="/sales-target">Sales Targets</Link>
                )}
              </div>
            )}
          </>
        )}

        {role === "ADMIN" && (
          <>
            <li className="menu-title" onClick={() => setDepartmentsOpen(!departmentsOpen)}>
              <span>
                <FaBuilding /> Departments
              </span>
              {departmentsOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>

            {departmentsOpen && (
              <div className="submenu" style={{ marginLeft: "15px" }}>
                {/* FINANCE */}
                <div
                  className="menu-title"
                  style={{
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    textTransform: "none",
                    letterSpacing: "0.2px",
                    fontWeight: "500",
                    color: "#cbd5e1"
                  }}
                  onClick={() => setFinanceOpen(!financeOpen)}
                >
                  <span>
                    <FaMoneyBillWave style={{ marginRight: "10px" }} /> Finance
                  </span>
                  {financeOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                </div>

                {financeOpen && (
                  <div className="submenu" style={{ marginLeft: "20px" }}>
                    <Link to="/revenue">Revenue</Link>
                    <Link to="/expenses">Expenses</Link>
                    <Link to="/profit-loss">Profit & Loss</Link>
                    <Link to="/invoices">Invoices</Link>
                    <Link to="/tax-reports">Tax Reports</Link>
                  </div>
                )}

                {/* INVENTORY */}
                <div
                  className="menu-title"
                  style={{
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    textTransform: "none",
                    letterSpacing: "0.2px",
                    fontWeight: "500",
                    color: "#cbd5e1"
                  }}
                  onClick={() => setInventoryOpen(!inventoryOpen)}
                >
                  <span>
                    <FaBoxOpen style={{ marginRight: "10px" }} /> Inventory
                  </span>
                  {inventoryOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                </div>

                {inventoryOpen && (
                  <div className="submenu" style={{ marginLeft: "20px" }}>
                    <Link to="/products">Products</Link>
                    <Link to="/stock-management">Stock Management</Link>
                    <Link to="/low-stock-alerts">Low Stock Alerts</Link>
                    <Link to="/suppliers">Suppliers</Link>
                    <Link to="/purchase-orders">Purchase Orders</Link>
                  </div>
                )}

                {/* PRODUCTION */}
                <div
                  className="menu-title"
                  style={{
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    textTransform: "none",
                    letterSpacing: "0.2px",
                    fontWeight: "500",
                    color: "#cbd5e1"
                  }}
                  onClick={() => setProductionOpen(!productionOpen)}
                >
                  <span>
                    <FaIndustry style={{ marginRight: "10px" }} /> Production
                  </span>
                  {productionOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                </div>

                {productionOpen && (
                  <div className="submenu" style={{ marginLeft: "20px" }}>
                    <Link to="/production">Production Planning</Link>
                    <Link to="/production">Raw Materials</Link>
                    <Link to="/products">Finished Goods</Link>
                    <Link to="/production">Analytics</Link>
                  </div>
                )}

                {/* SALES */}
                <div
                  className="menu-title"
                  style={{
                    padding: "10px 14px",
                    fontSize: "13.5px",
                    textTransform: "none",
                    letterSpacing: "0.2px",
                    fontWeight: "500",
                    color: "#cbd5e1"
                  }}
                  onClick={() => setSalesOpen(!salesOpen)}
                >
                  <span>
                    <FaChartBar style={{ marginRight: "10px" }} /> Sales
                  </span>
                  {salesOpen ? <FaChevronDown size={12} /> : <FaChevronRight size={12} />}
                </div>

                {salesOpen && (
                  <div className="submenu" style={{ marginLeft: "20px" }}>
                    <Link to="/customers">Customers</Link>
                    <Link to="/sales">Sales Orders</Link>
                    <Link to="/sales-analytics">Sales Reports</Link>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* FLAT MENU: FINANCE */}
        {role === "FINANCE" && (
          <>
            <li className="menu-title" onClick={() => setFinanceOpen(!financeOpen)}>
              <span>
                <FaMoneyBillWave /> Finance
              </span>
              {financeOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>
            {financeOpen && (
              <div className="submenu">
                <Link to="/revenue">Revenue</Link>
                <Link to="/expenses">Expenses</Link>
                <Link to="/profit-loss">Profit & Loss</Link>
                <Link to="/invoices">Invoices</Link>
                <Link to="/tax-reports">Tax Reports</Link>
              </div>
            )}
          </>
        )}

        {/* FLAT MENU: INVENTORY */}
        {role === "INVENTORY" && (
          <>
            <li className="menu-title" onClick={() => setInventoryOpen(!inventoryOpen)}>
              <span>
                <FaBoxOpen /> Inventory
              </span>
              {inventoryOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>
            {inventoryOpen && (
              <div className="submenu">
                <Link to="/products">Products</Link>
                <Link to="/categories">Categories</Link>
                <Link to="/suppliers">Suppliers</Link>
                <Link to="/purchase-orders">Purchase Orders</Link>
                <Link to="/stock-in">Stock In</Link>
                <Link to="/stock-out">Stock Out</Link>
                <Link to="/stock-management">Warehouse</Link>
                <Link to="/reports">Reports</Link>
              </div>
            )}
          </>
        )}

        {/* FLAT MENU: PRODUCTION */}
        {role === "PRODUCTION" && (
          <>
            <li className="menu-title" onClick={() => setProductionOpen(!productionOpen)}>
              <span>
                <FaIndustry /> Production
              </span>
              {productionOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>
            {productionOpen && (
              <div className="submenu">
                <Link to="/production">Production Planning</Link>
                <Link to="/production">Raw Materials</Link>
                <Link to="/products">Finished Goods</Link>
                <Link to="/production">Analytics</Link>
              </div>
            )}
          </>
        )}

        {/* FLAT MENU: SALES */}
        {role === "SALES" && (
          <>
            <li className="menu-title" onClick={() => setSalesOpen(!salesOpen)}>
              <span>
                <FaChartBar /> Sales
              </span>
              {salesOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>
            {salesOpen && (
              <div className="submenu">
                <Link to="/customers">Customers</Link>
                <Link to="/sales">Sales Orders</Link>
                <Link to="/sales-analytics">Sales Reports</Link>
              </div>
            )}
          </>
        )}

        {isEmployee && (
          <>
            <li className="menu-title" onClick={() => setEmployeeOpen(!employeeOpen)}>
              <span>
                <FaUser /> Employee
              </span>
              {employeeOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>
            {employeeOpen && (
              <div className="submenu">
                <Link to="/employee/attendance">Attendance</Link>
                <Link to="/employee/apply-leave">Apply Leave</Link>
                <Link to="/employee/my-leaves">My Leaves</Link>
                <Link to="/employee/holiday-calendar">Holiday Calendar</Link>
                <Link to="/employee/profile?tab=payslips">Payslips</Link>
              </div>
            )}
            <li>
              <Link to="/employee/profile">
                <FaUser /> Profile
              </Link>
            </li>
            <li>
              <Link to="/employee/my-leaves">
                <FaBell /> Notifications
              </Link>
            </li>
            <li>
              <span className="nav-link text-danger" style={{ cursor: "pointer" }} onClick={logout}>
                <FaSignOutAlt className="text-danger" /> Logout
              </span>
            </li>
          </>
        )}
        {role === "ADMIN" && (
          <>
            <li className="menu-title" onClick={() => setAdminOpen(!adminOpen)}>
              <span>
                <FaUserCheck /> Admin
              </span>
              {adminOpen ? <FaChevronDown /> : <FaChevronRight />}
            </li>

            {adminOpen && (
              <div className="submenu">
                <Link to="/users">Users</Link>
                <Link to="/audit-logs">Audit Logs</Link>
                <Link to="/settings">Settings</Link>
                <Link to="/cloud-command-center">Cloud Command Center</Link>
              </div>
            )}
          </>
        )}

        {role !== "EMPLOYEE" && (
          <li>
            <Link to="/reports">
              <FaChartBar /> Reports
            </Link>
          </li>
        )}
      </ul>

      <button className="logout-btn" onClick={logout}>
        <FaSignOutAlt /> Logout
      </button>
    </div>
  );
}

export default Sidebar;