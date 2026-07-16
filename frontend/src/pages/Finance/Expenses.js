import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaArrowAltCircleDown, FaFileInvoiceDollar, FaRegCreditCard } from "react-icons/fa";

function Expenses() {
  const [expenses, setExpenses] = useState([]);
  const [totalCost, setTotalCost] = useState(0);
  const [salaryCosts, setSalaryCosts] = useState(0);
  const [materialCosts, setMaterialCosts] = useState(0);

  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/records";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadExpensesData();
  }, []);

  const loadExpensesData = async () => {
    try {
      const response = await axios.get(BASE_URL, getConfig());
      const allRecords = response.data;
      const expenseRecords = allRecords.filter(r => r.type === "EXPENSE");
      setExpenses(expenseRecords);

      let total = 0;
      let salaries = 0;
      let materials = 0;

      expenseRecords.forEach(r => {
        total += r.amount;
        if (r.category === "Salary") {
          salaries += r.amount;
        } else if (r.category === "Materials") {
          materials += r.amount;
        }
      });

      setTotalCost(total);
      setSalaryCosts(salaries);
      setMaterialCosts(materials);
    } catch (err) {
      console.error("Error loading expenses:", err);
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Expense Monitoring</h3>

        {/* KPI Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaArrowAltCircleDown className="text-danger mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Total Costs Logged</h6>
              <h2 className="font-bold text-danger">₹{totalCost.toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaRegCreditCard className="text-primary mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Salary Payouts</h6>
              <h2 className="font-bold text-primary">₹{salaryCosts.toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaFileInvoiceDollar className="text-warning mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Material Procurement</h6>
              <h2 className="font-bold text-warning">₹{materialCosts.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Expenses Ledger */}
        <div className="card glass-panel p-4">
          <h5 className="font-bold mb-3">Itemized Debit Ledger</h5>
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Category</th>
                  <th>Description</th>
                  <th>Transaction Date</th>
                  <th>Debit Amount</th>
                </tr>
              </thead>
              <tbody>
                {expenses.length > 0 ? (
                  expenses.map((exp) => (
                    <tr key={exp.id}>
                      <td>TX-{7000 + exp.id}</td>
                      <td>
                        <span className="badge bg-danger text-white">{exp.category}</span>
                      </td>
                      <td>{exp.description}</td>
                      <td>{exp.date}</td>
                      <td className="font-bold text-danger">-₹{(exp.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-secondary">No expense items logged.</td>
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

export default Expenses;