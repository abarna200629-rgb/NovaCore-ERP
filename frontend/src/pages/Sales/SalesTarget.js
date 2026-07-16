import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaBullseye, FaFlag, FaCalendarDay } from "react-icons/fa";

function SalesTarget() {
  const [targets, setTargets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [products, setProducts] = useState([]);

  const [employeeId, setEmployeeId] = useState("");
  const [productId, setProductId] = useState("");
  const [targetQuantity, setTargetQuantity] = useState("");
  const [deadline, setDeadline] = useState("");
  const [priority, setPriority] = useState("MEDIUM");

  const BASE_URL = API_BASE_URL + "/api/sales";
  const EMP_URL = API_BASE_URL + "/api/employees";
  const INV_URL = API_BASE_URL + "/api/inventory";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadTargets();
    loadEmployees();
    loadProducts();

    const interval = setInterval(() => {
      loadTargets();
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const loadTargets = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/targets`, getConfig());
      setTargets(response.data);
    } catch (error) {
      console.log(error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await axios.get(EMP_URL, getConfig());
      setEmployees(response.data);
      if (response.data.length > 0) {
        setEmployeeId(response.data[0].id.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const loadProducts = async () => {
    try {
      const response = await axios.get(`${INV_URL}/products`, getConfig());
      setProducts(response.data);
      if (response.data.length > 0) {
        setProductId(response.data[0].id.toString());
      }
    } catch (error) {
      console.log(error);
    }
  };

  const saveTarget = async () => {
    if (!employeeId || !productId || !targetQuantity || !deadline) {
      alert("Please fill in all target fields!");
      return;
    }
    const payload = {
      employeeId: Number(employeeId),
      productId: Number(productId),
      targetQuantity: Number(targetQuantity),
      deadline,
      priority
    };
    try {
      await axios.post(`${BASE_URL}/targets`, payload, getConfig());
      alert("Sales Target Assigned Successfully");
      setTargetQuantity("");
      setDeadline("");
      loadTargets();
    } catch (error) {
      console.log(error);
      alert("Failed to assign target");
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
        <h3 className="mb-4 text-primary font-bold">Sales Target Assignments</h3>

        <div className="row">
          {/* Target Assignment Form */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaBullseye /> Set Quota Target
              </h5>

              <div className="mb-3">
                <label className="form-label font-semibold">Sales Executive</label>
                <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.empCode})</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Select Product</label>
                <select className="form-select" value={productId} onChange={(e) => setProductId(e.target.value)}>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Target Quantity (Units)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 50"
                  value={targetQuantity}
                  onChange={(e) => setTargetQuantity(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Deadline Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">Priority Level</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <button className="btn btn-primary w-100" onClick={saveTarget}>
                Assign Target Quota
              </button>
            </div>
          </div>

          {/* Targets Directory */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaFlag /> Quota Performance Tracking
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Sales Executive</th>
                      <th>Product</th>
                      <th>Target / Achieved</th>
                      <th>Deadline</th>
                      <th>Status Badge</th>
                      <th>Rating</th>
                    </tr>
                  </thead>
                  <tbody>
                    {targets.length > 0 ? (
                      targets.map(target => {
                        const pct = Math.round((target.achievedQuantity / target.targetQuantity) * 100);
                        return (
                          <tr key={target.id}>
                            <td>{getEmpName(target.employeeId)}</td>
                            <td>{getProdName(target.productId)}</td>
                            <td>
                              <div className="d-flex justify-content-between font-semibold mb-1" style={{ fontSize: "12px" }}>
                                <span>{target.achievedQuantity} / {target.targetQuantity} Units</span>
                                <span>{pct}%</span>
                              </div>
                              <div className="progress" style={{ height: "6px" }}>
                                <div className={`progress-bar progress-bar-striped progress-bar-animated ${pct >= 100 ? "bg-success" : "bg-primary"}`} style={{ width: `${pct > 100 ? 100 : pct}%` }}></div>
                              </div>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-1" style={{ fontSize: "13px" }}>
                                <FaCalendarDay className="text-secondary" /> {target.deadline}
                              </div>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                (target.completionStatus || "").toUpperCase() === "COMPLETED" || (target.completionStatus || "").toUpperCase() === "COMPLETED ON TIME" ? "success" :
                                (target.completionStatus || "").toUpperCase() === "LATE COMPLETION" ? "info" : "warning text-dark"
                              }`}>
                                {target.completionStatus || "IN PROGRESS"}
                              </span>
                            </td>
                            <td>
                              <span className={`badge bg-${
                                (target.rating || "").toUpperCase() === "EXCELLENT" ? "success" :
                                (target.rating || "").toUpperCase() === "GOOD" ? "info" : "warning text-dark"
                              } text-white`}>
                                {target.rating || "POOR"}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">No target assignments recorded.</td>
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

export default SalesTarget;
