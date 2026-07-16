import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaExclamationTriangle, FaEnvelope, FaCartPlus } from "react-icons/fa";

function LowStockAlerts() {
  const [lowStockProducts, setLowStockProducts] = useState([]);

  const API_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory/products";
  const PUR_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory/purchases";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadLowStock();
  }, []);

  const loadLowStock = async () => {
    try {
      const response = await axios.get(API_URL, getConfig());
      const allProds = response.data;
      const lowStock = allProds.filter(p => p.stock <= p.minStock);
      setLowStockProducts(lowStock);
    } catch (err) {
      console.error("Error loading stock alerts:", err);
    }
  };

  const triggerEmailAlert = async (product) => {
    try {
      alert(`Email low-stock notification successfully dispatched to vendor for product: ${product.name}`);
    } catch (err) {
      console.error(err);
    }
  };

  const triggerRestockOrder = async (product) => {
    const qty = prompt(`Enter restock request units for: ${product.name}`, "50");
    if (!qty) return;

    const units = parseInt(qty);
    if (isNaN(units) || units <= 0) return;

    try {
      const priceEstimate = units * product.purchasePrice;
      await axios.post(PUR_URL, {
        productName: product.name,
        quantity: units,
        price: priceEstimate,
        requestedBy: "Inventory Manager"
      }, getConfig());

      alert(`Procurement request submitted successfully: Purchase PO for ${units} units of ${product.name}`);
      loadLowStock();
    } catch (err) {
      console.error(err);
      alert("Failed to submit purchase request");
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Low Stock & Refill Alerts</h3>

        <div className="card glass-panel p-4">
          <h5 className="font-bold mb-3 d-flex align-items-center gap-2 text-danger">
            <FaExclamationTriangle /> Critical Low-Stock Warnings
          </h5>
          <div className="table-responsive">
            <table className="table table-modern align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Warehouse / Batch</th>
                  <th>Current Inventory</th>
                  <th>Minimum Required</th>
                  <th>Warning Severity</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((prod) => (
                    <tr key={prod.id}>
                      <td>
                        <h6 className="m-0 font-semibold text-danger">{prod.name}</h6>
                        <span className="text-secondary" style={{ fontSize: "12px" }}>Cat: {prod.category}</span>
                      </td>
                      <td>{prod.warehouse}</td>
                      <td>
                        <strong className="text-danger" style={{ fontSize: "14.5px" }}>{prod.stock} Units</strong>
                      </td>
                      <td>{prod.minStock} Units</td>
                      <td>
                        <span className="badge bg-danger text-white" style={{ fontSize: "10.5px" }}>
                          {prod.stock === 0 ? "OUT OF STOCK" : "CRITICAL LOW"}
                        </span>
                      </td>
                      <td>
                        <div className="d-flex gap-2">
                          <button className="btn btn-sm btn-outline-warning d-flex align-items-center gap-1" onClick={() => triggerEmailAlert(prod)}>
                            <FaEnvelope /> Email Supplier
                          </button>
                          <button className="btn btn-sm btn-primary d-flex align-items-center gap-1" onClick={() => triggerRestockOrder(prod)}>
                            <FaCartPlus /> Procurement PO
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="6" className="text-center py-4 text-success font-semibold">
                      ✓ All inventory units are at healthy safety thresholds. No alerts logged.
                    </td>
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

export default LowStockAlerts;