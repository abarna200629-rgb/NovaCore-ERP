import { API_BASE_URL } from "../../config";
import React, { useState, useEffect } from "react";
import MainLayout from "../../layouts/MainLayout";
import axios from "axios";

function StockIn() {
  const [history, setHistory] = useState([]);
  const [formData, setFormData] = useState({
    productName: "",
    quantity: "",
    supplier: "",
    notes: ""
  });

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      const response = await axios.get(API_BASE_URL + "/api/inventory/products", getConfig());
      const mockHistory = (response.data || []).slice(0, 5).map((p, idx) => ({
        id: 1000 + idx,
        date: new Date().toISOString().split("T")[0],
        productName: p.name || p.productName,
        quantity: p.stock > 10 ? 10 : p.stock,
        supplier: "Global Materials Corp",
        status: "RECEIVED"
      }));
      setHistory(mockHistory);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.productName || !formData.quantity) {
      alert("Please fill all required fields");
      return;
    }
    const newTx = {
      id: 1000 + history.length,
      date: new Date().toISOString().split("T")[0],
      productName: formData.productName,
      quantity: parseInt(formData.quantity),
      supplier: formData.supplier || "Internal Transfer",
      status: "RECEIVED"
    };
    setHistory([newTx, ...history]);
    alert("Goods receipt logged successfully!");
    setFormData({ productName: "", quantity: "", supplier: "", notes: "" });
  };

  return (
    <MainLayout>
      <div className="container-fluid py-4">
        <h4 className="font-bold text-primary mb-4">Stock In (Goods Receipt)</h4>
        
        <div className="row g-4">
          <div className="col-lg-5">
            <div className="card border-0 p-4 shadow-sm" style={{ borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
              <h5 className="font-bold text-dark mb-3">Record Goods Receipt</h5>
              <form onSubmit={handleSubmit} className="row g-3">
                <div className="col-12">
                  <label className="form-label small font-semibold">Product Name</label>
                  <input
                    type="text"
                    className="form-control text-secondary small"
                    value={formData.productName}
                    onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                    placeholder="e.g. Iron Rods"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small font-semibold">Quantity</label>
                  <input
                    type="number"
                    className="form-control text-secondary small"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    placeholder="Units"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label small font-semibold">Supplier</label>
                  <input
                    type="text"
                    className="form-control text-secondary small"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                    placeholder="Supplier Name"
                  />
                </div>
                <div className="col-12">
                  <label className="form-label small font-semibold">Notes / Reference</label>
                  <textarea
                    className="form-control text-secondary small"
                    rows="2"
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="PO number or quality remarks..."
                  ></textarea>
                </div>
                <div className="col-12">
                  <button type="submit" className="btn btn-primary w-100 font-bold py-2">
                    Verify & Log Stock In
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="col-lg-7">
            <div className="card border-0 p-4 shadow-sm" style={{ borderRadius: "14px", background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
              <h5 className="font-bold text-dark mb-3">Stock In History</h5>
              <div className="table-responsive">
                <table className="table table-hover align-middle text-secondary small">
                  <thead>
                    <tr>
                      <th>TX ID</th>
                      <th>Date</th>
                      <th>Product</th>
                      <th>Quantity</th>
                      <th>Supplier</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((tx) => (
                      <tr key={tx.id}>
                        <td className="font-bold">#IN-{tx.id}</td>
                        <td>{tx.date}</td>
                        <td className="font-semibold text-dark">{tx.productName}</td>
                        <td className="font-bold text-success">+{tx.quantity}</td>
                        <td>{tx.supplier}</td>
                        <td>
                          <span className="badge bg-success-soft text-success">{tx.status}</span>
                        </td>
                      </tr>
                    ))}
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

export default StockIn;
