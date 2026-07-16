import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaFileInvoiceDollar, FaRegChartBar, FaBalanceScale, FaPrint } from "react-icons/fa";

function ProfitLoss() {
  const [pnl, setPnl] = useState({ totalRevenue: 0, totalExpense: 0, netProfit: 0 });
  const [cashFlow, setCashFlow] = useState({ cashInflow: 0, cashOutflow: 0, netCashFlow: 0 });
  const [balanceSheet, setBalanceSheet] = useState({
    inventoryValue: 0, cashAsset: 0, accountsReceivable: 0, totalAssets: 0,
    accountsPayable: 0, equity: 0, totalLiabilitiesAndEquity: 0
  });

  const BASE_URL = API_BASE_URL + "/api/finance/reports";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      const pnlRes = await axios.get(`${BASE_URL}/profit-loss`, getConfig());
      setPnl(pnlRes.data);

      const cfRes = await axios.get(`${BASE_URL}/cash-flow`, getConfig());
      setCashFlow(cfRes.data);

      const bsRes = await axios.get(`${BASE_URL}/balance-sheet`, getConfig());
      setBalanceSheet(bsRes.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h3 className="text-primary font-bold m-0">Corporate Financial Statements</h3>
          <button className="btn btn-outline-primary d-flex align-items-center gap-2" onClick={handlePrint}>
            <FaPrint /> Print Report
          </button>
        </div>

        <div className="row">
          {/* Profit & Loss Statement */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-4 d-flex align-items-center gap-2 text-primary">
                <FaRegChartBar /> Profit & Loss Statement
              </h5>
              
              <div className="p-3 rounded mb-3" style={{ background: "rgba(0,0,0,0.01)" }}>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span className="font-semibold text-secondary">Total Operating Revenue</span>
                  <span className="font-bold text-success">₹{(pnl.totalRevenue || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span className="font-semibold text-secondary">Operating Cost / Expenses</span>
                  <span className="font-bold text-danger">-₹{(pnl.totalExpense || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between pt-2">
                  <span className="font-bold text-primary">NET PROFIT</span>
                  <span className={`font-bold ${(pnl.netProfit || 0) >= 0 ? "text-success" : "text-danger"}`}>
                    ₹{(pnl.netProfit || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="text-secondary" style={{ fontSize: "12.5px" }}>
                * Net Profit is evaluated automatically from real-time sales invoices, material purchases, and employee salary payouts.
              </p>
            </div>
          </div>

          {/* Cash Flow Statement */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-4 d-flex align-items-center gap-2 text-primary">
                <FaFileInvoiceDollar /> Operating Cash Flow
              </h5>
              
              <div className="p-3 rounded mb-3" style={{ background: "rgba(0,0,0,0.01)" }}>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span className="font-semibold text-secondary">Cash Inflows</span>
                  <span className="font-bold text-success">₹{(cashFlow.cashInflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-2">
                  <span className="font-semibold text-secondary">Cash Outflows</span>
                  <span className="font-bold text-danger">-₹{(cashFlow.cashOutflow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="d-flex justify-content-between pt-2">
                  <span className="font-bold text-primary">NET CASH FLOW</span>
                  <span className="font-bold text-success">
                    ₹{(cashFlow.netCashFlow || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              <p className="text-secondary" style={{ fontSize: "12.5px" }}>
                * Cash Flow statement records actual cash transitions matching billing dates.
              </p>
            </div>
          </div>

          {/* Balance Sheet */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-4 d-flex align-items-center gap-2 text-primary">
                <FaBalanceScale /> Balance Sheet Summary
              </h5>
              
              <div className="p-3 rounded mb-3" style={{ background: "rgba(0,0,0,0.01)" }}>
                <h6 className="font-bold text-secondary mb-2" style={{ fontSize: "12px", textTransform: "uppercase" }}>Corporate Assets</h6>
                <div className="d-flex justify-content-between border-bottom pb-1 mb-1" style={{ fontSize: "13px" }}>
                  <span>Warehouse Inventory Value</span>
                  <span>₹{(balanceSheet.inventoryValue || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-1 mb-1" style={{ fontSize: "13px" }}>
                  <span>Cash & Equivalents</span>
                  <span>₹{(balanceSheet.cashAsset || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-1 mb-2" style={{ fontSize: "13px" }}>
                  <span>Accounts Receivable</span>
                  <span>₹{(balanceSheet.accountsReceivable || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-2 mb-3">
                  <span className="font-bold text-secondary">Total Assets</span>
                  <span className="font-bold text-primary">₹{(balanceSheet.totalAssets || 0).toLocaleString()}</span>
                </div>

                <h6 className="font-bold text-secondary mb-2" style={{ fontSize: "12px", textTransform: "uppercase" }}>Liabilities & Equity</h6>
                <div className="d-flex justify-content-between border-bottom pb-1 mb-1" style={{ fontSize: "13px" }}>
                  <span>Accounts Payable</span>
                  <span>₹{(balanceSheet.accountsPayable || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between border-bottom pb-1 mb-2" style={{ fontSize: "13px" }}>
                  <span>Owner's Equity</span>
                  <span>₹{(balanceSheet.equity || 0).toLocaleString()}</span>
                </div>
                <div className="d-flex justify-content-between pt-1">
                  <span className="font-bold text-secondary">Total Liab & Equity</span>
                  <span className="font-bold text-primary">₹{(balanceSheet.totalLiabilitiesAndEquity || 0).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default ProfitLoss;