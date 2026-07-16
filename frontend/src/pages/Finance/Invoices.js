import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaFileInvoice, FaPlus, FaCheck, FaBrain } from "react-icons/fa";

function Invoices() {
  const [records, setRecords] = useState([]);
  
  // Form states
  const [type, setType] = useState("INCOME");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("Sales Revenue");
  const [description, setDescription] = useState("");

  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);

  const runInvoiceAnalysis = () => {
    setAnalyzing(true);
    setTimeout(() => {
      const duplicates = [];
      const missingDetails = [];
      const pending = [];
      const overdue = [];

      const seen = {};
      records.forEach((rec) => {
        const key = `${rec.type}-${rec.category}-${rec.amount}-${rec.date}`;
        if (seen[key]) {
          duplicates.push(`TX-${5000 + rec.id} (Matches TX-${5000 + seen[key].id} of Value ₹${rec.amount})`);
        } else {
          seen[key] = rec;
        }

        if (!rec.description || rec.description.toLowerCase().includes("null transaction") || rec.description.trim() === "") {
          missingDetails.push(`TX-${5000 + rec.id}`);
        }

        if (rec.amount > 30000) {
          pending.push(`TX-${5000 + rec.id} (₹${rec.amount})`);
          
          const recDate = new Date(rec.date);
          const diffDays = Math.ceil(Math.abs(new Date() - recDate) / (1000 * 60 * 60 * 24));
          if (diffDays > 5) {
            overdue.push(`TX-${5000 + rec.id}`);
          }
        }
      });

      setAnalysis({
        duplicates,
        missingDetails,
        pending,
        overdue
      });
      setAnalyzing(false);
    }, 800);
  };

  const BASE_URL = API_BASE_URL + "/api/finance/records";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadLedger();
  }, []);

  const loadLedger = async () => {
    try {
      const response = await axios.get(BASE_URL, getConfig());
      setRecords(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const addLedgerEntry = async () => {
    if (!amount || !description) {
      alert("Please fill in amount and description!");
      return;
    }
    const payload = {
      type,
      amount: parseFloat(amount),
      category,
      description
    };
    try {
      await axios.post(BASE_URL, payload, getConfig());
      alert("Ledger Entry posted successfully");
      setAmount("");
      setDescription("");
      loadLedger();
    } catch (err) {
      console.error(err);
    }
  };

  const categories = {
    INCOME: ["Sales Revenue", "Services", "Investments", "Other Income"],
    EXPENSE: ["Salary", "Materials", "Machine Maintenance", "Utility", "Taxes", "Office Rent"]
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Invoices & General Ledger</h3>

        <div className="row">
          {/* Post Ledger Form */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaPlus /> Post Ledger Entry
              </h5>

              <div className="mb-3">
                <label className="form-label font-semibold">Entry Type</label>
                <select className="form-select" value={type} onChange={(e) => {
                  setType(e.target.value);
                  setCategory(categories[e.target.value][0]);
                }}>
                  <option value="INCOME">INCOME (Credit)</option>
                  <option value="EXPENSE">EXPENSE (Debit)</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Category</label>
                <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                  {categories[type].map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Amount (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 5000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">Description</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Utility bill payout"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-100" onClick={addLedgerEntry}>
                Post Transaction
              </button>
            </div>

            {/* AI Invoice Analysis Panel */}
            <div className="card border-0 shadow-sm p-4 mt-4" style={{ borderRadius: "16px", background: "linear-gradient(135deg, rgba(139, 92, 246, 0.05) 0%, rgba(59, 130, 246, 0.05) 100%)", border: "1px solid rgba(139, 92, 246, 0.15)" }}>
              <h5 className="font-bold text-primary mb-3 d-flex align-items-center gap-2">
                <FaBrain /> AI Invoice Analysis <span className="badge bg-primary-soft text-primary small font-bold px-2 py-0.5" style={{ fontSize: "10px" }}>AI Generated</span>
              </h5>
              
              <button className="btn btn-sm btn-outline-primary w-100 mb-3 font-semibold" onClick={runInvoiceAnalysis} disabled={analyzing}>
                {analyzing ? "Scanning Ledger..." : "Run AI Invoice Audit"}
              </button>

              {analysis && (
                <div className="small">
                  {analysis.duplicates.length > 0 && (
                    <div className="alert alert-warning py-2 mb-2" style={{ fontSize: "12px", border: "none", color: "#856404", backgroundColor: "#fff3cd" }}>
                      <strong>⚠️ Duplicate Invoices:</strong>
                      <ul className="m-0 pl-3" style={{ paddingLeft: "15px" }}>
                        {analysis.duplicates.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.missingDetails.length > 0 && (
                    <div className="alert alert-danger py-2 mb-2" style={{ fontSize: "12px", border: "none", color: "#721c24", backgroundColor: "#f8d7da" }}>
                      <strong>🛑 Missing Details:</strong>
                      <ul className="m-0 pl-3" style={{ paddingLeft: "15px" }}>
                        {analysis.missingDetails.map((item, i) => <li key={i}>{item} has empty descriptions.</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.pending.length > 0 && (
                    <div className="alert alert-info py-2 mb-2" style={{ fontSize: "12px", border: "none", color: "#0c5460", backgroundColor: "#d1ecf1" }}>
                      <strong>ℹ️ Pending Receipts:</strong>
                      <ul className="m-0 pl-3" style={{ paddingLeft: "15px" }}>
                        {analysis.pending.map((item, i) => <li key={i}>{item}</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.overdue.length > 0 && (
                    <div className="alert alert-secondary py-2 mb-2" style={{ fontSize: "12px", border: "none", color: "#383d41", backgroundColor: "#e2e3e5" }}>
                      <strong>⏰ Overdue Payments:</strong>
                      <ul className="m-0 pl-3" style={{ paddingLeft: "15px" }}>
                        {analysis.overdue.map((item, i) => <li key={i}>{item} is past due (>5 days).</li>)}
                      </ul>
                    </div>
                  )}

                  {analysis.duplicates.length === 0 && analysis.missingDetails.length === 0 && (
                    <div className="alert alert-success py-2 mb-0" style={{ fontSize: "12px", border: "none", color: "#155724", backgroundColor: "#d4edda" }}>
                      <strong>✓ Healthy Ledger:</strong> No duplicates or missing descriptions detected in this cycle.
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Ledger History List */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaFileInvoice /> Audit Ledger Accounts
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>TXID</th>
                      <th>Type</th>
                      <th>Category</th>
                      <th>Description</th>
                      <th>Date</th>
                      <th>Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {records.length > 0 ? (
                      records.map((rec) => (
                        <tr key={rec.id}>
                          <td>TX-{5000 + rec.id}</td>
                          <td>
                            <span className={`badge ${rec.type === "INCOME" ? "bg-success" : "bg-danger"} text-white`} style={{ fontSize: "11px" }}>
                              {rec.type}
                            </span>
                          </td>
                          <td>{rec.category}</td>
                          <td>{rec.description}</td>
                          <td>{rec.date}</td>
                          <td>
                            <strong className={rec.type === "INCOME" ? "text-success" : "text-danger"}>
                               {rec.type === "INCOME" ? "+" : "-"}₹{(rec.amount || 0).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">No transactions logged in this cycle.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Invoices;