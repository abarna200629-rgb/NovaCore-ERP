import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import axios from "axios";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Home from "./pages/Home";
import Employees from "./pages/HR/Employees";
import Products from "./pages/Inventory/Products";
import Production from "./pages/Production";
import Customers from "./pages/Customers";
import Sales from "./pages/Sales/Sales";
import CRM from "./pages/Sales/CRM";
import DocumentScanner from "./pages/DocumentScanner";
import Finance from "./pages/Finance/Finance";
import ProtectedRoute from "./components/ProtectedRoute";
import Users from "./pages/Users";
import Attendance from "./pages/HR/Attendance";
import Reports from "./pages/Reports/Reports";
import PurchaseSuggestions from "./pages/Inventory/PurchaseSuggestions";
import SalesAnalytics from "./pages/Sales/SalesAnalytics";
import AuditLogs from "./pages/AuditLogs";
import "./styles/erp.css";
import Payroll from "./pages/HR/Payroll";
import Recruitment from "./pages/HR/Recruitment";
import AIHub from "./pages/AIHub";
import HRBurnoutDashboard from "./pages/HR/HRBurnoutDashboard";
import Unauthorized from "./pages/Unauthorized";

import Revenue from "./pages/Finance/Revenue";
import Expenses from "./pages/Finance/Expenses";
import ProfitLoss from "./pages/Finance/ProfitLoss";
import Invoices from "./pages/Finance/Invoices";
import TaxReports from "./pages/Finance/TaxReports";
import CreditRiskDashboard from "./pages/Finance/CreditRiskDashboard";

import StockManagement from "./pages/Inventory/StockManagement";
import Suppliers from "./pages/Inventory/Suppliers";
import PurchaseOrders from "./pages/Inventory/PurchaseOrders";
import LowStockAlerts from "./pages/Inventory/LowStockAlerts";
import StockIn from "./pages/Inventory/StockIn";
import StockOut from "./pages/Inventory/StockOut";
import Categories from "./pages/Inventory/Categories";
import HolidayCalendar from "./pages/HR/HolidayCalendar";
import Leave from "./pages/HR/Leave";
import SyncAudit from "./pages/HR/SyncAudit";
import SalesTarget from "./pages/Sales/SalesTarget";
import TaskManagement from "./pages/Tasks/TaskManagement";
import Performance from "./pages/Performance/Performance";
import Settings from "./pages/Settings";
import ChangePassword from "./pages/ChangePassword";
import CloudCommandCenter from "./pages/CloudCommandCenter";

// Configure global interceptor on default axios instance
axios.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token.trim()}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Configure global response interceptor for default axios instance
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const status = error.response.status;
      console.error("AXIOS RESPONSE INTERCEPTOR ERROR:", status, "URL:", error.config?.url, "BODY:", error.response?.data);
      if (status === 401) {
        localStorage.clear();
        if (window.location.pathname !== "/") {
          window.location.href = "/?expired=true";
        }
      } else if (status === 403) {
        if (window.location.pathname !== "/unauthorized") {
          window.location.href = "/unauthorized";
        }
      }
    }
    return Promise.reject(error);
  }
);
function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/"
          element={<Login />}
        />
        <Route
          path="/change-password"
          element={<ChangePassword />}
        />
        <Route
          path="/home"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR",
                "FINANCE",
                "INVENTORY",
                "SALES",
                "PRODUCTION",
                "EMPLOYEE"
              ]}
            >
              <Home />
            </ProtectedRoute>
          }
        />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR", "EMPLOYEE", "SALES", "FINANCE", "INVENTORY", "PRODUCTION", "MANAGER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "INVENTORY", "FINANCE", "SALES", "PRODUCTION", "HR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/profile"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "INVENTORY", "FINANCE", "SALES", "PRODUCTION", "HR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/attendance"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "INVENTORY", "FINANCE", "SALES", "PRODUCTION", "HR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/apply-leave"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "INVENTORY", "FINANCE", "SALES", "PRODUCTION", "HR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/my-leaves"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "EMPLOYEE", "INVENTORY", "FINANCE", "SALES", "PRODUCTION", "HR"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/sales-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "SALES"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/finance-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "FINANCE"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/inventory-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "INVENTORY"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "PRODUCTION"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/manager-dashboard"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "MANAGER"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/ai-hub"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR",
                "FINANCE",
                "INVENTORY",
                "SALES",
                "PRODUCTION",
                "EMPLOYEE"
              ]}
            >
              <AIHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR"
              ]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employees/add"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR"
              ]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee/add"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR"
              ]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/employee-management"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR"
              ]}
            >
              <Employees />
            </ProtectedRoute>
          }
        />
        <Route
          path="/products"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "INVENTORY"
              ]}
            >
              <Products />
            </ProtectedRoute>
          }
        />
        <Route
          path="/production"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "INVENTORY",
                "PRODUCTION"
              ]}
            >
              <Production />
            </ProtectedRoute>
          }
        />
        <Route
          path="/raw-materials"
          element={<Navigate to="/production" replace />}
        />
        <Route
          path="/finished-goods"
          element={<Navigate to="/products" replace />}
        />
        <Route
          path="/production-analytics"
          element={<Navigate to="/production" replace />}
        />
        <Route
          path="/customers"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "SALES"
              ]}
            >
              <Customers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/sales"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "SALES"
              ]}
            >
              <Sales />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crm"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "SALES"
              ]}
            >
              <CRM />
            </ProtectedRoute>
          }
        />

        <Route
          path="/document-scanner"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "HR",
                "FINANCE",
                "INVENTORY",
                "SALES",
                "PRODUCTION",
                "EMPLOYEE"
              ]}
            >
              <DocumentScanner />
            </ProtectedRoute>
          }
        />

        <Route
          path="/finance"
          element={
            <ProtectedRoute
              allowedRoles={[
                "ADMIN",
                "FINANCE"
              ]}
            >
              <Finance />
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Users />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <Settings />
            </ProtectedRoute>
          }
        />
        <Route
          path="/cloud-command-center"
          element={
            <ProtectedRoute allowedRoles={["ADMIN"]}>
              <CloudCommandCenter />
            </ProtectedRoute>
          }
        />

<Route
path="/attendance"
element={
<ProtectedRoute
allowedRoles={[
"ADMIN",
"HR",
"EMPLOYEE"
]}
> <Attendance /> </ProtectedRoute>
}
/>

<Route
path="/reports"
element={
<ProtectedRoute
allowedRoles={["ADMIN", "HR", "FINANCE", "INVENTORY", "SALES", "PRODUCTION"]}
> <Reports /> </ProtectedRoute>
}
/>
<Route
    path="/purchase-suggestions"
    element={
        <ProtectedRoute
            allowedRoles={[
                "ADMIN",
                "INVENTORY"
            ]}
        >
            <PurchaseSuggestions />
        </ProtectedRoute>
    }
/>
<Route
path="/sales-analytics"
element={
<ProtectedRoute
allowedRoles={["ADMIN", "SALES"]}
>
<SalesAnalytics />
</ProtectedRoute>
}
/>
<Route
    path="/audit-logs"
    element={
        <ProtectedRoute
            allowedRoles={["ADMIN"]}
        >
            <AuditLogs />
        </ProtectedRoute>
    }
/>
<Route
 path="/payroll"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","HR","EMPLOYEE"]}>
   <Payroll />
  </ProtectedRoute>
 }
/>

<Route
 path="/recruitment"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","HR"]}>
   <Recruitment />
  </ProtectedRoute>
 }
/>

<Route
 path="/performance"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","HR","EMPLOYEE","SALES"]}>
   <Performance />
  </ProtectedRoute>
 }
/>

<Route
 path="/revenue"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","FINANCE"]}>
   <Revenue />
  </ProtectedRoute>
 }
/>

<Route
 path="/expenses"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","FINANCE"]}>
   <Expenses />
  </ProtectedRoute>
 }
/>

<Route
 path="/profit-loss"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","FINANCE"]}>
   <ProfitLoss />
  </ProtectedRoute>
 }
/>

<Route
 path="/invoices"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","FINANCE"]}>
   <Invoices />
  </ProtectedRoute>
 }
/>

<Route
 path="/tax-reports"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","FINANCE"]}>
   <TaxReports />
  </ProtectedRoute>
 }
/>

<Route
 path="/stock-management"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <StockManagement />
  </ProtectedRoute>
 }
/>

<Route
 path="/suppliers"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <Suppliers />
  </ProtectedRoute>
 }
/>

<Route
 path="/purchase-orders"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <PurchaseOrders />
  </ProtectedRoute>
 }
/>

<Route
 path="/low-stock-alerts"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <LowStockAlerts />
  </ProtectedRoute>
 }
/>

<Route
 path="/stock-in"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <StockIn />
  </ProtectedRoute>
 }
/>

<Route
 path="/stock-out"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <StockOut />
  </ProtectedRoute>
 }
/>

<Route
 path="/categories"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","INVENTORY"]}>
   <Categories />
  </ProtectedRoute>
 }
/>

<Route
 path="/employee/holiday-calendar"
 element={
  <ProtectedRoute allowedRoles={["ADMIN","HR","EMPLOYEE","SALES","FINANCE","INVENTORY","PRODUCTION","MANAGER"]}>
   <HolidayCalendar />
  </ProtectedRoute>
 }
/>
<Route
 path="/leave"
 element={
   <ProtectedRoute
     allowedRoles={["ADMIN","HR","EMPLOYEE"]}
   >
     <Leave />
   </ProtectedRoute>
 }
/>
<Route
 path="/sales-target"
 element={
  <ProtectedRoute
   allowedRoles={[
    "ADMIN",
    "SALES"
   ]}
  >
   <SalesTarget />
  </ProtectedRoute>
 }
/>
<Route
 path="/tasks"
 element={
  <ProtectedRoute
   allowedRoles={[
    "ADMIN",
    "HR",
    "SALES"
   ]}
  >
   <TaskManagement />
  </ProtectedRoute>
 }
/>

<Route
  path="/hr-burnout"
  element={
    <ProtectedRoute
      allowedRoles={[
        "ADMIN",
        "HR",
        "SALES",
        "PRODUCTION",
        "INVENTORY",
        "FINANCE",
        "EMPLOYEE"
      ]}
    >
      <HRBurnoutDashboard />
    </ProtectedRoute>
  }
/>

<Route
  path="/credit-risk"
  element={
    <ProtectedRoute
      allowedRoles={[
        "ADMIN",
        "FINANCE",
        "SALES"
      ]}
    >
      <CreditRiskDashboard />
    </ProtectedRoute>
  }
/>

        <Route
          path="/sync-audit"
          element={
            <ProtectedRoute allowedRoles={["ADMIN", "HR"]}>
              <SyncAudit />
            </ProtectedRoute>
          }
        />

        <Route
          path="/unauthorized"
          element={<Unauthorized />}
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;