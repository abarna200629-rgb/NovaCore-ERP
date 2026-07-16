import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaShieldAlt, FaExclamationCircle, FaUserCheck, FaInfoCircle, FaSearch, FaUniversity } from "react-icons/fa";

function CreditRiskDashboard() {
  const [data, setData] = useState({
    totalCustomers: 0,
    lowRiskCount: 0,
    mediumRiskCount: 0,
    highRiskCount: 0,
    criticalRiskCount: 0,
    averageCreditScore: 0.0,
    highestRiskCustomer: "N/A",
    top10Risk: [],
    top10Safe: [],
    monthlyCreditTrend: [],
    outstandingAmountTrend: [],
    allCustomers: []
  });

  const [filteredCustomers, setFilteredCustomers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRiskFilter, setSelectedRiskFilter] = useState("ALL");
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [loading, setLoading] = useState(true);

  const currentUserRole = localStorage.getItem("role") || "EMPLOYEE";
  const isEmployee = currentUserRole.trim().toUpperCase() === "EMPLOYEE";

  const API_BASE = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/credit-risk";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token ? token.trim() : ""}` }
    };
  };

  useEffect(() => {
    if (!isEmployee) {
      loadCreditData();
    }
  }, [isEmployee]);

  const loadCreditData = async () => {
    setLoading(true);
    try {
      const response = await axios.get(API_BASE, getConfig());
      setData(response.data);
      setFilteredCustomers(response.data.allCustomers || []);
    } catch (err) {
      console.error("Error loading credit risk data:", err);
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  useEffect(() => {
    if (!data.allCustomers) return;
    let filtered = [...data.allCustomers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          (c.customerName && c.customerName.toLowerCase().includes(q)) ||
          (c.customerId && c.customerId.toString().includes(q))
      );
    }

    if (selectedRiskFilter !== "ALL") {
      filtered = filtered.filter(c => c.riskLevel === selectedRiskFilter);
    }

    setFilteredCustomers(filtered);
  }, [searchQuery, selectedRiskFilter, data.allCustomers]);

  const getRiskBadgeClass = (risk) => {
    switch (risk) {
      case "LOW RISK":
        return "bg-success text-white";
      case "MEDIUM RISK":
        return "bg-info text-white";
      case "HIGH RISK":
        return "bg-warning text-dark";
      case "CRITICAL RISK":
        return "bg-danger text-white";
      default:
        return "bg-secondary text-white";
    }
  };

  const getScoreColor = (score) => {
    if (score >= 800) return "#10b981"; // Green
    if (score >= 650) return "#3b82f6"; // Blue
    if (score >= 450) return "#f59e0b"; // Orange
    return "#ef4444"; // Red
  };

  if (isEmployee) {
    return (
      <MainLayout>
        <div className="container py-5 text-center">
          <FaShieldAlt size={56} className="text-danger mb-3" />
          <h3 className="font-bold text-danger">Access Denied</h3>
          <p className="text-secondary mt-2">
            You do not have the required permissions to view the Customer Credit Risk Analyzer.
          </p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-fluid py-4" style={{ color: "var(--text-color)" }}>
        {/* Title Header */}
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h2 className="font-bold text-primary mb-1">
              <FaUniversity className="me-2 text-primary" />
              AI Customer Credit Risk Analyzer
            </h2>
            <p className="text-secondary small mb-0">
              Evaluates buyer reliability, payment delays, outstanding balances, and risk recommendations.
            </p>
          </div>
          <button className="btn btn-primary btn-sm" onClick={loadCreditData}>
            Refresh Ledger Analysis
          </button>
        </div>

        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Calculating credit scores...</span>
            </div>
            <p className="text-secondary mt-2">Auditing invoices and order parameters...</p>
          </div>
        ) : (
          <>
            {/* Smart Alerts Center (Top-level) */}
            {data.allCustomers && data.allCustomers.some(c => c.creditScore < 500 || c.outstandingBalance > c.creditLimit) && (
              <div className="card border-warning mb-4 shadow-sm" style={{ background: "rgba(245, 158, 11, 0.04)", borderRadius: "12px" }}>
                <div className="card-header bg-warning text-dark d-flex align-items-center justify-content-between py-2.5">
                  <span className="font-bold d-flex align-items-center">
                    <FaExclamationCircle className="me-2" /> Smart Credit Risk Alerts
                  </span>
                  <span className="badge bg-dark text-warning font-bold">
                    {data.allCustomers.filter(c => c.creditScore < 500 || c.outstandingBalance > c.creditLimit).length} Alert(s)
                  </span>
                </div>
                <div className="card-body p-3" style={{ maxHeight: "180px", overflowY: "auto" }}>
                  {data.allCustomers
                    .filter(c => c.creditScore < 500 || c.outstandingBalance > c.creditLimit)
                    .map(c => (
                      <div key={c.customerId} className="d-flex align-items-center justify-content-between p-2 mb-2 bg-white border-start border-warning border-4 rounded shadow-sm text-dark">
                        <div className="small">
                          <strong>{c.customerName}</strong>: {c.creditScore < 500 ? "Score below threshold (" + c.creditScore + "). " : ""}{c.outstandingBalance > c.creditLimit ? "Outstanding balance exceeds limit (₹" + c.outstandingBalance + " / ₹" + c.creditLimit + "). " : ""}
                          {c.averagePaymentDelay > 30 ? "Late payments history logged (" + c.averagePaymentDelay + " days)." : ""}
                        </div>
                        <button className="btn btn-xs btn-outline-warning py-0.5 px-2 font-bold" style={{ fontSize: "10px" }} onClick={() => setSelectedCustomer(c)}>
                          Audit Details
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            )}

            {/* Stats Metrics widgets */}
            <div className="row g-3 mb-4">
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card p-3 shadow-sm border-0 animate-fade-in" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <span className="text-secondary small font-semibold">Total Customers</span>
                  <h3 className="font-bold mt-1 mb-0">{data.totalCustomers} Accounts</h3>
                  <div className="small text-muted mt-2">Active buyer profiles</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card p-3 shadow-sm border-0 animate-fade-in" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <span className="text-secondary small font-semibold">Average Credit Score</span>
                  <h3 className="font-bold mt-1 mb-0" style={{ color: getScoreColor(data.averageCreditScore) }}>
                    {data.averageCreditScore} / 1000
                  </h3>
                  <div className="small text-muted mt-2">Credit health baseline</div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card p-3 shadow-sm border-0 animate-fade-in" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <span className="text-secondary small font-semibold">High & Critical Risk</span>
                  <h3 className="font-bold mt-1 mb-0 text-danger">
                    {data.highRiskCount + data.criticalRiskCount} Accounts
                  </h3>
                  <div className="small text-danger mt-2 font-bold">
                    {data.criticalRiskCount} Critical | {data.highRiskCount} High
                  </div>
                </div>
              </div>
              <div className="col-12 col-md-6 col-lg-3">
                <div className="card p-3 shadow-sm border-0 animate-fade-in" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <span className="text-secondary small font-semibold">Highest Risk Account</span>
                  <h6 className="font-bold mt-2 mb-0 text-truncate text-danger" title={data.highestRiskCustomer}>
                    {data.highestRiskCustomer}
                  </h6>
                  <div className="small text-muted mt-2">Recommended: Block credit</div>
                </div>
              </div>
            </div>

            {/* Visualizations sections */}
            <div className="row g-4 mb-4">
              {/* Risk Distribution Breakdown */}
              <div className="col-12 col-lg-6">
                <div className="card p-4 shadow-sm border-0 h-100" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <h6 className="font-bold mb-3">Risk Category Distribution</h6>
                  <div className="d-flex flex-column gap-3">
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Low Risk (800 - 1000)</span>
                        <span className="font-bold text-success">{data.lowRiskCount} ({data.totalCustomers > 0 ? Math.round((data.lowRiskCount / data.totalCustomers) * 100) : 0}%)</span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div className="progress-bar bg-success" style={{ width: `${data.totalCustomers > 0 ? (data.lowRiskCount / data.totalCustomers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Medium Risk (650 - 799)</span>
                        <span className="font-bold text-info">{data.mediumRiskCount} ({data.totalCustomers > 0 ? Math.round((data.mediumRiskCount / data.totalCustomers) * 100) : 0}%)</span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div className="progress-bar bg-info" style={{ width: `${data.totalCustomers > 0 ? (data.mediumRiskCount / data.totalCustomers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>High Risk (450 - 649)</span>
                        <span className="font-bold text-warning">{data.highRiskCount} ({data.totalCustomers > 0 ? Math.round((data.highRiskCount / data.totalCustomers) * 100) : 0}%)</span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div className="progress-bar bg-warning" style={{ width: `${data.totalCustomers > 0 ? (data.highRiskCount / data.totalCustomers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                    <div>
                      <div className="d-flex justify-content-between small mb-1">
                        <span>Critical Risk (0 - 449)</span>
                        <span className="font-bold text-danger">{data.criticalRiskCount} ({data.totalCustomers > 0 ? Math.round((data.criticalRiskCount / data.totalCustomers) * 100) : 0}%)</span>
                      </div>
                      <div className="progress" style={{ height: "10px" }}>
                        <div className="progress-bar bg-danger" style={{ width: `${data.totalCustomers > 0 ? (data.criticalRiskCount / data.totalCustomers) * 100 : 0}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top 10 Risk and Safe Roster summaries */}
              <div className="col-12 col-lg-6">
                <div className="card p-4 shadow-sm border-0 h-100" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
                  <h6 className="font-bold mb-3">Top Risk Accounts vs Top Trusted Accounts</h6>
                  <div className="row">
                    <div className="col-6 border-end">
                      <span className="small text-danger font-bold d-block mb-2">CRITICAL / HIGH RISK</span>
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {data.top10Risk && data.top10Risk.map(c => (
                          <div key={c.customerId} className="small d-flex justify-content-between py-1 border-bottom" style={{ cursor: "pointer" }} onClick={() => setSelectedCustomer(c)}>
                            <span className="text-truncate" style={{ maxWidth: "100px" }}>{c.customerName}</span>
                            <span className="text-danger font-bold">{c.creditScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="col-6">
                      <span className="small text-success font-bold d-block mb-2">TOP TRUSTED / SAFE</span>
                      <div className="d-flex flex-column gap-2" style={{ maxHeight: "150px", overflowY: "auto" }}>
                        {data.top10Safe && data.top10Safe.map(c => (
                          <div key={c.customerId} className="small d-flex justify-content-between py-1 border-bottom" style={{ cursor: "pointer" }} onClick={() => setSelectedCustomer(c)}>
                            <span className="text-truncate" style={{ maxWidth: "100px" }}>{c.customerName}</span>
                            <span className="text-success font-bold">{c.creditScore}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Customers credit list roster */}
            <div className="card p-4 shadow-sm border-0" style={{ background: "var(--bg-card)", borderRadius: "12px" }}>
              <h5 className="font-bold mb-3">Customer Accounts Analysis</h5>

              {/* Filters */}
              <div className="row g-2 mb-3">
                <div className="col-12 col-md-6">
                  <div className="input-group input-group-sm">
                    <span className="input-group-text bg-transparent border-end-0"><FaSearch /></span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Search customer name or ID..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                </div>
                <div className="col-12 col-md-6">
                  <select className="form-select form-select-sm" value={selectedRiskFilter} onChange={(e) => setSelectedRiskFilter(e.target.value)}>
                    <option value="ALL">All Risk Levels</option>
                    <option value="LOW RISK">Low Risk</option>
                    <option value="MEDIUM RISK">Medium Risk</option>
                    <option value="HIGH RISK">High Risk</option>
                    <option value="CRITICAL RISK">Critical Risk</option>
                  </select>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle" style={{ color: "var(--text-color)", borderColor: "var(--border-card)" }}>
                  <thead>
                    <tr className="text-secondary small uppercase">
                      <th>Customer Name</th>
                      <th>Total Purchases</th>
                      <th>Avg Invoice</th>
                      <th>Outstanding Balance</th>
                      <th>Credit Limit</th>
                      <th>Credit Score</th>
                      <th>Risk Status</th>
                      <th className="text-end">Explainable AI</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomers.length > 0 ? (
                      filteredCustomers.map(c => (
                        <tr key={c.customerId}>
                          <td>
                            <div className="font-semibold">{c.customerName}</div>
                            <div className="small text-secondary">ID: {c.customerId}</div>
                          </td>
                          <td>₹{c.totalPurchases.toLocaleString()}</td>
                          <td>₹{c.averageInvoiceValue.toLocaleString()}</td>
                          <td className={c.outstandingBalance > 0 ? "text-danger" : ""}>
                            ₹{c.outstandingBalance.toLocaleString()}
                          </td>
                          <td>₹{c.creditLimit.toLocaleString()}</td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <span className="font-bold" style={{ color: getScoreColor(c.creditScore) }}>{c.creditScore}</span>
                              <div className="progress flex-grow-1" style={{ height: "4px", width: "40px" }}>
                                <div className="progress-bar" style={{ width: `${c.creditScore / 10}%`, backgroundColor: getScoreColor(c.creditScore) }}></div>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getRiskBadgeClass(c.riskLevel)}`}>{c.riskLevel}</span>
                          </td>
                          <td className="text-end">
                            <button className="btn btn-xs btn-outline-primary" onClick={() => setSelectedCustomer(c)}>
                              Explain Score
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="text-center text-muted py-4">No matching customer risk profiles found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Explainable AI Modal */}
      {selectedCustomer && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: "rgba(0, 0, 0, 0.4)" }}>
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg" style={{ background: "var(--bg-card)", borderRadius: "14px", color: "var(--text-color)" }}>
              <div className="modal-header border-bottom-0 pb-0">
                <h5 className="modal-title font-bold">Explainable AI Credit Risk Assessment</h5>
                <button type="button" className="btn-close" onClick={() => setSelectedCustomer(null)}></button>
              </div>
              <div className="modal-body p-4" style={{ maxHeight: "500px", overflowY: "auto" }}>
                <div className="text-center mb-4">
                  <h4 className="font-bold mb-1 text-primary">{selectedCustomer.customerName}</h4>
                  <div className="small text-secondary">Customer Account ID: {selectedCustomer.customerId}</div>
                </div>

                <div className="row g-3 mb-4">
                  <div className="col-12 col-md-6">
                    <div className="card p-3 text-center border-0" style={{ backgroundColor: "rgba(37, 99, 235, 0.03)" }}>
                      <span className="text-secondary small font-semibold">Credit Risk Score</span>
                      <h1 className="font-bold my-2" style={{ color: getScoreColor(selectedCustomer.creditScore) }}>
                        {selectedCustomer.creditScore} / 1000
                      </h1>
                      <div>
                        <span className={`badge px-3 py-1.5 ${getRiskBadgeClass(selectedCustomer.riskLevel)}`}>
                          {selectedCustomer.riskLevel}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="card p-3 border-0 h-100" style={{ backgroundColor: "rgba(37, 99, 235, 0.03)" }}>
                      <span className="small text-secondary font-bold d-block mb-1">AI BUSINESS RECOMMENDATION</span>
                      <p className="small text-dark font-semibold leading-relaxed mb-0">
                        {selectedCustomer.aiRecommendation}
                      </p>
                      <div className="small text-danger font-bold mt-2">
                        Suggested Action: {selectedCustomer.suggestedAction}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Explainable AI breakdown details */}
                <h6 className="font-bold border-bottom pb-1.5 mb-3">AI Score Explanation & Evidence</h6>
                <div className="row g-3 mb-4 small">
                  <div className="col-12 col-md-6">
                    <strong>Primary Reason:</strong> {selectedCustomer.reason}
                  </div>
                  <div className="col-12 col-md-6">
                    <strong>Extracted Evidence:</strong> {selectedCustomer.evidence}
                  </div>
                </div>

                <div className="row g-3 mb-4 small">
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded text-dark" style={{ borderLeft: "4px solid #10b981" }}>
                      <span className="font-bold text-success d-block mb-2">Positive Compliance Factors</span>
                      <ul className="ps-3 mb-0">
                        {selectedCustomer.positiveFactors.map((f, i) => (
                          <li key={i} className="mb-1">{f}</li>
                        ))}
                        {selectedCustomer.positiveFactors.length === 0 && <li>No notable positive scoring adjustments recorded.</li>}
                      </ul>
                    </div>
                  </div>
                  <div className="col-12 col-md-6">
                    <div className="p-3 bg-light rounded text-dark" style={{ borderLeft: "4px solid #ef4444" }}>
                      <span className="font-bold text-danger d-block mb-2">Negative Risk Factors</span>
                      <ul className="ps-3 mb-0">
                        {selectedCustomer.negativeFactors.map((f, i) => (
                          <li key={i} className="mb-1">{f}</li>
                        ))}
                        {selectedCustomer.negativeFactors.length === 0 && <li>No active negative risk markers found.</li>}
                      </ul>
                    </div>
                  </div>
                </div>

                <h6 className="font-bold border-bottom pb-1.5 mb-3">Financial Transaction Audit</h6>
                <div className="row g-3 text-start small">
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Outstanding Balance</div>
                    <div className="font-semibold text-danger">₹{selectedCustomer.outstandingBalance.toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Credit Limit</div>
                    <div className="font-semibold">₹{selectedCustomer.creditLimit.toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Available Credit</div>
                    <div className="font-semibold text-success">₹{selectedCustomer.availableCredit.toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Total Purchases</div>
                    <div className="font-semibold">₹{selectedCustomer.totalPurchases.toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Completed Invoices</div>
                    <div className="font-semibold">{selectedCustomer.completedOrders} Orders</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Avg Invoice Value</div>
                    <div className="font-semibold">₹{selectedCustomer.averageInvoiceValue.toLocaleString()}</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Average Payment Delay</div>
                    <div className="font-semibold text-warning">{selectedCustomer.averagePaymentDelay} Days</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Cancelled Orders</div>
                    <div className="font-semibold">{selectedCustomer.cancelledOrders} Order(s)</div>
                  </div>
                  <div className="col-6 col-md-4">
                    <div className="text-secondary">Relation Volume</div>
                    <div className="font-semibold">{selectedCustomer.purchaseFrequency} Invoices</div>
                  </div>
                </div>
              </div>
              <div className="modal-footer border-top-0 pt-0">
                <button type="button" className="btn btn-secondary w-100" onClick={() => setSelectedCustomer(null)}>
                  Close Audit Details
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
}

export default CreditRiskDashboard;
