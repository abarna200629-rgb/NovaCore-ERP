import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaTruck, FaMapMarkerAlt, FaPhone, FaBoxes } from "react-icons/fa";

function Suppliers() {
  const [suppliersList, setSuppliersList] = useState([]);
  
  // Custom vendors state
  const [newVendor, setNewVendor] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("San Jose, CA");
  const [rating, setRating] = useState("A+ Grade");

  const API_URL = API_BASE_URL + "/api/inventory/suppliers";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      const response = await axios.get(API_URL, getConfig());
      setSuppliersList(response.data);
    } catch (err) {
      console.error("Error loading suppliers:", err);
    }
  };

  const addVendor = async () => {
    if (!newVendor || !phone) {
      alert("Please fill in Supplier Name and Phone!");
      return;
    }
    if (isDuplicateSupplierName) {
      alert("Supplier Name already exists.");
      return;
    }
    if (isDuplicateSupplierPhone) {
      alert("Phone Number already exists.");
      return;
    }
    const payload = {
      name: newVendor,
      phone: phone,
      city: city,
      rating: rating
    };
    try {
      await axios.post(API_URL, payload, getConfig());
      alert("New Vendor Account Registered.");
      setNewVendor("");
      setPhone("");
      loadSuppliers();
    } catch (err) {
      console.error("Error registering supplier:", err);
      alert("Failed to register supplier");
    }
  };

  const deleteVendor = async (id) => {
    if (!window.confirm("Are you sure you want to remove this vendor account?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getConfig());
      alert("Vendor account deleted.");
      loadSuppliers();
    } catch (err) {
      console.error("Error deleting supplier:", err);
      alert("Failed to delete vendor account");
    }
  };

  const isDuplicateSupplierName = newVendor.trim() !== "" && suppliersList.some(s => 
    s.name && s.name.trim().toLowerCase() === newVendor.trim().toLowerCase()
  );
  
  const isDuplicateSupplierPhone = phone.trim() !== "" && suppliersList.some(s => 
    s.phone && s.phone.trim() === phone.trim()
  );

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Supplier & Vendor Directory</h3>

        <div className="row">
          {/* Register Vendor */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaTruck /> Register Vendor Account
              </h5>
              
              <div className="mb-3">
                <label className="form-label font-semibold">Vendor Company Name</label>
                <input
                  type="text"
                  className={`form-control ${isDuplicateSupplierName ? "is-invalid border-danger" : ""}`}
                  placeholder="e.g. Intel Corp"
                  value={newVendor}
                  onChange={(e) => setNewVendor(e.target.value)}
                />
                {isDuplicateSupplierName && <div className="text-danger small mt-1">Supplier Name already exists.</div>}
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Contact Phone</label>
                <input
                  type="text"
                  className={`form-control ${isDuplicateSupplierPhone ? "is-invalid border-danger" : ""}`}
                  placeholder="e.g. +1 (555) 902-1234"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {isDuplicateSupplierPhone && <div className="text-danger small mt-1">Phone Number already exists.</div>}
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">City Location</label>
                <input
                  type="text"
                  className="form-control"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">Credit Score / Rating</label>
                <select className="form-select" value={rating} onChange={(e) => setRating(e.target.value)}>
                  <option value="A+ Grade">A+ Grade</option>
                  <option value="A Grade">A Grade</option>
                  <option value="B Grade">B Grade</option>
                </select>
              </div>

              <button className="btn btn-primary w-100" onClick={addVendor} disabled={isDuplicateSupplierName || isDuplicateSupplierPhone}>
                Register Account
              </button>
            </div>
          </div>

          {/* Vendors Catalog */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaBoxes /> Active Vendors Directory
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Vendor Account</th>
                      <th>Location</th>
                      <th>Phone</th>
                      <th>Credit Rating</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suppliersList.map((sup) => (
                      <tr key={sup.id}>
                        <td>
                          <h6 className="m-0 font-semibold">{sup.name}</h6>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <FaMapMarkerAlt className="text-secondary" /> {sup.city}
                          </div>
                        </td>
                        <td>
                          <div className="d-flex align-items-center gap-1">
                            <FaPhone className="text-secondary" /> {sup.phone}
                          </div>
                        </td>
                        <td>
                          <span className={`badge ${
                            sup.rating && sup.rating.includes("A+") ? "bg-success" :
                            sup.rating && sup.rating.includes("A") ? "bg-info" : "bg-warning text-dark"
                          } text-white`}>
                            {sup.rating}
                          </span>
                        </td>
                        <td>
                          <button className="btn btn-sm btn-link text-danger p-0" onClick={() => deleteVendor(sup.id)}>
                            Delete
                          </button>
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

export default Suppliers;