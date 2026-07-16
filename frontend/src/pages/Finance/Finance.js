import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaBrain } from "react-icons/fa";

function Finance() {

  const [incomeList, setIncomeList] = useState([]);
  const [expenseList, setExpenseList] = useState([]);
  const [incomeSource, setIncomeSource] = useState("");
  const [incomeAmount, setIncomeAmount] = useState("");
  const [expenseName, setExpenseName] = useState("");
  const [expenseAmount, setExpenseAmount] = useState("");
  const [recs, setRecs] = useState([]);

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: {
        Authorization: `Bearer ${token}`
      }
    };
  };

  const loadFinanceData = async () => {
    try {
      const incomeResponse = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/income", getConfig());
      const expenseResponse = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/expenses", getConfig());
      
      setIncomeList(incomeResponse.data);
      setExpenseList(expenseResponse.data);

      try {
        const recsRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/ai/recommendations", getConfig());
        setRecs(recsRes.data);
      } catch (err) {
        console.log("Error loading AI recommendations:", err);
      }

    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    loadFinanceData();
  }, []);

  const addIncome = async () => {

    try {

      await axios.post(
        (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/income",
        {
          incomeSource,
          amount: incomeAmount,
          incomeDate:
            new Date()
              .toISOString()
              .split("T")[0]
        },
        getConfig()
      );

      setIncomeSource("");
      setIncomeAmount("");

      loadFinanceData();

      alert(
        "Income Added Successfully"
      );

    } catch (error) {

      console.log(error);

    }
  };

  const addExpense = async () => {

    try {

      await axios.post(
        (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/expenses",
        {
          expenseName,
          amount: expenseAmount,
          expenseDate:
            new Date()
              .toISOString()
              .split("T")[0]
        },
        getConfig()
      );

      setExpenseName("");
      setExpenseAmount("");

      loadFinanceData();

      alert(
        "Expense Added Successfully"
      );

    } catch (error) {

      console.log(error);

    }
  };

  const totalIncome =
    incomeList.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  const totalExpense =
    expenseList.reduce(
      (sum, item) =>
        sum + item.amount,
      0
    );

  const balance =
    totalIncome -
    totalExpense;

  return (

    <MainLayout>

      <div className="container-fluid">

        <div className="row mb-4">

          <div className="col-md-4">

            <div className="card bg-success text-white">

              <div className="card-body">

                <h5>Total Income</h5>

                <h3>
                  ₹{totalIncome}
                </h3>

              </div>

            </div>

          </div>

          <div className="col-md-4">

            <div className="card bg-danger text-white">

              <div className="card-body">

                <h5>Total Expense</h5>

                <h3>
                  ₹{totalExpense}
                </h3>

              </div>

            </div>

          </div>

          <div className="col-md-4">

            <div className="card bg-primary text-white">

              <div className="card-body">

                <h5>Balance</h5>

                <h3>
                  ₹{balance}
                </h3>

              </div>

            </div>

          </div>

        </div>

        {/* AI Financial Insights Panel */}
        <div className="card border-0 shadow-sm p-4 mb-4" style={{ borderRadius: "16px", background: "linear-gradient(135deg, rgba(59, 130, 246, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)", border: "1px solid rgba(59, 130, 246, 0.15)" }}>
          <h5 className="font-bold text-primary mb-3 d-flex align-items-center gap-2">
            <FaBrain /> AI Financial Insights <span className="badge bg-primary-soft text-primary small font-bold px-2 py-0.5" style={{ fontSize: "10px" }}>AI Generated</span>
          </h5>
          <div className="row">
            <div className="col-md-6 mb-3 mb-md-0">
              <h6 className="font-semibold text-secondary mb-2" style={{ fontSize: "13px" }}>Trend Analysis:</h6>
              <div className="d-flex align-items-center gap-3">
                <div className={`p-2 rounded-circle d-flex align-items-center justify-content-center`} style={{ width: "40px", height: "40px", background: balance >= 0 ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)", color: balance >= 0 ? "#10b981" : "#ef4444" }}>
                  {balance >= 0 ? "▲" : "▼"}
                </div>
                <div>
                  <h6 className="font-bold m-0" style={{ color: balance >= 0 ? "#10b981" : "#ef4444" }}>
                    {balance >= 0 ? "Positive Cash Flow Trend" : "Negative Cash Flow Risk"}
                  </h6>
                  <p className="small text-secondary m-0">Net margin is {totalIncome > 0 ? ((balance / totalIncome) * 100).toFixed(1) : 0}% of gross revenue.</p>
                </div>
              </div>
            </div>
            <div className="col-md-6">
              <h6 className="font-semibold text-secondary mb-2" style={{ fontSize: "13px" }}>AI Recommendations:</h6>
              <ul className="m-0 p-0" style={{ listStyle: "none" }}>
                {recs.map((rec, idx) => (
                  <li key={idx} className="small text-dark mb-2 d-flex align-items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>{rec}</span>
                  </li>
                ))}
                {recs.length === 0 && (
                  <li className="small text-dark mb-2 d-flex align-items-start gap-2">
                    <span className="text-primary font-bold">•</span>
                    <span>Optimize operational expenses and inventory turns to free up cash.</span>
                  </li>
                )}
              </ul>
            </div>
          </div>
        </div>

        <div className="card shadow p-4 mb-4">

          <h3>Add Income</h3>

          <div className="row">

            <div className="col-md-5">

              <input
                className="form-control"
                placeholder="Income Source"
                value={incomeSource}
                onChange={(e) =>
                  setIncomeSource(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="col-md-5">

              <input
                type="number"
                className="form-control"
                placeholder="Amount"
                value={incomeAmount}
                onChange={(e) =>
                  setIncomeAmount(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="col-md-2">

              <button
                className="btn btn-success w-100"
                onClick={addIncome}
              >
                Add
              </button>

            </div>

          </div>

        </div>

        <div className="card shadow p-4 mb-4">

          <h3>Add Expense</h3>

          <div className="row">

            <div className="col-md-5">

              <input
                className="form-control"
                placeholder="Expense Name"
                value={expenseName}
                onChange={(e) =>
                  setExpenseName(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="col-md-5">

              <input
                type="number"
                className="form-control"
                placeholder="Amount"
                value={expenseAmount}
                onChange={(e) =>
                  setExpenseAmount(
                    e.target.value
                  )
                }
              />

            </div>

            <div className="col-md-2">

              <button
                className="btn btn-danger w-100"
                onClick={addExpense}
              >
                Add
              </button>

            </div>

          </div>

        </div>

        <div className="card shadow p-4">

          <h3>Income Records</h3>

          <table className="table table-bordered">

            <thead>

              <tr>

                <th>ID</th>
                <th>Source</th>
                <th>Amount</th>

              </tr>

            </thead>

            <tbody>

              {incomeList.map(
                (income) => (

                  <tr
                    key={income.id}
                  >

                    <td>
                      {income.id}
                    </td>

                    <td>
                      {income.incomeSource}
                    </td>

                    <td>
                      ₹{income.amount}
                    </td>

                  </tr>

                )
              )}

            </tbody>

          </table>

        </div>

      </div>

    </MainLayout>

  );
}

export default Finance;