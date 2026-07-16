import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

import {
  FaBrain,
  FaRobot,
  FaPaperPlane,
  FaUser,
  FaShieldAlt,
  FaChartLine,
  FaExclamationCircle,
  FaLightbulb,
  FaCalendarAlt
} from "react-icons/fa";

function AIHub() {
  const role = localStorage.getItem("role") ? localStorage.getItem("role").toUpperCase().replace("ROLE_", "") : "";
  const [salesForecast, setSalesForecast] = useState(null);
  const [expenseForecast, setExpenseForecast] = useState(null);
  const [inventoryForecast, setInventoryForecast] = useState([]);
  const [attendanceForecast, setAttendanceForecast] = useState(null);
  const [fraudAlerts, setFraudAlerts] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [meetingAgenda, setMeetingAgenda] = useState(null);

  // Chat states
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState([
    { sender: "ai", text: "Welcome to the ERP AI Decision Support Center. I can audit ledgers, forecast sales, and monitor stock levels. Ask me anything!" }
  ]);

  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadAIData();
  }, []);

  const loadAIData = async () => {
    try {
      if (role === "ADMIN" || role === "FINANCE" || role === "SALES") {
        const salesRes = await axios.get(`${BASE_URL}/forecasts/sales`, getConfig());
        setSalesForecast(salesRes.data);
      }

      if (role === "ADMIN" || role === "FINANCE") {
        const expRes = await axios.get(`${BASE_URL}/forecasts/expenses`, getConfig());
        setExpenseForecast(expRes.data);
      }

      if (role === "ADMIN" || role === "INVENTORY") {
        const invRes = await axios.get(`${BASE_URL}/forecasts/inventory`, getConfig());
        setInventoryForecast(invRes.data);
      }

      if (role === "ADMIN" || role === "HR") {
        const attRes = await axios.get(`${BASE_URL}/forecasts/attendance`, getConfig());
        setAttendanceForecast(attRes.data);
      }

      if (role === "ADMIN" || role === "FINANCE") {
        const fraudRes = await axios.get(`${BASE_URL}/fraud`, getConfig());
        setFraudAlerts(fraudRes.data);
      }

      if (role === "ADMIN") {
        const recsRes = await axios.get(`${BASE_URL}/recommendations`, getConfig());
        setRecommendations(recsRes.data);
      }

      if (role === "ADMIN") {
        const meetRes = await axios.get(`${BASE_URL}/meeting-agenda`, getConfig());
        setMeetingAgenda(meetRes.data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendChat = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatHistory(prev => [...prev, { sender: "user", text: userMsg }]);
    setChatInput("");

    try {
      const response = await axios.post(`${BASE_URL}/chat`, { message: userMsg }, getConfig());
      setChatHistory(prev => [...prev, { sender: "ai", text: response.data.response }]);
    } catch (err) {
      setChatHistory(prev => [...prev, { sender: "ai", text: "Apologies, I encountered an error retrieving that business metric." }]);
    }
  };

  // Forecast Chart Mappings
  const salesForecastData = salesForecast && salesForecast.forecastPoints
    ? salesForecast.forecastPoints.map(pt => ({ name: pt.date, sales: pt.sales }))
    : [];

  const expenseForecastData = expenseForecast && expenseForecast.forecastPoints
    ? expenseForecast.forecastPoints.map(pt => ({ name: pt.date, expense: pt.expense }))
    : [];

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold d-flex align-items-center gap-2">
          <FaBrain /> AI Cognitive Hub & Assistant
        </h3>

        <div className="row">
          {/* AI Forecasts Panel */}
          <div className="col-lg-8">
            <div className="row">
              {/* Sales Line Forecast */}
              {(role === "ADMIN" || role === "FINANCE" || role === "SALES") && (
                <div className="col-md-6 mb-4">
                  <div className="card glass-panel p-4 h-100">
                    <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                      <FaChartLine className="text-primary" /> AI Sales Forecast
                    </h5>
                    {salesForecast && (
                      salesForecast.error ? (
                        <div className="alert alert-warning py-2 mb-0" style={{ fontSize: "12.5px" }}>
                          {salesForecast.error}
                        </div>
                      ) : (
                        <>
                          <h2 className="font-bold text-primary mb-1">₹{salesForecast.expectedRevenue?.toLocaleString()}</h2>
                          <p className="text-secondary" style={{ fontSize: "13px" }}>
                            Expected Revenue (Next 7 Days) | Growth: <strong className={salesForecast.growthPct >= 0 ? "text-success" : "text-danger"}>{salesForecast.growthPct >= 0 ? "+" : ""}{salesForecast.growthPct}%</strong> (Confidence: {salesForecast.confidenceInterval})
                          </p>
                          <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={salesForecastData}>
                              <XAxis dataKey="name" stroke="var(--text-secondary)" />
                              <YAxis stroke="var(--text-secondary)" />
                              <Tooltip />
                              <Area type="monotone" dataKey="sales" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.15} />
                            </AreaChart>
                          </ResponsiveContainer>
                          <div className="p-3 rounded border bg-light mt-2" style={{ fontSize: "12.5px" }}>
                            <strong>AI Insight:</strong> {salesForecast.aiInsight}<br/>
                            <strong>Recommendation:</strong> {salesForecast.recommendation}
                          </div>
                        </>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* Expense Line Forecast */}
              {(role === "ADMIN" || role === "FINANCE") && (
                <div className="col-md-6 mb-4">
                  <div className="card glass-panel p-4 h-100">
                    <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                      <FaChartLine className="text-danger" /> AI Expense Forecast
                    </h5>
                    {expenseForecast && (
                      expenseForecast.error ? (
                        <div className="alert alert-warning py-2 mb-0" style={{ fontSize: "12.5px" }}>
                          {expenseForecast.error}
                        </div>
                      ) : (
                        <>
                          <h2 className="font-bold text-danger mb-1">₹{expenseForecast.expectedWeeklyExpense?.toLocaleString()}</h2>
                          <p className="text-secondary" style={{ fontSize: "13px" }}>
                            Expected Weekly Expense (Next 7 Days) | Status: <strong className="text-warning">{expenseForecast.budgetWarning}</strong>
                          </p>
                          <ResponsiveContainer width="100%" height={160}>
                            <AreaChart data={expenseForecastData}>
                              <XAxis dataKey="name" stroke="var(--text-secondary)" />
                              <YAxis stroke="var(--text-secondary)" />
                              <Tooltip />
                              <Area type="monotone" dataKey="expense" stroke="#ef4444" fill="#ef4444" fillOpacity={0.15} />
                            </AreaChart>
                          </ResponsiveContainer>
                          <div className="p-3 rounded border bg-light mt-2" style={{ fontSize: "12.5px" }}>
                            <strong>AI Insight:</strong> {expenseForecast.aiInsight}<br/>
                            <strong>Recommendation:</strong> {expenseForecast.recommendation}
                          </div>
                        </>
                      )
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="row">
              {/* Attendance Prediction */}
              {(role === "ADMIN" || role === "HR") && (
                <div className="col-md-6 mb-4">
                  <div className="card glass-panel p-4 h-100">
                    <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                      <FaBrain className="text-success" /> Attendance Rate Prediction
                    </h5>
                    {attendanceForecast && (
                      attendanceForecast.error ? (
                        <div className="alert alert-warning py-2 mb-0" style={{ fontSize: "12.5px" }}>
                          {attendanceForecast.error}
                        </div>
                      ) : (
                        <div>
                          <p className="text-secondary" style={{ fontSize: "13.5px" }}>
                            Predicted attendance rate tomorrow:
                          </p>
                          <h2 className="font-bold text-success mb-2">{attendanceForecast.predictedAttendanceRateTomorrow.toFixed(1)}%</h2>
                          <p className="text-secondary" style={{ fontSize: "13px" }}>
                            Expected Present: <strong>{attendanceForecast.expectedPresent}</strong> | Expected Absent: <strong>{attendanceForecast.expectedAbsent}</strong> | Trend: <strong className="text-primary">{attendanceForecast.trend}</strong>
                          </p>
                          <div className="p-3 rounded border bg-light mb-3" style={{ fontSize: "12.5px" }}>
                            <strong>AI Recommendation:</strong> {attendanceForecast.recommendation}
                          </div>
                          <h6 className="font-semibold text-secondary" style={{ fontSize: "12px" }}>Influencing Analytics Factors:</h6>
                          <ul className="text-secondary ps-3" style={{ fontSize: "12.5px" }}>
                            {attendanceForecast.factors.map((f, i) => (
                              <li key={i}>{f}</li>
                            ))}
                          </ul>
                        </div>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* AI Recommendations */}
              {role === "ADMIN" && (
                <div className="col-md-6 mb-4">
                  <div className="card glass-panel p-4 h-100">
                    <h5 className="font-bold mb-3 d-flex align-items-center gap-2 text-warning">
                      <FaLightbulb /> AI Strategic Recommendations
                    </h5>
                    <div className="d-flex flex-column gap-2" style={{ maxHeight: "280px", overflowY: "auto" }}>
                      {recommendations.map((rec, idx) => (
                        <div key={idx} className="p-3 rounded border border-light bg-light" style={{ fontSize: "13.5px" }}>
                          <strong>Recommendation #{idx + 1}:</strong> {rec}
                        </div>
                      ))}
                      {recommendations.length === 0 && (
                        <div className="text-center text-secondary py-2">No recommendations currently generated.</div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* AI Meeting Agenda Generator */}
            {role === "ADMIN" && meetingAgenda && (
              <div className="card glass-panel p-4 mb-4">
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2 text-info">
                  <FaCalendarAlt /> AI Meeting Agenda Generator
                </h5>
                <div className="p-3 rounded border" style={{ background: "rgba(0,0,0,0.01)" }}>
                  <h6 className="font-bold text-primary mb-1">{meetingAgenda.title}</h6>
                  <p className="text-secondary mb-3" style={{ fontSize: "12px" }}>Scheduled Target Alignment: {meetingAgenda.date}</p>
                  <ul className="list-unstyled d-flex flex-column gap-2 m-0" style={{ fontSize: "13px" }}>
                    {meetingAgenda.agenda.map((item, i) => (
                      <li key={i} className="d-flex gap-2 align-items-start">
                        <span className="text-primary">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Inventory Depletion & Stock Forecast */}
            {(role === "ADMIN" || role === "INVENTORY") && (
              <div className="card glass-panel p-4 mb-4">
                <h5 className="font-bold mb-3">AI Stock Depletion Predictor</h5>
                <div className="table-responsive">
                  <table className="table table-modern align-middle">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Current Stock</th>
                        <th>Avg Daily Sales</th>
                        <th>Reorder Qty</th>
                        <th>Suggested Supplier</th>
                        <th>Forecast Runout</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inventoryForecast.map((item, idx) => (
                        <tr key={idx}>
                          <td className="font-bold">{item.productName}</td>
                          <td>{item.currentStock} Units</td>
                          <td>{item.averageDailySales} Units/Day</td>
                          <td>{item.suggestedReorderQuantity} Units (by {item.suggestedReorderDate})</td>
                          <td>{item.recommendedSupplier}</td>
                          <td>
                            <span className={`badge-modern ${item.estimatedDaysRemaining <= 5 ? "bg-danger text-white" : item.estimatedDaysRemaining === 999 ? "bg-secondary text-white" : "bg-success text-white"}`}>
                              {item.estimatedDaysRemaining === 999 ? "Stable (No Depletion)" : `${item.estimatedDaysRemaining} Days (Low Stock: ${item.predictedLowStockDate})`}
                            </span>
                            <div className="text-secondary mt-1" style={{ fontSize: "11px" }}>
                              {item.recommendation}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Fraud Audit Detection */}
            {(role === "ADMIN" || role === "FINANCE") && (
              <div className="card glass-panel p-4 mb-4">
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                  <FaShieldAlt className="text-danger" /> Automated Fraud & Audit Scan
                </h5>
                {fraudAlerts.length > 0 ? (
                  fraudAlerts.map((alert, idx) => (
                    <div key={idx} className="alert alert-danger d-flex align-items-center gap-3 p-3 rounded" style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
                      <FaExclamationCircle size={22} className="text-danger" />
                      <div>
                        <h6 className="font-bold text-danger m-0">{alert.type}</h6>
                        <p className="m-0 text-primary" style={{ fontSize: "13px" }}>{alert.details} Logged Date: {alert.date}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center text-success py-3">No suspicious activity detected in financial ledgers.</div>
                )}
              </div>
            )}
          </div>

          {/* AI Decision Support Chat Assistant */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4 d-flex flex-column h-100" style={{ minHeight: "520px" }}>
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaRobot /> ERP Intelligent Assistant
              </h5>
              <div className="flex-grow-1 p-2 rounded mb-3" style={{ background: "rgba(0,0,0,0.02)", overflowY: "auto", maxHeight: "380px" }}>
                {chatHistory.map((chat, idx) => (
                  <div key={idx} className={`d-flex mb-3 ${chat.sender === "user" ? "justify-content-end" : "justify-content-start"}`}>
                    <div className="d-flex gap-2 max-w-75">
                      {chat.sender === "ai" && <FaRobot size={18} className="text-primary mt-1" />}
                      <div className="p-3 rounded" style={{
                        background: chat.sender === "user" ? "var(--accent)" : "var(--bg-card)",
                        color: chat.sender === "user" ? "white" : "var(--text-primary)",
                        borderRadius: "12px",
                        fontSize: "13px",
                        border: chat.sender === "ai" ? "1px solid var(--border-card)" : "none"
                      }}>
                        {chat.text}
                      </div>
                      {chat.sender === "user" && <FaUser size={18} className="text-secondary mt-1" />}
                    </div>
                  </div>
                ))}
              </div>
              <div className="d-flex gap-2">
                <input
                  type="text"
                  className="form-control"
                  placeholder="Ask about profit, headcount, inventory..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSendChat()}
                />
                <button className="btn btn-primary" onClick={handleSendChat}>
                  <FaPaperPlane />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default AIHub;
