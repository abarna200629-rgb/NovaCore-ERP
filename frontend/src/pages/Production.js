import { API_BASE_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import { FaIndustry, FaCogs, FaFlask, FaCheckDouble, FaWrench } from "react-icons/fa";

function Production() {
  const [orders, setOrders] = useState([]);
  const [rawMaterials, setRawMaterials] = useState([]);
  const [products, setProducts] = useState([]);

  // Form states
  const [productName, setProductName] = useState("");
  const [rawMaterialId, setRawMaterialId] = useState("");
  const [rawMaterialQty, setRawMaterialQty] = useState("");
  const [quantity, setQuantity] = useState("");
  const [machineStatus, setMachineStatus] = useState("IDLE");
  const [productionCost, setProductionCost] = useState("");

  // Raw Material form
  const [rmName, setRmName] = useState("");
  const [rmStock, setRmStock] = useState("");
  const [rmUnit, setRmUnit] = useState("kg");

  const BASE_URL = API_BASE_URL + "/api/production";
  const INV_URL = API_BASE_URL + "/api/inventory";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadProductionData();
  }, []);

  const loadProductionData = async () => {
    try {
      const orderRes = await axios.get(`${BASE_URL}/orders`, getConfig());
      setOrders(orderRes.data);

      const rmRes = await axios.get(`${BASE_URL}/raw-materials`, getConfig());
      setRawMaterials(rmRes.data);
      if (rmRes.data.length > 0) {
        setRawMaterialId(rmRes.data[0].id.toString());
      }

      const prodRes = await axios.get(`${INV_URL}/products`, getConfig());
      setProducts(prodRes.data);
      if (prodRes.data.length > 0) {
        setProductName(prodRes.data[0].name);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const planProduction = async () => {
    if (!productName || !rawMaterialId || !rawMaterialQty || !quantity || !productionCost) {
      alert("Please fill in all production parameters!");
      return;
    }
    const payload = {
      productName,
      rawMaterialId: Number(rawMaterialId),
      rawMaterialQty: parseFloat(rawMaterialQty),
      quantity: parseInt(quantity),
      machineStatus,
      productionCost: parseFloat(productionCost)
    };
    try {
      await axios.post(`${BASE_URL}/orders`, payload, getConfig());
      alert("Production Order planned successfully");
      setRawMaterialQty("");
      setQuantity("");
      setProductionCost("");
      loadProductionData();
    } catch (err) {
      console.error(err);
      alert("Failed to plan production");
    }
  };

  const addRawMaterial = async () => {
    if (!rmName || !rmStock) {
      alert("Please fill in raw material name and initial stock!");
      return;
    }
    try {
      await axios.post(`${BASE_URL}/raw-materials`, {
        name: rmName,
        stock: parseFloat(rmStock),
        unit: rmUnit
      }, getConfig());
      alert("Raw Material registered successfully");
      setRmName("");
      setRmStock("");
      loadProductionData();
    } catch (err) {
      console.error(err);
    }
  };

  const startMachine = async (orderId) => {
    try {
      await axios.put(`${BASE_URL}/orders/machine/${orderId}?machineStatus=RUNNING`, {}, getConfig());
      alert("Machine started. Production status: IN_PROGRESS");
      loadProductionData();
    } catch (err) {
      console.error(err);
    }
  };

  const pauseMachine = async (orderId) => {
    try {
      await axios.put(`${BASE_URL}/orders/machine/${orderId}?machineStatus=IDLE`, {}, getConfig());
      alert("Machine set to IDLE");
      loadProductionData();
    } catch (err) {
      console.error(err);
    }
  };

  const maintenanceMachine = async (orderId) => {
    try {
      await axios.put(`${BASE_URL}/orders/machine/${orderId}?machineStatus=MAINTENANCE`, {}, getConfig());
      alert("Machine placed under MAINTENANCE schedule");
      loadProductionData();
    } catch (err) {
      console.error(err);
    }
  };

  const sendToQC = async (orderId) => {
    try {
      await axios.put(`${BASE_URL}/orders/status/${orderId}?status=QUALITY_CHECK`, {}, getConfig());
      alert("Production completed. Sent to Quality Control check.");
      loadProductionData();
    } catch (err) {
      console.error(err);
    }
  };

  const completeProduction = async (orderId) => {
    try {
      await axios.put(`${BASE_URL}/orders/status/${orderId}?status=COMPLETED`, {}, getConfig());
      alert("QC Passed. Finished goods added to inventory, raw materials consumed.");
      loadProductionData();
    } catch (err) {
      alert(err.response?.data || "Completion failed");
    }
  };

  const getRmName = (rmId) => {
    const rm = rawMaterials.find(r => r.id === rmId);
    return rm ? `${rm.name} (${rm.unit})` : `RM ID: ${rmId}`;
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Smart Production Planning</h3>

        <div className="row">
          {/* Plan Production Order */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4 mb-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaCogs /> Plan Production Order
              </h5>
              <div className="mb-3">
                <label className="form-label font-semibold">Select Finished Product</label>
                <select className="form-select" value={productName} onChange={(e) => setProductName(e.target.value)}>
                  {products.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Consume Raw Material</label>
                <select className="form-select" value={rawMaterialId} onChange={(e) => setRawMaterialId(e.target.value)}>
                  {rawMaterials.map(rm => (
                    <option key={rm.id} value={rm.id}>{rm.name} (Avail: {rm.stock} {rm.unit})</option>
                  ))}
                </select>
              </div>

              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label font-semibold">RM Qty to Consume</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 5"
                    value={rawMaterialQty}
                    onChange={(e) => setRawMaterialQty(e.target.value)}
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label font-semibold">Finished Output Qty</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 10"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Production Cost (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 3500"
                  value={productionCost}
                  onChange={(e) => setProductionCost(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-100" onClick={planProduction}>
                Schedule Production
              </button>
            </div>

            {/* Raw Material Inventory Form */}
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaFlask /> Register Raw Material
              </h5>
              <div className="mb-3">
                <label className="form-label font-semibold">Material Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Silicon Wafer"
                  value={rmName}
                  onChange={(e) => setRmName(e.target.value)}
                />
              </div>
              <div className="row mb-4">
                <div className="col-md-6">
                  <label className="form-label font-semibold">Initial Stock</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 100"
                    value={rmStock}
                    onChange={(e) => setRmStock(e.target.value)}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label font-semibold">Unit</label>
                  <select className="form-select" value={rmUnit} onChange={(e) => setRmUnit(e.target.value)}>
                    <option value="pieces">Pieces</option>
                    <option value="kg">KG</option>
                    <option value="units">Units</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-outline-primary w-100" onClick={addRawMaterial}>
                Add Material
              </button>
            </div>
          </div>

          {/* Production Orders Board */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4 mb-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaIndustry /> Production Pipeline
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Output Product</th>
                      <th>Material Consumed</th>
                      <th>Output Qty</th>
                      <th>Machine</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.length > 0 ? (
                      orders.map(order => (
                        <tr key={order.id}>
                          <td>{order.productName}</td>
                          <td>
                            {getRmName(order.rawMaterialId)}: <strong>{order.rawMaterialQty}</strong>
                          </td>
                          <td>{order.quantity} Units</td>
                          <td>
                            <span className={`badge ${
                              order.machineStatus === "RUNNING" ? "bg-success" :
                              order.machineStatus === "MAINTENANCE" ? "bg-danger" : "bg-secondary"
                            } text-white`}>
                              {order.machineStatus}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex flex-column gap-1">
                              <span className="badge-modern bg-primary text-white text-center" style={{ fontSize: "11px" }}>
                                {order.status}
                              </span>
                              {order.status === "QUALITY_CHECK" && (
                                <span className={`badge ${order.qcPassed ? "bg-success" : "bg-danger"} text-white`} style={{ fontSize: "9.5px" }}>
                                  {order.qcPassed ? "QC: PASSED" : "QC: FAILED"}
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {order.status === "PLANNING" && (
                                <>
                                  <button className="btn btn-sm btn-outline-success" onClick={() => startMachine(order.id)} title="Start Machine">
                                    Start
                                  </button>
                                  <button className="btn btn-sm btn-outline-danger" onClick={() => maintenanceMachine(order.id)} title="Maintenance">
                                    <FaWrench /> Maint
                                  </button>
                                </>
                              )}
                              {order.status === "IN_PROGRESS" && (
                                <>
                                  <button className="btn btn-sm btn-outline-warning" onClick={() => pauseMachine(order.id)}>
                                    Pause
                                  </button>
                                  <button className="btn btn-sm btn-info text-white" onClick={() => sendToQC(order.id)}>
                                    Send to QC
                                  </button>
                                </>
                              )}
                              {order.status === "QUALITY_CHECK" && order.qcPassed && (
                                <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => completeProduction(order.id)}>
                                  <FaCheckDouble /> Complete
                                </button>
                              )}
                              {order.status === "COMPLETED" && (
                                <span className="text-secondary" style={{ fontSize: "12px" }}>Archived</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">No scheduled production orders.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Raw Material Inventory Summary */}
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaFlask /> Raw Material Stock Levels
              </h5>
              <div className="row">
                {rawMaterials.map(rm => (
                  <div key={rm.id} className="col-md-4 mb-2">
                    <div className="p-3 rounded border text-center" style={{ background: "rgba(0,0,0,0.01)" }}>
                      <h6 className="font-bold text-secondary m-0">{rm.name}</h6>
                      <h3 className="font-bold text-primary my-2">{rm.stock}</h3>
                      <span className="text-secondary text-uppercase" style={{ fontSize: "11px" }}>{rm.unit}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Production;
