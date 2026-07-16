import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaPercent, FaBalanceScale, FaFileInvoice } from "react-icons/fa";

function TaxReports() {
  const [sales, setSales] = useState([]);
  const [purchases, setPurchases] = useState([]);
  
  const [totalOutputGst, setTotalOutputGst] = useState(0);
  const [totalInputCredit, setTotalInputCredit] = useState(0);

  const SALES_URL = API_BASE_URL + "/api/sales/orders";
  const PUR_URL = API_BASE_URL + "/api/inventory/purchases";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadTaxData();
  }, []);

  const loadTaxData = async () => {
    try {
      const salesRes = await axios.get(SALES_URL, getConfig());
      setSales(salesRes.data);

      const purRes = await axios.get(PUR_URL, getConfig());
      const approvedPurchases = purRes.data.filter(p => p.status === "APPROVED");
      setPurchases(approvedPurchases);

      // Evaluate Output GST from sales (assuming 18% average or individual product GST)
      let outputGst = 0;
      salesRes.data.forEach(s => {
        // totalAmount = subtotal * (1 + gst/100) -> gstAmount = totalAmount - (totalAmount / (1 + gst/100))
        // For simplicity, we calculate 18% GST of order value
        outputGst += s.totalAmount * (18.0 / 118.0); 
      });

      // Evaluate Input Tax Credit (18% of purchase expense)
      let inputCredit = 0;
      approvedPurchases.forEach(p => {
        inputCredit += p.price * 0.18;
      });

      setTotalOutputGst(outputGst);
      setTotalInputCredit(inputCredit);
    } catch (err) {
      console.error("Error loading tax info:", err);
    }
  };

  const netTaxLiability = totalOutputGst - totalInputCredit;

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Tax Compliance Center</h3>

        {/* GST Summary */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaPercent className="text-danger mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Output GST Liability</h6>
              <h2 className="font-bold text-danger">₹{totalOutputGst.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaFileInvoice className="text-success mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Input Tax Credit (ITC)</h6>
              <h2 className="font-bold text-success">₹{totalInputCredit.toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card glass-panel p-4 text-center">
              <FaBalanceScale className="text-primary mx-auto mb-2" size={28} />
              <h6 className="font-semibold text-secondary">Net GST Payable</h6>
              <h2 className="font-bold text-primary">₹{Math.max(0, netTaxLiability).toLocaleString(undefined, { maximumFractionDigits: 2 })}</h2>
            </div>
          </div>
        </div>

        {/* GST Transactions Ledger */}
        <div className="card glass-panel p-4">
          <h5 className="font-bold mb-3">GST Invoice Audit Roll</h5>
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Invoice ID</th>
                  <th>Type</th>
                  <th>Client/Supplier</th>
                  <th>Taxable Amount</th>
                  <th>GST Rate</th>
                  <th>GST Allocated</th>
                </tr>
              </thead>
              <tbody>
                {sales.map((s) => (
                  <tr key={"sale-" + s.id}>
                    <td>INV-ORD{1000 + s.id}</td>
                    <td><span className="badge bg-danger text-white">OUTPUT</span></td>
                    <td>{s.customerName}</td>
                    <td>₹{(s.totalAmount / 1.18).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                    <td>18.0%</td>
                    <td className="text-danger">₹{(s.totalAmount * (18.0 / 118.0)).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
                {purchases.map((p) => (
                  <tr key={"pur-" + p.id}>
                    <td>PO-REQ{1000 + p.id}</td>
                    <td><span className="badge bg-success text-white">INPUT (ITC)</span></td>
                    <td>Apex Supplier</td>
                    <td>₹{p.price.toLocaleString()}</td>
                    <td>18.0%</td>
                    <td className="text-success">₹{(p.price * 0.18).toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default TaxReports;