import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaShoppingCart, FaCheck, FaTimes, FaPlus } from "react-icons/fa";

function PurchaseOrders() {
  const [requests, setRequests] = useState([]);
  
  // Form states
  const [productName, setProductName] = useState("");
  const [quantity, setQuantity] = useState("");
  const [price, setPrice] = useState("");

  const role = localStorage.getItem("role");
  const BASE_URL = API_BASE_URL + "/api/inventory/purchases";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const response = await axios.get(BASE_URL, getConfig());
      setRequests(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const createRequest = async () => {
    if (!productName || !quantity || !price) {
      alert("Please fill in all request fields!");
      return;
    }
    const payload = {
      productName,
      quantity: parseInt(quantity),
      price: parseFloat(price),
      requestedBy: "Inventory Manager"
    };
    try {
      await axios.post(BASE_URL, payload, getConfig());
      alert("Purchase Request created successfully");
      setProductName("");
      setQuantity("");
      setPrice("");
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleApprove = async (id) => {
    try {
      await axios.put(`${BASE_URL}/approve/${id}?approver=Finance Manager`, {}, getConfig());
      alert("Purchase order APPROVED. Supplier has been notified to ship goods.");
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReject = async (id) => {
    try {
      await axios.put(`${BASE_URL}/reject/${id}?rejector=Finance Manager`, {}, getConfig());
      alert("Purchase request REJECTED.");
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const handleReceive = async (id) => {
    try {
      await axios.put(`${BASE_URL}/receive/${id}`, {}, getConfig());
      alert("Goods received! Product stock levels updated and expense logged.");
      loadRequests();
    } catch (err) {
      console.error(err);
      alert("Failed to receive goods.");
    }
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Purchase Workflows & Orders</h3>

        <div className="row">
          {/* Create Request Form */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaPlus /> Request Stock Purchase
              </h5>

              <div className="mb-3">
                <label className="form-label font-semibold">Product Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Wireless Mouse"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Quantity</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 50"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">Estimated Total Price (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 15000"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-100" onClick={createRequest}>
                Submit Request
              </button>
            </div>
          </div>

          {/* Requests Pipeline */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaShoppingCart /> Purchase Requests Board
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Request ID</th>
                      <th>Product Name</th>
                      <th>Quantity</th>
                      <th>Total cost</th>
                      <th>Requested By</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {requests.length > 0 ? (
                      requests.map(req => (
                        <tr key={req.id}>
                          <td>PO-REQ{1000 + req.id}</td>
                          <td>{req.productName}</td>
                          <td>{req.quantity} Units</td>
                          <td>
                            <strong className="text-primary">
                              ₹{req.price.toLocaleString()}
                            </strong>
                          </td>
                          <td>{req.requestedBy}</td>
                          <td>
                            <span className={`badge-modern ${
                              req.status === "RECEIVED" ? "bg-info text-white" :
                              req.status === "APPROVED" ? "bg-success text-white" :
                              req.status === "REJECTED" ? "bg-danger text-white" : "bg-warning text-dark"
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td>
                            {req.status === "PENDING" && (role === "ADMIN" || role === "FINANCE") && (
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => handleApprove(req.id)}>
                                  <FaCheck /> Approve
                                </button>
                                <button className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={() => handleReject(req.id)}>
                                  <FaTimes /> Reject
                                </button>
                              </div>
                            )}
                            {req.status === "APPROVED" && (role === "ADMIN" || role === "INVENTORY") && (
                              <button className="btn btn-sm btn-outline-primary d-flex align-items-center gap-1" onClick={() => handleReceive(req.id)}>
                                <FaCheck /> Mark Received
                              </button>
                            )}
                            {req.status === "RECEIVED" && (
                              <span className="text-success font-semibold small">✓ Stock Updated</span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-secondary">No purchase requests submitted.</td>
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

export default PurchaseOrders;