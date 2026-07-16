import { useState, useEffect } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { FaUpload, FaBrain, FaFileInvoice, FaReceipt, FaFileMedical, FaArrowRight, FaCheckCircle, FaExclamationTriangle } from "react-icons/fa";

function DocumentScanner() {
  const role = localStorage.getItem("role") ? localStorage.getItem("role").toUpperCase().replace("ROLE_", "") : "";
  const [file, setFile] = useState(null);
  const [docType, setDocType] = useState("Invoice");
  const [scanning, setScanning] = useState(false);
  const [extracted, setExtracted] = useState(null);
  const [history, setHistory] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [selectedEmp, setSelectedEmp] = useState("");
  const [toasts, setToasts] = useState([]);

  const getOptionsForRole = () => {
    switch (role) {
      case "HR":
        return [
          { value: "Medical Certificate", label: "Medical Certificate (Sick Leave Doc)" },
          { value: "Resume", label: "Resume OCR" },
          { value: "Employee Documents", label: "Employee Documents OCR" },
          { value: "Leave Documents", label: "Leave Documents OCR" }
        ];
      case "FINANCE":
        return [
          { value: "Invoice", label: "Invoice (Vendor Bill)" },
          { value: "Tax Bill", label: "Tax Bill OCR" },
          { value: "Expense", label: "Expense Receipt OCR" },
          { value: "Vendor Bills", label: "Vendor Bills OCR" }
        ];
      case "INVENTORY":
        return [
          { value: "Purchase Bill", label: "Purchase Bill (Procurement)" },
          { value: "Supplier Invoice", label: "Supplier Invoice OCR" },
          { value: "Goods Receipt", label: "Goods Receipt OCR" },
          { value: "Barcode", label: "Barcode OCR" }
        ];
      case "SALES":
        return [
          { value: "Quotation", label: "Quotation OCR" },
          { value: "Sales Invoice", label: "Sales Invoice OCR" },
          { value: "Customer Purchase Order", label: "Customer Purchase Order OCR" }
        ];
      case "EMPLOYEE":
        return [
          { value: "Medical Certificate", label: "Medical Certificate (Sick Leave Doc)" },
          { value: "Leave Proof", label: "Leave Proof Upload" }
        ];
      default: // ADMIN
        return [
          { value: "Invoice", label: "Invoice (Vendor Bill)" },
          { value: "Purchase Bill", label: "Purchase Bill (Procurement)" },
          { value: "Medical Certificate", label: "Medical Certificate (Sick Leave Doc)" },
          { value: "Resume", label: "Resume OCR" },
          { value: "Tax Bill", label: "Tax Bill OCR" },
          { value: "Goods Receipt", label: "Goods Receipt OCR" }
        ];
    }
  };

  const API_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/ocr";
  const EXPENSE_API = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/expenses";
  const LEAVE_API = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/hr/leaves";
  const EMPLOYEES_API = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employees";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3500);
  };

  useEffect(() => {
    loadHistory();
    loadEmployees();
    const opts = getOptionsForRole();
    if (opts.length > 0) {
      setDocType(opts[0].value);
    }
  }, [role]);

  const handleDownload = async (docId, fileName) => {
    try {
      const res = await axios.get(`${API_BASE}/documents/download/${docId}`, {
        ...getConfig(),
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      console.error("Cloud storage download failed:", err);
      alert("Failed to download file from cloud storage.");
    }
  };

  const loadHistory = async () => {
    try {
      const res = await axios.get(`${API_BASE}/documents`, getConfig());
      setHistory(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      const res = await axios.get(EMPLOYEES_API, getConfig());
      setEmployees(res.data || []);
      if (res.data && res.data.length > 0) {
        setSelectedEmp(res.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleScan = async (e) => {
    e.preventDefault();
    if (!file) {
      showToast("Please choose a document file to scan", "danger");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("type", docType);

    try {
      setScanning(true);
      setExtracted(null);
      
      const config = {
        headers: {
          ...getConfig().headers,
          "Content-Type": "multipart/form-data"
        }
      };

      const res = await axios.post(`${API_BASE}/scan`, formData, config);
      setExtracted(res.data);
      showToast("Document successfully processed with AI OCR!", "success");
      loadHistory();
    } catch (err) {
      console.error(err);
      showToast("Document processing failed", "danger");
    } finally {
      setScanning(false);
    }
  };

  const handleAutoFill = async () => {
    if (!extracted) return;

    try {
      if (extracted.documentType === "Invoice" || extracted.documentType === "Purchase Bill") {
        // Post Expense
        const expensePayload = {
          expenseName: `${extracted.extractedVendor} - ${extracted.extractedName} (${extracted.extractedInvoiceNumber})`,
          amount: extracted.extractedAmount,
          expenseDate: extracted.extractedDate
        };
        await axios.post(EXPENSE_API, expensePayload, getConfig());
        showToast("Expense record automatically registered in Finance ledger!", "success");
      } else if (extracted.documentType === "Medical Certificate") {
        if (!selectedEmp) {
          showToast("Please select employee filing this leave request", "danger");
          return;
        }
        // Post Sick Leave
        const leavePayload = {
          employeeId: Number(selectedEmp),
          reason: `Sick Leave - ${extracted.extractedName} (Ref: ${extracted.extractedInvoiceNumber})`,
          fromDate: extracted.extractedDate,
          toDate: extracted.extractedDate,
          totalDays: 1,
          status: "PENDING",
          stage: "SUBMITTED",
          leaveType: "Sick",
          supportingDocPath: extracted.fileName
        };
        await axios.post(LEAVE_API, leavePayload, getConfig());
        showToast("Sick leave request successfully filed with attachment details!", "success");
      }

      // Update scanned document status
      await axios.put(`${API_BASE}/documents/${extracted.id}/status?status=AUTO_FILLED`, {}, getConfig());
      setExtracted(prev => ({ ...prev, status: "AUTO_FILLED" }));
      loadHistory();
    } catch (err) {
      console.error(err);
      showToast("Auto-fill request failed", "danger");
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <style>{`
          .scanner-dropzone {
            border: 2px dashed #cbd5e1;
            background: #f8fafc;
            border-radius: 16px;
            padding: 35px 20px;
            text-align: center;
            cursor: pointer;
            transition: all 0.2s;
          }
          .scanner-dropzone:hover {
            border-color: #3b82f6;
            background: #f0f7ff;
          }
          .extracted-box {
            border-radius: 16px;
            background: linear-gradient(135deg, rgba(59, 130, 246, 0.03) 0%, rgba(139, 92, 246, 0.03) 100%);
            border: 1px solid rgba(59, 130, 246, 0.15);
          }
          .toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1060;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
        `}</style>

        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-primary m-0">AI OCR Document Scanner</h2>
            <p className="text-secondary m-0" style={{ fontSize: "13px" }}>Digitize corporate invoices, bills, and medical certificates using AI recognition</p>
          </div>
        </div>

        <div className="row">
          {/* Document Upload & Form Control */}
          <div className="col-lg-5 mb-4">
            <div className="card shadow-sm p-4 h-100" style={{ borderRadius: "16px" }}>
              <h5 className="font-bold mb-4 d-flex align-items-center gap-2">
                <FaUpload className="text-primary" /> Upload File for Parsing
              </h5>
              
              <form onSubmit={handleScan}>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Select Document Target Type</label>
                  <select className="form-select" value={docType} onChange={e => setDocType(e.target.value)}>
                    {getOptionsForRole().map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label font-semibold small">Choose PDF or Image File</label>
                  <div className="scanner-dropzone" onClick={() => document.getElementById("scannerFileInput").click()}>
                    <div className="mb-2">
                      {docType === "Invoice" ? <FaFileInvoice size={42} className="text-primary" /> : 
                       docType === "Purchase Bill" ? <FaReceipt size={42} className="text-success" /> : 
                       <FaFileMedical size={42} className="text-danger" />}
                    </div>
                    <span className="text-secondary font-semibold" style={{ fontSize: "13px" }}>
                      {file ? file.name : "Click to select local file"}
                    </span>
                    <input type="file" id="scannerFileInput" className="d-none" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary w-100 d-flex align-items-center justify-content-center gap-2" disabled={scanning}>
                  <FaBrain /> {scanning ? "AI OCR Processing..." : "Scan & Extract Data"}
                </button>
              </form>
            </div>
          </div>

          {/* Extracted Details & Auto-fill Action */}
          <div className="col-lg-7 mb-4">
            <div className="card shadow-sm p-4 h-100 extracted-box" style={{ borderRadius: "16px" }}>
              <h5 className="font-bold mb-4 text-primary d-flex align-items-center gap-2">
                <FaBrain /> AI OCR Extracted Insights
              </h5>

              {scanning ? (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 h-100">
                  <div className="spinner-border text-primary mb-3" role="status"></div>
                  <p className="text-secondary font-semibold">Running OCR segmentation, layouts analysis, and parsing entity fields...</p>
                </div>
              ) : extracted ? (
                <div className="h-100 d-flex flex-column justify-content-between">
                  <div>
                    <div className="row g-3">
                      <div className="col-md-6 border-end">
                        <span className="text-secondary small font-semibold">Document Name / Title</span>
                        <h6 className="font-bold text-dark mt-1">{extracted.extractedName}</h6>
                      </div>
                      <div className="col-md-6">
                        <span className="text-secondary small font-semibold">Document Type</span>
                        <h6 className="font-bold text-primary mt-1">{extracted.documentType}</h6>
                      </div>
                      <div className="col-md-6 border-end">
                        <span className="text-secondary small font-semibold">Invoice / Document Number</span>
                        <h6 className="font-bold mt-1">{extracted.extractedInvoiceNumber || "N/A"}</h6>
                      </div>
                      <div className="col-md-6">
                        <span className="text-secondary small font-semibold">Document Date</span>
                        <h6 className="font-bold mt-1">{extracted.extractedDate || "N/A"}</h6>
                      </div>
                      <div className="col-md-6 border-end">
                        <span className="text-secondary small font-semibold">Vendor / Issuer Name</span>
                        <h6 className="font-semibold mt-1">{extracted.extractedVendor || "N/A"}</h6>
                      </div>
                      <div className="col-md-6">
                        <span className="text-secondary small font-semibold">Extracted Amount</span>
                        <h6 className="font-bold text-success mt-1">₹{(extracted.extractedAmount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</h6>
                      </div>
                    </div>
                  </div>

                  <div className="border-top pt-4 mt-4">
                    <h6 className="font-bold text-dark mb-3">Auto-Fill ERP Record Actions</h6>
                    
                    {extracted.documentType === "Medical Certificate" && (
                      <div className="mb-3">
                        <label className="form-label font-semibold small">Filing Sick Leave For Employee:</label>
                        <select className="form-select form-select-sm" value={selectedEmp} onChange={e => setSelectedEmp(e.target.value)}>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name} ({emp.empCode})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {extracted.status === "AUTO_FILLED" ? (
                      <div className="alert alert-success border-0 py-2 d-flex align-items-center gap-2 m-0" style={{ borderRadius: "10px" }}>
                        <FaCheckCircle className="text-success" />
                        <span>This document's details have already been auto-filled into the ERP modules.</span>
                      </div>
                    ) : (
                      <button className="btn btn-success d-flex align-items-center gap-2 w-100 justify-content-center" onClick={handleAutoFill}>
                        Auto-fill ERP Form Fields <FaArrowRight />
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center py-5 text-secondary h-100">
                  <FaExclamationTriangle size={36} className="mb-2 opacity-50" />
                  <p className="font-semibold small m-0">No document scanned yet. Choose a file on the left side to begin parsing.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* History Table */}
        <div className="card shadow-sm p-4 mt-4" style={{ borderRadius: "16px" }}>
          <h5 className="font-bold mb-3">Historically Processed Scans</h5>
          <div className="table-responsive">
            <table className="table table-bordered table-hover align-middle">
              <thead className="table-primary text-uppercase" style={{ fontSize: "11px" }}>
                <tr>
                  <th>File Name</th>
                  <th>Document Type</th>
                  <th>Extracted Vendor</th>
                  <th>Doc Number</th>
                  <th>Date</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody style={{ fontSize: "12.5px" }}>
                {history.length > 0 ? (
                  history.slice().reverse().map(doc => (
                    <tr key={doc.id}>
                      <td><strong>{doc.fileName}</strong></td>
                      <td>{doc.documentType}</td>
                      <td>{doc.extractedVendor || "N/A"}</td>
                      <td>{doc.extractedInvoiceNumber || "N/A"}</td>
                      <td>{doc.extractedDate}</td>
                      <td className="font-bold text-success">₹{(doc.extractedAmount || 0).toLocaleString()}</td>
                      <td>
                        <span className={`badge ${doc.status === "AUTO_FILLED" ? "bg-success" : "bg-primary"}`} style={{ fontSize: "9.5px" }}>
                          {doc.status}
                        </span>
                      </td>
                      <td>
                        <button className="btn btn-sm btn-outline-primary py-0" onClick={() => handleDownload(doc.id, doc.fileName)}>
                          Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-3 text-secondary">No scanned documents logged in system.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* TOAST alerts */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`alert alert-${t.type === "success" ? "success" : "danger"} shadow-lg m-0 py-2 px-3 animate-fade-in`} style={{ borderRadius: "8px", minWidth: "220px", fontSize: "13px" }}>
            {t.message}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default DocumentScanner;
