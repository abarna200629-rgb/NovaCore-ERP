import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import axios from "axios";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { FaFilePdf, FaFileExcel, FaPrint, FaEnvelope, FaBrain, FaBuilding, FaUserTie, FaShoppingCart, FaWarehouse, FaCoins } from "react-icons/fa";

function Reports() {
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.trim().toUpperCase().replace("ROLE_", "") : "";

  const getDefaultTab = () => {
    if (role === "ADMIN") return "hr";
    if (role === "HR") return "hr";
    if (role === "FINANCE") return "finance";
    if (role === "INVENTORY") return "inventory";
    if (role === "SALES") return "sales";
    return "hr";
  };

  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);
  const [sales, setSales] = useState([]);
  const [finance, setFinance] = useState([]);
  const [production, setProduction] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payrolls, setPayrolls] = useState([]);
  const [leaves, setLeaves] = useState([]);
  
  const [dailyReport, setDailyReport] = useState("");
  const [email, setEmail] = useState("");
  const [emailStatus, setEmailStatus] = useState("");
  const [aiSummaries, setAiSummaries] = useState({});
  const [summaryLoading, setSummaryLoading] = useState({});
  const [activeTab, setActiveTab] = useState(getDefaultTab());

  const API_BASE = API_BASE_URL + "/api";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadData();
  }, [role]);

  const loadData = async () => {
    try {
      if (role === "ADMIN" || role === "HR") {
        const emp = await axios.get(`${API_BASE}/employees`, getConfig());
        setEmployees(emp.data || []);

        const att = await axios.get(`${API_BASE}/hr/attendance`, getConfig());
        setAttendance(att.data || []);

        const pay = await axios.get(`${API_BASE}/hr/payroll`, getConfig());
        setPayrolls(pay.data || []);

        const lvs = await axios.get(`${API_BASE}/hr/leaves`, getConfig());
        setLeaves(lvs.data || []);
      }

      if (role === "ADMIN" || role === "INVENTORY" || role === "SALES" || role === "FINANCE") {
        const prod = await axios.get(`${API_BASE}/inventory/products`, getConfig());
        setProducts(prod.data || []);
      }

      if (role === "ADMIN" || role === "SALES" || role === "FINANCE") {
        const sale = await axios.get(`${API_BASE}/sales/orders`, getConfig());
        setSales(sale.data || []);
      }

      if (role === "ADMIN" || role === "FINANCE") {
        const fin = await axios.get(`${API_BASE}/finance/records`, getConfig());
        setFinance(fin.data || []);
      }

      if (role === "ADMIN") {
        const pro = await axios.get(`${API_BASE}/production/orders`, getConfig());
        setProduction(pro.data || []);

        const dailyRes = await axios.get(`${API_BASE}/ai/daily-report`, getConfig());
        setDailyReport(dailyRes.data.report || "");
      }
    } catch (error) {
      console.log("Error loading reports data:", error);
    }
  };

  const handleGenerateSummary = async (reportName) => {
    setSummaryLoading(prev => ({ ...prev, [reportName]: true }));
    try {
      const response = await axios.post(`${API_BASE}/ai/report-summary`, { reportName }, getConfig());
      setAiSummaries(prev => ({ ...prev, [reportName]: response.data.summary }));
    } catch (err) {
      console.error(err);
      setAiSummaries(prev => ({ ...prev, [reportName]: "Failed to generate report summary. Please check connection." }));
    } finally {
      setSummaryLoading(prev => ({ ...prev, [reportName]: false }));
    }
  };

  const handleEmailReport = async () => {
    if (!email) {
      alert("Please enter an email address.");
      return;
    }
    setEmailStatus("Sending report...");
    try {
      const res = await axios.post(`${API_BASE}/ai/email-report`, { email }, getConfig());
      setEmailStatus(res.data.message);
    } catch (err) {
      setEmailStatus("Failed to send email report.");
    }
  };

  const exportPDF = (title, headers, rows) => {
    const doc = new jsPDF();
    doc.text("NOVACORE ERP SYSTEM REPORT - " + title.toUpperCase(), 14, 15);
    
    if (rows.length > 0) {
      autoTable(doc, {
        head: [headers],
        body: rows,
        startY: 22
      });
    } else {
      doc.text("No records found.", 14, 25);
    }
    doc.save(title.toLowerCase().replace(/\s+/g, "_") + ".pdf");
  };

  const exportExcel = (title, data) => {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, title);
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const file = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(file, title.toLowerCase().replace(/\s+/g, "_") + ".xlsx");
  };

  const handlePrint = () => {
    window.print();
  };

  // HR REPORT PROCESSING
  const getHrReportData = () => {
    return employees.map(e => ({
      "Emp Code": e.empCode,
      "Name": e.name,
      "Department": e.department,
      "Designation": e.designation,
      "Salary": `₹${(e.salary || 0).toLocaleString()}`,
      "Status": e.status
    }));
  };

  // SALES REPORT PROCESSING
  const getSalesReportData = () => {
    return sales.map(s => ({
      "Order Date": s.orderDate || "N/A",
      "Customer": s.customerName || "N/A",
      "Product": s.productName || "N/A",
      "Qty": s.quantity || 0,
      "Total Amount": `₹${(s.totalAmount || 0).toLocaleString()}`,
      "Status": s.status || "N/A"
    }));
  };

  // INVENTORY REPORT PROCESSING
  const getInventoryReportData = () => {
    return products.map(p => ({
      "Product Name": p.name || "N/A",
      "Category": p.category || "N/A",
      "Qty in Stock": p.stock || 0,
      "Unit Price": `₹${(p.sellingPrice || 0).toLocaleString()}`,
      "Warehouse": p.warehouse || "N/A"
    }));
  };

  // FINANCE REPORT PROCESSING
  const getFinanceReportData = () => {
    return finance.map(f => ({
      "ID": f.id,
      "Type": f.type || "N/A",
      "Amount": `₹${(f.amount || 0).toLocaleString()}`,
      "Date": f.date || "N/A",
      "Reference": f.reference || "N/A"
    }));
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <style>{`
          .report-tab-btn {
            border: none;
            background: transparent;
            padding: 12px 20px;
            font-weight: 600;
            color: #64748b;
            border-bottom: 3px solid transparent;
            transition: all 0.2s;
          }
          .report-tab-btn.active {
            color: #2563eb;
            border-bottom-color: #2563eb;
          }
          .report-tab-btn:hover {
            color: #2563eb;
          }
          .metric-card {
            border-radius: 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
          }
          .ai-box {
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.04) 0%, rgba(59, 130, 246, 0.04) 100%);
            border: 1px solid rgba(139, 92, 246, 0.15);
          }
        `}</style>

        <div className="d-flex justify-content-between align-items-center mb-4">
          <div>
            <h2 className="font-bold text-primary m-0">Corporate AI Report Generator</h2>
            <p className="text-secondary m-0" style={{ fontSize: "13px" }}>Analyze operational segments and export live audit report ledgers</p>
          </div>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={handlePrint}>
            <FaPrint /> Print Dashboard
          </button>
        </div>

        {/* Unified Reports Navigation Tabs */}
        <div className="card shadow-sm mb-4" style={{ borderRadius: "16px" }}>
          <div className="border-bottom d-flex bg-light px-3" style={{ borderTopLeftRadius: "16px", borderTopRightRadius: "16px" }}>
            {(role === "ADMIN" || role === "HR") && (
              <button className={`report-tab-btn d-flex align-items-center gap-2 ${activeTab === "hr" ? "active" : ""}`} onClick={() => setActiveTab("hr")}>
                <FaUserTie /> HR Report
              </button>
            )}
            {(role === "ADMIN" || role === "SALES") && (
              <button className={`report-tab-btn d-flex align-items-center gap-2 ${activeTab === "sales" ? "active" : ""}`} onClick={() => setActiveTab("sales")}>
                <FaShoppingCart /> Sales Report
              </button>
            )}
            {(role === "ADMIN" || role === "INVENTORY") && (
              <button className={`report-tab-btn d-flex align-items-center gap-2 ${activeTab === "inventory" ? "active" : ""}`} onClick={() => setActiveTab("inventory")}>
                <FaWarehouse /> Inventory Report
              </button>
            )}
            {(role === "ADMIN" || role === "FINANCE") && (
              <button className={`report-tab-btn d-flex align-items-center gap-2 ${activeTab === "finance" ? "active" : ""}`} onClick={() => setActiveTab("finance")}>
                <FaCoins /> Finance Report
              </button>
            )}
          </div>

          <div className="card-body p-4">
            {/* 1. HR REPORT SEGMENT */}
            {activeTab === "hr" && (role === "ADMIN" || role === "HR") && (
              <div className="animate-fade-in">
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Total Workforce Staff</span>
                      <h4 className="font-bold mt-1 text-primary">{employees.length}</h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Pending Leaves</span>
                      <h4 className="font-bold mt-1 text-warning">{leaves.filter(l => l.status === "PENDING").length}</h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Processed Payroll Runs</span>
                      <h4 className="font-bold mt-1 text-success">{payrolls.length}</h4>
                    </div>
                  </div>
                </div>

                <div className="p-4 mb-4 ai-box">
                  <h6 className="font-bold text-primary mb-2 d-flex align-items-center gap-2"><FaBrain /> AI Executive HR Narrative</h6>
                  {aiSummaries["HR_Report"] ? (
                    <div className="text-dark small" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                      {aiSummaries["HR_Report"]}
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleGenerateSummary("HR_Report")} disabled={summaryLoading["HR_Report"]}>
                      {summaryLoading["HR_Report"] ? "Analyzing HR data..." : "Generate AI HR Analysis"}
                    </button>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="font-bold m-0"> Workforce Directory Summary</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => exportPDF("HR Report", ["Emp Code", "Name", "Department", "Designation", "Salary", "Status"], getHrReportData().map(Object.values))}>
                      <FaFilePdf size={12} /> Export PDF
                    </button>
                    <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={() => exportExcel("HR Report", getHrReportData())}>
                      <FaFileExcel size={12} /> Export Excel
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-primary small text-uppercase">
                      <tr>
                        <th>Code</th>
                        <th>Name</th>
                        <th>Department</th>
                        <th>Designation</th>
                        <th>Salary</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {employees.slice(0, 5).map(e => (
                        <tr key={e.id}>
                          <td>{e.empCode}</td>
                          <td><strong>{e.name}</strong></td>
                          <td>{e.department}</td>
                          <td>{e.designation}</td>
                          <td>₹{(e.salary || 0).toLocaleString()}</td>
                          <td><span className={`badge ${e.status === "ACTIVE" ? "bg-success" : "bg-secondary"}`}>{e.status}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-secondary small m-0">Showing top 5 entries. Complete data will be fetched for exports.</p>
                </div>
              </div>
            )}

            {/* 2. SALES REPORT SEGMENT */}
            {activeTab === "sales" && (role === "ADMIN" || role === "SALES") && (
              <div className="animate-fade-in">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Gross Fulfilled Orders</span>
                      <h4 className="font-bold mt-1 text-primary">{sales.length} orders</h4>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Cumulative Sales Turnover</span>
                      <h4 className="font-bold mt-1 text-success">
                        ₹{sales.reduce((acc, curr) => acc + (curr.totalAmount || 0), 0).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="p-4 mb-4 ai-box">
                  <h6 className="font-bold text-primary mb-2 d-flex align-items-center gap-2"><FaBrain /> AI Executive Sales Narrative</h6>
                  {aiSummaries["Sales_Report"] ? (
                    <div className="text-dark small" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                      {aiSummaries["Sales_Report"]}
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleGenerateSummary("Sales_Report")} disabled={summaryLoading["Sales_Report"]}>
                      {summaryLoading["Sales_Report"] ? "Analyzing Sales records..." : "Generate AI Sales Analysis"}
                    </button>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="font-bold m-0">Sales Orders Ledger Summary</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => exportPDF("Sales Report", ["Order Date", "Customer", "Product", "Qty", "Total Amount", "Status"], getSalesReportData().map(Object.values))}>
                      <FaFilePdf size={12} /> Export PDF
                    </button>
                    <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={() => exportExcel("Sales Report", getSalesReportData())}>
                      <FaFileExcel size={12} /> Export Excel
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-primary small text-uppercase">
                      <tr>
                        <th>Date</th>
                        <th>Customer</th>
                        <th>Product</th>
                        <th>Quantity</th>
                        <th>Total Amount</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {sales.slice(0, 5).map(s => (
                        <tr key={s.id}>
                          <td>{s.orderDate || "N/A"}</td>
                          <td><strong>{s.customerName || "N/A"}</strong></td>
                          <td>{s.productName || "N/A"}</td>
                          <td>{s.quantity || 0}</td>
                          <td className="font-bold text-success">₹{(s.totalAmount || 0).toLocaleString()}</td>
                          <td><span className="badge bg-primary">{s.status || "N/A"}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-secondary small m-0">Showing top 5 entries. Complete data will be fetched for exports.</p>
                </div>
              </div>
            )}

            {/* 3. INVENTORY REPORT SEGMENT */}
            {activeTab === "inventory" && (role === "ADMIN" || role === "INVENTORY") && (
              <div className="animate-fade-in">
                <div className="row g-3 mb-4">
                  <div className="col-md-6">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Catalog Product SKUs</span>
                      <h4 className="font-bold mt-1 text-primary">{products.length} items</h4>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Critical Stock Warnings (&lt; 10 units)</span>
                      <h4 className="font-bold mt-1 text-danger">
                        {products.filter(p => (p.stock || 0) < 10).length} items
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="p-4 mb-4 ai-box">
                  <h6 className="font-bold text-primary mb-2 d-flex align-items-center gap-2"><FaBrain /> AI Executive Inventory Narrative</h6>
                  {aiSummaries["Inventory_Report"] ? (
                    <div className="text-dark small" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                      {aiSummaries["Inventory_Report"]}
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleGenerateSummary("Inventory_Report")} disabled={summaryLoading["Inventory_Report"]}>
                      {summaryLoading["Inventory_Report"] ? "Analyzing stock data..." : "Generate AI Inventory Analysis"}
                    </button>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="font-bold m-0">Inventory Catalog Summary</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => exportPDF("Inventory Report", ["Product Name", "Category", "Qty in Stock", "Unit Price", "Warehouse"], getInventoryReportData().map(Object.values))}>
                      <FaFilePdf size={12} /> Export PDF
                    </button>
                    <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={() => exportExcel("Inventory Report", getInventoryReportData())}>
                      <FaFileExcel size={12} /> Export Excel
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-primary small text-uppercase">
                      <tr>
                        <th>Product Name</th>
                        <th>Category</th>
                        <th>Stock Level</th>
                        <th>Unit Price</th>
                        <th>Warehouse</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {products.slice(0, 5).map(p => (
                        <tr key={p.id}>
                          <td><strong>{p.name || "N/A"}</strong></td>
                          <td>{p.category || "N/A"}</td>
                          <td>
                            <span className={`font-bold ${(p.stock || 0) < 10 ? "text-danger" : "text-dark"}`}>{p.stock || 0}</span>
                          </td>
                          <td>₹{(p.sellingPrice || 0).toLocaleString()}</td>
                          <td>{p.warehouse || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-secondary small m-0">Showing top 5 entries. Complete data will be fetched for exports.</p>
                </div>
              </div>
            )}

            {/* 4. FINANCE REPORT SEGMENT */}
            {activeTab === "finance" && (role === "ADMIN" || role === "FINANCE") && (
              <div className="animate-fade-in">
                <div className="row g-3 mb-4">
                  <div className="col-md-4">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Gross revenue Inflows</span>
                      <h4 className="font-bold mt-1 text-success">
                        ₹{finance.filter(f => f.type === "INCOME").reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Overhead Outflows</span>
                      <h4 className="font-bold mt-1 text-danger">
                        ₹{finance.filter(f => f.type === "EXPENSE").reduce((acc, curr) => acc + (curr.amount || 0), 0).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                  <div className="col-md-4">
                    <div className="p-3 metric-card">
                      <span className="text-secondary small font-semibold">Net Balance</span>
                      <h4 className="font-bold mt-1 text-primary">
                        ₹{(
                          finance.filter(f => f.type === "INCOME").reduce((acc, curr) => acc + (curr.amount || 0), 0) -
                          finance.filter(f => f.type === "EXPENSE").reduce((acc, curr) => acc + (curr.amount || 0), 0)
                        ).toLocaleString()}
                      </h4>
                    </div>
                  </div>
                </div>

                <div className="p-4 mb-4 ai-box">
                  <h6 className="font-bold text-primary mb-2 d-flex align-items-center gap-2"><FaBrain /> AI Executive Finance Narrative</h6>
                  {aiSummaries["Finance_Report"] ? (
                    <div className="text-dark small" style={{ whiteSpace: "pre-line", lineHeight: "1.6" }}>
                      {aiSummaries["Finance_Report"]}
                    </div>
                  ) : (
                    <button className="btn btn-sm btn-primary" onClick={() => handleGenerateSummary("Finance_Report")} disabled={summaryLoading["Finance_Report"]}>
                      {summaryLoading["Finance_Report"] ? "Analyzing general ledger..." : "Generate AI Finance Analysis"}
                    </button>
                  )}
                </div>

                <div className="d-flex justify-content-between align-items-center mb-3">
                  <h6 className="font-bold m-0">Corporate General Ledger Summary</h6>
                  <div className="d-flex gap-2">
                    <button className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1" onClick={() => exportPDF("Finance Report", ["ID", "Type", "Amount", "Date", "Reference"], getFinanceReportData().map(Object.values))}>
                      <FaFilePdf size={12} /> Export PDF
                    </button>
                    <button className="btn btn-sm btn-outline-success d-flex align-items-center gap-1" onClick={() => exportExcel("Finance Report", getFinanceReportData())}>
                      <FaFileExcel size={12} /> Export Excel
                    </button>
                  </div>
                </div>

                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-primary small text-uppercase">
                      <tr>
                        <th>ID</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Date</th>
                        <th>Reference</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {finance.slice(0, 5).map(f => (
                        <tr key={f.id}>
                          <td>{f.id}</td>
                          <td><span className={`badge ${f.type === "INCOME" ? "bg-success" : "bg-danger"}`}>{f.type}</span></td>
                          <td className="font-bold">₹{(f.amount || 0).toLocaleString()}</td>
                          <td>{f.date || "N/A"}</td>
                          <td>{f.reference || "N/A"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="text-secondary small m-0">Showing top 5 entries. Complete data will be fetched for exports.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Auto Daily Report & Email Report */}
        <div className="card shadow-sm p-4 mb-4" style={{ borderRadius: "16px" }}>
          <h4 className="font-bold text-primary mb-3 d-flex align-items-center gap-2">
            <FaEnvelope /> AI Auto Daily Report & Email Dispatcher
          </h4>
          <div className="row">
            <div className="col-lg-8 mb-3">
              <h6 className="font-semibold text-secondary mb-2" style={{ fontSize: "13px" }}>Auto-Compiled Report Body:</h6>
              <textarea 
                className="form-control" 
                rows="9" 
                readOnly 
                value={dailyReport} 
                style={{ fontFamily: "monospace", fontSize: "12px", background: "#f8fafc" }}
              />
            </div>
            <div className="col-lg-4 d-flex flex-column justify-content-center">
              <h6 className="font-semibold text-secondary mb-2" style={{ fontSize: "13px" }}>Dispatch Report to Email:</h6>
              <div className="d-flex flex-column gap-2">
                <input 
                  type="email" 
                  className="form-control" 
                  placeholder="Enter email address..." 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="btn btn-primary d-flex align-items-center justify-content-center gap-2" onClick={handleEmailReport}>
                  <FaEnvelope size={14} /> Send Email Report
                </button>
                {emailStatus && (
                  <p className="mt-2 text-center text-primary font-semibold" style={{ fontSize: "13px" }}>
                    {emailStatus}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Reports;
