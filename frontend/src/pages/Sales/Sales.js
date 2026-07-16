import { useEffect, useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import axios from "axios";
import { FaShoppingCart, FaUserTie, FaUserCheck, FaPlusCircle } from "react-icons/fa";

function Sales() {
  const [sales, setSales] = useState([]);
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [productId, setProductId] = useState("");
  const [quantity, setQuantity] = useState("");
  const [amount, setAmount] = useState(0);
  const [selectedCustomerRisk, setSelectedCustomerRisk] = useState(null);
  const [overrideWarning, setOverrideWarning] = useState(false);

  // Customer register states
  const [custName, setCustName] = useState("");
  const [custEmail, setCustEmail] = useState("");
  const [custPhone, setCustPhone] = useState("");
  const [custAddress, setCustAddress] = useState("");

  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/sales";
  const EMP_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employees";
  const INV_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadSalesData();
  }, []);

  useEffect(() => {
    const prod = products.find(p => p.id === Number(productId));
    if (prod && quantity) {
      const subtotal = prod.sellingPrice * Number(quantity);
      const tax = subtotal * (prod.gst / 100.0);
      setAmount(subtotal + tax);
    } else {
      setAmount(0);
    }
  }, [productId, quantity, products]);

  const loadSalesData = async () => {
    try {
      const salesRes = await axios.get(`${BASE_URL}/orders`, getConfig());
      setSales(salesRes.data);

      const prodRes = await axios.get(`${INV_URL}/products`, getConfig());
      setProducts(prodRes.data);
      if (prodRes.data.length > 0) {
        setProductId(prodRes.data[0].id.toString());
      }

      const custRes = await axios.get(`${BASE_URL}/customers`, getConfig());
      setCustomers(custRes.data);
      if (custRes.data.length > 0) {
        setCustomerId(custRes.data[0].id.toString());
        setCustomerName(custRes.data[0].customerName || "");
      }

      const empRes = await axios.get(EMP_URL, getConfig());
      setEmployees(empRes.data);
      if (empRes.data.length > 0) {
        setEmployeeId(empRes.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchCustomerRisk = async (id) => {
    if (!id) return;
    try {
      const response = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/finance/credit-risk/" + id, getConfig());
      setSelectedCustomerRisk(response.data);
      setOverrideWarning(false);
    } catch (err) {
      console.log("Error loading customer credit risk:", err);
      setSelectedCustomerRisk(null);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchCustomerRisk(customerId);
    }
  }, [customerId]);

  const addCustomer = async () => {
    if (!custName || !custEmail || !custPhone) {
      alert("Please fill in customer name, email, and phone!");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/customers`, {
        customerName: custName,
        email: custEmail,
        phone: custPhone,
        address: custAddress
      }, getConfig());
      alert("Customer registered successfully");
      setCustName("");
      setCustEmail("");
      setCustPhone("");
      setCustAddress("");
      loadSalesData();
    } catch (err) {
      console.error(err);
    }
  };

  const placeSalesOrder = async () => {
    if (!employeeId || !customerId || !productId || !quantity) {
      alert("Please select a customer and fill in all order details!");
      return;
    }

    if (selectedCustomerRisk && (selectedCustomerRisk.riskLevel === "HIGH RISK" || selectedCustomerRisk.riskLevel === "CRITICAL RISK")) {
      if (!overrideWarning) {
        alert(`⚠ Customer Credit Risk is ${selectedCustomerRisk.riskLevel}.\n\nOutstanding Amount: ₹${selectedCustomerRisk.outstandingBalance.toLocaleString()}\nPayment Delay: ${selectedCustomerRisk.averagePaymentDelay} Days\n\nRecommendation:\n${selectedCustomerRisk.aiRecommendation}\n\nOnly Admin/Finance users can override this warning.`);
        return;
      }
      const role = localStorage.getItem("role") || "EMPLOYEE";
      const cleanRole = role.trim().toUpperCase().replace("ROLE_", "");
      if (cleanRole !== "ADMIN" && cleanRole !== "FINANCE") {
        alert("Access Denied: Only Admin or Finance role can override credit risk blocks!");
        return;
      }
    }

    const matchedProd = products.find(p => p.id === Number(productId));
    const payload = {
      customerId: Number(customerId),
      customerName,
      employeeId: Number(employeeId),
      productId: Number(productId),
      productName: matchedProd ? matchedProd.name : "",
      quantity: Number(quantity),
      totalAmount: amount
    };

    try {
      await axios.post(`${BASE_URL}/orders`, payload, getConfig());
      alert("Sales Order placed successfully! Stock and targets updated.");
      setQuantity("");
      loadSalesData();
    } catch (err) {
      alert(err.response?.data?.message || err.response?.data || "Failed to place sales order");
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : `Employee ID: ${empId}`;
  };

  const getProdName = (prodId) => {
    const prod = products.find(p => p.id === prodId);
    return prod ? prod.name : `Product ID: ${prodId}`;
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Sales & Billing Center</h3>

        <div className="row">
          {/* Order Placement Form */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4 mb-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaShoppingCart /> Place Sales Order
              </h5>

              <div className="mb-3">
                <label className="form-label font-semibold">Which Employee Sold?</label>
                <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.empCode})</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Select Customer</label>
                <select className="form-select" value={customerId} onChange={(e) => {
                  const selectedId = e.target.value;
                  setCustomerId(selectedId);
                  const selectedCust = customers.find(c => c.id === Number(selectedId));
                  setCustomerName(selectedCust ? selectedCust.customerName : "");
                }}>
                  {customers.map(cust => (
                    <option key={cust.id} value={cust.id}>{cust.customerName}</option>
                  ))}
                </select>
                {selectedCustomerRisk && (
                  <div className="mt-2 p-2 rounded small" style={{
                    backgroundColor: "rgba(15, 23, 42, 0.03)",
                    borderLeft: `4px solid ${
                      selectedCustomerRisk.riskLevel === "LOW RISK" ? "#10b981" :
                      selectedCustomerRisk.riskLevel === "MEDIUM RISK" ? "#3b82f6" :
                      selectedCustomerRisk.riskLevel === "HIGH RISK" ? "#f59e0b" : "#ef4444"
                    }`
                  }}>
                    <div className="d-flex justify-content-between align-items-center">
                      <span><strong>AI Credit Score:</strong> {selectedCustomerRisk.creditScore}</span>
                      <span className={`badge ${
                        selectedCustomerRisk.riskLevel === "LOW RISK" ? "bg-success text-white" :
                        selectedCustomerRisk.riskLevel === "MEDIUM RISK" ? "bg-info text-white" :
                        selectedCustomerRisk.riskLevel === "HIGH RISK" ? "bg-warning text-dark" : "bg-danger text-white"
                      }`} style={{ fontSize: "9px" }}>{selectedCustomerRisk.riskLevel}</span>
                    </div>
                    <div className="text-secondary mt-1" style={{ fontSize: "10.5px" }}>
                      Limit: ₹{selectedCustomerRisk.creditLimit.toLocaleString()} | Available: ₹{selectedCustomerRisk.availableCredit.toLocaleString()}
                    </div>
                    {(selectedCustomerRisk.riskLevel === "HIGH RISK" || selectedCustomerRisk.riskLevel === "CRITICAL RISK") && (
                      <div className="form-check mt-1.5 d-flex align-items-center gap-1.5">
                        <input
                          type="checkbox"
                          className="form-check-input m-0"
                          id="overrideCheck"
                          checked={overrideWarning}
                          onChange={(e) => setOverrideWarning(e.target.checked)}
                          style={{ cursor: "pointer" }}
                        />
                        <label className="form-check-label text-danger font-semibold" htmlFor="overrideCheck" style={{ fontSize: "10px", cursor: "pointer", userSelect: "none" }}>
                          Override Credit Warning (Admin/Finance only)
                        </label>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Select Product</label>
                <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label font-semibold">Quantity</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 2"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label font-semibold text-secondary">Total (Inc. GST)</label>
                  <input
                    type="text"
                    className="form-control font-bold text-success"
                    value={`₹${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    readOnly
                  />
                </div>
              </div>

              <button className="btn btn-success w-100" onClick={placeSalesOrder}>
                Authorize Invoice & Sell
              </button>
            </div>

            {/* Register Customer Form */}
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaPlusCircle /> Register Customer Account
              </h5>
              <div className="mb-2">
                <label className="form-label font-semibold">Account Name</label>
                <input type="text" className="form-control py-1" placeholder="Company or Individual" value={custName} onChange={(e) => setCustName(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="form-label font-semibold">Email</label>
                <input type="email" className="form-control py-1" placeholder="client@domain.com" value={custEmail} onChange={(e) => setCustEmail(e.target.value)} />
              </div>
              <div className="mb-2">
                <label className="form-label font-semibold">Phone</label>
                <input type="text" className="form-control py-1" placeholder="Contact number" value={custPhone} onChange={(e) => setCustPhone(e.target.value)} />
              </div>
              <div className="mb-3">
                <label className="form-label font-semibold">Address</label>
                <input type="text" className="form-control py-1" placeholder="Billing Address" value={custAddress} onChange={(e) => setCustAddress(e.target.value)} />
              </div>
              <button className="btn btn-outline-primary w-100" onClick={addCustomer}>
                Register Account
              </button>
            </div>
          </div>

          {/* Sales History Board */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaUserTie /> Corporate Sales Ledger
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Invoice ID</th>
                      <th>Customer Name</th>
                      <th>Sales Executive Name</th>
                      <th>Employee ID</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Total Amount</th>
                      <th>Date</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.length > 0 ? (
                      sales.map(sale => (
                        <tr key={sale.id}>
                          <td>INV-ORD{1000 + sale.id}</td>
                          <td>{sale.customerName}</td>
                          <td>
                            <div className="font-semibold text-primary">{getEmpName(sale.employeeId)}</div>
                          </td>
                          <td>{sale.employeeId}</td>
                          <td>{sale.productName || getProdName(sale.productId)}</td>
                          <td>{sale.quantity} Units</td>
                          <td>
                            <strong className="text-success" style={{ fontSize: "14.5px" }}>
                              ₹{sale.totalAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </strong>
                          </td>
                          <td>{sale.orderDate || "N/A"}</td>
                          <td>
                            <span className="badge bg-success">{sale.status || "PAID"}</span>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="9" className="text-center py-4 text-secondary">No invoices filed in current period.</td>
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

export default Sales;