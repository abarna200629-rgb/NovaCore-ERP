import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaChartLine, FaArrowAltCircleUp, FaMoneyBillWave } from "react-icons/fa";

function Revenue() {
  const [incomes, setIncomes] = useState([]);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [salesRevenue, setSalesRevenue] = useState(0);
  const [servicesRevenue, setServicesRevenue] = useState(0);

  const BASE_URL = API_BASE_URL + "/api/finance/records";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadRevenueData();
  }, []);

  const loadRevenueData = async () => {
    try {
      const response = await axios.get(BASE_URL, getConfig());
      const allRecords = response.data;
      const incomeRecords = allRecords.filter(r => r.type === "INCOME");
      setIncomes(incomeRecords);

      let total = 0;
      let sales = 0;
      let services = 0;

      incomeRecords.forEach(r => {
        total += r.amount;
        if (r.category === "Sales Revenue") {
          sales += r.amount;
        } else if (r.category === "Services") {
          services += r.amount;
        }
      });

      setTotalRevenue(total);
      setSalesRevenue(sales);
      setServicesRevenue(services);
    } catch (err) {
      console.error("Error loading revenue:", err);
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Revenue streams</h3>

        {/* KPI Cards */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaMoneyBillWave className="text-success mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Total Operating Revenue</h6>
              <h2 className="font-bold text-success">₹{totalRevenue.toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaArrowAltCircleUp className="text-primary mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Product Sales Inflow</h6>
              <h2 className="font-bold text-primary">₹{salesRevenue.toLocaleString()}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaChartLine className="text-info mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Services & Other Inflow</h6>
              <h2 className="font-bold text-info">₹{servicesRevenue.toLocaleString()}</h2>
            </div>
          </div>
        </div>

        {/* Revenue Ledger */}
        <div className="card glass-panel p-4">
          <h5 className="font-bold mb-3">Itemized Revenue Ledger</h5>
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Log ID</th>
                  <th>Source Category</th>
                  <th>Description</th>
                  <th>Transaction Date</th>
                  <th>Inflow Amount</th>
                </tr>
              </thead>
              <tbody>
                {incomes.length > 0 ? (
                  incomes.map((inc) => (
                    <tr key={inc.id}>
                      <td>TX-{6000 + inc.id}</td>
                      <td>
                        <span className="badge bg-success text-white">{inc.category}</span>
                      </td>
                      <td>{inc.description}</td>
                      <td>{inc.date}</td>
                      <td className="font-bold text-success">+₹{(inc.amount || 0).toLocaleString()}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center py-4 text-secondary">No revenue items logged.</td>
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

export default Revenue;