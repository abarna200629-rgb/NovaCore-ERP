import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaWarehouse, FaHistory, FaExchangeAlt, FaInfoCircle, FaTimes } from "react-icons/fa";

function StockManagement() {
  const [products, setProducts] = useState([]);
  const [activeLogs, setActiveLogs] = useState(null); // Product whose logs are shown
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal States
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // Transfer Form States
  const [transferQty, setTransferQty] = useState("");
  const [destWarehouse, setDestWarehouse] = useState("Warehouse B");

  const API_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/inventory/products";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getConfig());
      setProducts(response.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const showLogs = async (product) => {
    try {
      // Use the correct backend REST endpoint for stock history mapping
      const response = await axios.get(`${API_URL}/${product.id}/stock-history`, getConfig());
      setLogs(response.data || []);
      setActiveLogs(product);
    } catch (err) {
      console.error(err);
    }
  };

  const handleTransferSubmit = async (e) => {
    e.preventDefault();
    if (!transferQty || parseInt(transferQty) <= 0) {
      alert("Please enter a valid transfer quantity.");
      return;
    }
    if (selectedProduct.stock < parseInt(transferQty)) {
      alert("Insufficient stock in source warehouse!");
      return;
    }
    if (selectedProduct.warehouse === destWarehouse) {
      alert("Source and destination warehouses must be different.");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/${selectedProduct.id}/transfer`,
        {
          destinationWarehouse: destWarehouse,
          quantity: parseInt(transferQty)
        },
        getConfig()
      );
      alert("Stock transferred successfully!");
      setIsTransferModalOpen(false);
      setTransferQty("");
      loadProducts();
      // Refresh active log panel if it's the current product
      if (activeLogs && activeLogs.id === selectedProduct.id) {
        showLogs(selectedProduct);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process stock transfer.");
    }
  };

  const openTransferModal = (prod) => {
    setSelectedProduct(prod);
    const firstDiffWarehouse = ["Warehouse A", "Warehouse B", "Warehouse C"].find(w => w !== prod.warehouse) || "Warehouse B";
    setDestWarehouse(firstDiffWarehouse);
    setTransferQty("");
    setIsTransferModalOpen(true);
  };

  const openDetailsModal = (prod) => {
    setSelectedProduct(prod);
    setIsDetailsModalOpen(true);
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex flex-column align-items-center justify-content-center py-5 h-100">
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
          <h5 className="font-semibold text-secondary">Loading Warehouse Operations...</h5>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        
        {/* Title Header */}
        <div className="mb-4">
          <h3 className="mb-1 text-primary font-bold"><FaWarehouse /> Warehouse Stock Operations</h3>
          <p className="text-secondary mb-0">Track real-time stock balances across warehouse nodes and manage stock transfers.</p>
        </div>

        <div className="row">
          
          {/* Left Panel: Warehouse Balances Grid */}
          <div className="col-lg-8 mb-4">
            <div className="card shadow-sm p-4 bg-white border-0">
              <h5 className="font-bold mb-4 text-dark d-flex align-items-center gap-2">
                <FaWarehouse className="text-primary" /> Warehouse Stock Balances
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle" style={{ fontSize: "14px" }}>
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th>Warehouse</th>
                      <th>Current Stock</th>
                      <th>Stock Status</th>
                      <th>Last Updated</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {products.length > 0 ? (
                      products.map((prod) => {
                        const isLow = (prod.stock || 0) <= (prod.minStock || 0);
                        const isOut = (prod.stock || 0) === 0;
                        
                        let statusLabel = "Healthy";
                        let statusColor = "success";
                        if (isOut) {
                          statusLabel = "Out of Stock";
                          statusColor = "danger";
                        } else if (isLow) {
                          statusLabel = "Low Stock";
                          statusColor = "warning text-dark";
                        }

                        // Last updated parsing
                        const lastUpdatedStr = prod.lastUpdated 
                          ? new Date(prod.lastUpdated).toLocaleString("en-IN") 
                          : "Not Available";

                        return (
                          <tr key={prod.id}>
                            <td>
                              <strong>{prod.name}</strong>
                              {prod.sku && <div className="small text-secondary">SKU: {prod.sku}</div>}
                              <div className="small text-secondary" style={{ fontSize: "11px" }}>Batch: {prod.batchNumber || "N/A"}</div>
                            </td>
                            <td>{prod.warehouse || "Warehouse A"}</td>
                            <td><strong>{prod.stock} Units</strong></td>
                            <td>
                              <span className={`badge bg-${statusColor}`} style={{ fontSize: "11px" }}>
                                {statusLabel}
                              </span>
                            </td>
                            <td><span className="small text-secondary">{lastUpdatedStr}</span></td>
                            <td>
                              <div className="d-flex gap-1.5 justify-content-end">
                                <button className="btn btn-xs btn-outline-info py-1 px-2.5" onClick={() => showLogs(prod)} title="View Logs">
                                  <FaHistory size={11} /> History
                                </button>
                                <button className="btn btn-xs btn-outline-primary py-1 px-2.5" onClick={() => openTransferModal(prod)} title="Transfer Stock">
                                  <FaExchangeAlt size={11} /> Transfer Stock
                                </button>
                                <button className="btn btn-xs btn-outline-secondary py-1 px-2.5" onClick={() => openDetailsModal(prod)} title="View Details">
                                  <FaInfoCircle size={11} /> View Details
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">No catalog products found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right Panel: Inventory Activity Log */}
          <div className="col-lg-4 mb-4">
            <div className="card shadow-sm p-4 bg-white border-0 h-100" style={{ minHeight: "350px" }}>
              <h5 className="font-bold mb-4 text-primary d-flex align-items-center gap-2">
                <FaHistory /> Inventory Activity Log
              </h5>
              
              {activeLogs ? (
                <div>
                  <div className="bg-light p-2.5 rounded mb-3 border-start border-4 border-info">
                    <div className="small text-secondary font-semibold">Active Product View:</div>
                    <strong>{activeLogs.name}</strong>
                  </div>
                  
                  <div style={{ maxHeight: "400px", overflowY: "auto" }}>
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <div key={log.id} className="p-3 border-bottom rounded mb-2 bg-light">
                          <div className="d-flex justify-content-between align-items-center mb-2" style={{ fontSize: "12px" }}>
                            <span className={`badge bg-${log.actionType === "IN" ? "success" : log.actionType === "OUT" ? "danger" : "info"}`}>
                              {log.actionType}
                            </span>
                            <span className="text-secondary small">{new Date(log.timestamp).toLocaleString("en-IN")}</span>
                          </div>
                          <div className="font-semibold text-dark" style={{ fontSize: "13.5px" }}>
                            {log.quantityChanged} Units
                          </div>
                          <div className="small text-secondary mt-1">{log.notes || "System action logged"}</div>
                          <div className="small text-secondary mt-1" style={{ fontSize: "11px" }}>Logged By: admin</div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-secondary">No stock movement history for this item.</div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="d-flex flex-column align-items-center justify-content-center h-75 text-secondary text-center">
                  <FaHistory className="mb-2 text-muted" size={28} />
                  <p className="small mb-0">Select a product's "History" button to audit its warehouse transaction records.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* MODAL 1: STOCK TRANSFER MODAL */}
        {isTransferModalOpen && selectedProduct && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "450px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-primary"><FaExchangeAlt /> Warehouse Stock Transfer</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsTransferModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleTransferSubmit}>
                <div className="mb-3 bg-light p-2.5 rounded">
                  <div className="small text-secondary font-semibold">Product Selected:</div>
                  <strong>{selectedProduct.name}</strong>
                  <div className="small text-secondary">Source Location: {selectedProduct.warehouse} (Current: {selectedProduct.stock} Units)</div>
                </div>
                
                <div className="mb-3">
                  <label className="form-label font-semibold small">Destination Warehouse</label>
                  <select className="form-select" value={destWarehouse} onChange={e => setDestWarehouse(e.target.value)}>
                    {["Warehouse A", "Warehouse B", "Warehouse C"]
                      .filter(w => w !== selectedProduct.warehouse)
                      .map(w => <option key={w} value={w}>{w}</option>)
                    }
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label font-semibold small">Quantity to Transfer</label>
                  <input 
                    type="number" 
                    className="form-control" 
                    required 
                    value={transferQty} 
                    onChange={e => setTransferQty(e.target.value)} 
                    placeholder={`Max ${selectedProduct.stock}`}
                  />
                </div>

                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsTransferModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-50">Initiate Transfer</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: VIEW DETAILS MODAL */}
        {isDetailsModalOpen && selectedProduct && (
          <div className="modal-overlay d-flex align-items-center justify-content-center animate-fade-in" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "550px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                <h5 className="font-bold mb-0 text-dark"><FaInfoCircle className="text-secondary" /> Product Inventory Card</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsDetailsModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="row g-3 small">
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Product ID</div>
                  <div className="font-bold">#{selectedProduct.id}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Product SKU</div>
                  <div className="font-bold">{selectedProduct.sku || "N/A"}</div>
                </div>
                <div className="col-md-12">
                  <div className="text-secondary font-semibold">Product Name</div>
                  <div className="font-bold" style={{ fontSize: "14px" }}>{selectedProduct.name}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Category</div>
                  <div>{selectedProduct.category}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Supplier</div>
                  <div>{selectedProduct.supplier}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Current Balance</div>
                  <div className="font-bold text-primary">{selectedProduct.stock} Units</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Safety Stock Threshold</div>
                  <div>{selectedProduct.minStock} Units</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Purchase Cost</div>
                  <div>₹{(selectedProduct.purchasePrice || 0).toLocaleString()}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Selling Price</div>
                  <div>₹{(selectedProduct.sellingPrice || 0).toLocaleString()}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Warehouse Location</div>
                  <div className="font-semibold">{selectedProduct.warehouse}</div>
                </div>
                <div className="col-md-6">
                  <div className="text-secondary font-semibold">Batch Code</div>
                  <div>{selectedProduct.batchNumber || "N/A"}</div>
                </div>
              </div>
              <button className="btn btn-primary w-100 mt-4" onClick={() => setIsDetailsModalOpen(false)}>Close Details</button>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default StockManagement;