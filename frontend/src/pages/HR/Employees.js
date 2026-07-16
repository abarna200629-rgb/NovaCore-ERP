import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaUserPlus, FaUserEdit, FaTrash, FaIdCard, FaCamera } from "react-icons/fa";

function Employees() {
  const [employees, setEmployees] = useState([]);
  const [name, setName] = useState("");
  const [department, setDepartment] = useState("Human Resources");
  const [designation, setDesignation] = useState("Employee");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [salary, setSalary] = useState("");
  const [joiningDate, setJoiningDate] = useState("");
  const [manager, setManager] = useState("Jane Doe");
  const [status, setStatus] = useState("ACTIVE");
  const [photo, setPhoto] = useState("https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150");
  const [users, setUsers] = useState([]);
  const [filterStatus, setFilterStatus] = useState("ACTIVE");

  const [editingId, setEditingId] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [role, setRole] = useState("EMPLOYEE");
  const [credentialsModal, setCredentialsModal] = useState({
    isOpen: false,
    empId: "",
    username: "",
    password: ""
  });

  const API_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employees";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token ? token.trim() : ""}` }
    };
  };

  useEffect(() => {
    loadEmployees();
  }, []);

  const loadEmployees = async (statusFilter = filterStatus) => {
    try {
      const response = await axios.get(`${API_URL}?status=${statusFilter}`, getConfig());
      setEmployees(response.data);
      
      const userRes = await axios.get((process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/users", getConfig());
      if (userRes && Array.isArray(userRes.data)) {
        setUsers(userRes.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const saveEmployee = async () => {
    if (!name || !email || !phone || !salary || !joiningDate) {
      alert("Please fill in all required fields!");
      return;
    }

    if (isDuplicateEmail) {
      alert("Email Address already exists.");
      return;
    }

    if (isDuplicatePhone) {
      alert("Phone Number already exists.");
      return;
    }

    const payload = {
      name,
      department,
      designation,
      email,
      phoneNumber: phone,
      salary: parseFloat(salary),
      joiningDate,
      manager,
      status,
      photo,
      role
    };

    try {
      if (editingId === null) {
        const res = await axios.post(API_URL, payload, getConfig());
        alert("Employee Added Successfully");
        
        setCredentialsModal({
          isOpen: true,
          empId: "EMP" + res.data.id,
          username: res.data.generatedUsername,
          password: res.data.generatedPassword
        });
      } else {
        await axios.put(`${API_URL}/${editingId}`, { id: editingId, ...payload }, getConfig());
        alert("Employee Updated Successfully");
      }
      clearForm();
      loadEmployees();
    } catch (error) {
      console.error(error);
      alert("Operation Failed");
    }
  };

  const editEmployee = (employee) => {
    setEditingId(employee.id);
    setName(employee.name);
    setDepartment(employee.department);
    setDesignation(employee.designation);
    setEmail(employee.email);
    setPhone(employee.phoneNumber || employee.phone);
    setSalary(employee.salary);
    setJoiningDate(employee.joiningDate);
    setManager(employee.manager || "Jane Doe");
    setStatus(employee.status);
    setRole(employee.role || "EMPLOYEE");
    setPhoto(employee.photo || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150");
  };

  const handleFilterChange = (statusVal) => {
    setFilterStatus(statusVal);
    loadEmployees(statusVal);
  };

  const deactivateEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to deactivate this employee?\n\nThis employee will no longer be able to login or appear in operational modules.")) return;
    try {
      await axios.post(`${API_URL}/${id}/deactivate`, {}, getConfig());
      alert("Employee deactivated successfully");
      loadEmployees();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.response?.data || "Failed to deactivate employee";
      alert(msg);
    }
  };

  const restoreEmployee = async (id) => {
    if (!window.confirm("Are you sure you want to restore this employee?\n\nThis will re-enable their login and make them visible in all operational modules.")) return;
    try {
      await axios.post(`${API_URL}/${id}/restore`, {}, getConfig());
      alert("Employee restored successfully");
      loadEmployees();
    } catch (error) {
      console.error(error);
      const msg = error.response?.data?.message || error.response?.data || "Failed to restore employee";
      alert(msg);
    }
  };

  const clearForm = () => {
    setEditingId(null);
    setName("");
    setDepartment("Human Resources");
    setDesignation("Employee");
    setEmail("");
    setPhone("");
    setSalary("");
    setJoiningDate("");
    setManager("Jane Doe");
    setStatus("ACTIVE");
    setRole("EMPLOYEE");
    setPhoto("https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150");
  };

  const viewProfile = (employee) => {
    setSelectedProfile(employee);
  };

  const departments = ["Human Resources", "Finance", "Sales", "Inventory", "Production", "Management"];
  const designations = ["HR Manager", "Finance Manager", "Sales Manager", "Inventory Manager", "Production Manager", "Employee"];
  const statuses = ["ACTIVE", "INACTIVE", "LEAVE"];

  const isDuplicateEmail = email.trim() !== "" && employees.some(emp => 
    emp.email && emp.email.trim().toLowerCase() === email.trim().toLowerCase() && emp.id !== editingId
  );
  
  const isDuplicatePhone = phone.trim() !== "" && employees.some(emp => {
    const empPhone = emp.phoneNumber || emp.phone;
    return empPhone && empPhone.trim() === phone.trim() && emp.id !== editingId;
  });

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Employee Management</h3>

        <div className="row">
          {/* Employee Setup Form */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3">{editingId ? "Update Employee" : "Register Employee"}</h5>
              <div className="text-center mb-3">
                <img
                  src={photo}
                  alt="Profile"
                  className="rounded-circle border border-primary mb-2"
                  style={{ width: "90px", height: "90px", objectFit: "cover" }}
                />
                <button
                  className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1 mx-auto"
                  onClick={() => {
                    const url = prompt("Enter Image URL:", photo);
                    if (url) setPhoto(url);
                  }}
                >
                  <FaCamera /> Edit Photo
                </button>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Abarna"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Department</label>
                <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Designation</label>
                <select className="form-select" value={designation} onChange={(e) => setDesignation(e.target.value)}>
                  {designations.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Corporate Email</label>
                <input
                  type="email"
                  className={`form-control ${isDuplicateEmail ? "is-invalid border-danger" : ""}`}
                  placeholder="e.g. abarna@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {isDuplicateEmail && <div className="text-danger small mt-1">Email Address already exists.</div>}
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Phone Number</label>
                <input
                  type="text"
                  className={`form-control ${isDuplicatePhone ? "is-invalid border-danger" : ""}`}
                  placeholder="e.g. +91 9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
                {isDuplicatePhone && <div className="text-danger small mt-1">Phone Number already exists.</div>}
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Joining Date</label>
                <input
                  type="date"
                  className="form-control"
                  value={joiningDate}
                  onChange={(e) => setJoiningDate(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Monthly Basic Salary (₹)</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 75000"
                  value={salary}
                  onChange={(e) => setSalary(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Reporting Manager</label>
                <select className="form-select" value={manager} onChange={(e) => setManager(e.target.value)}>
                  {employees.map((emp) => (
                    <option key={emp.id} value={emp.name}>{emp.name} ({emp.designation})</option>
                  ))}
                  <option value="None">None</option>
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Work Status</label>
                <select className="form-select" value={status} onChange={(e) => setStatus(e.target.value)}>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">System Role / Login Group</label>
                <select className="form-select" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="HR">HR Specialist</option>
                  <option value="FINANCE">Finance Specialist</option>
                  <option value="INVENTORY">Inventory Specialist</option>
                  <option value="PRODUCTION">Production Specialist</option>
                  <option value="SALES">Sales Specialist</option>
                  <option value="ADMIN">System Admin</option>
                </select>
              </div>

              <div className="d-flex gap-2">
                <button className="btn btn-primary flex-grow-1" onClick={saveEmployee} disabled={isDuplicateEmail || isDuplicatePhone}>
                  {editingId ? "Update" : "Register"}
                </button>
                <button className="btn btn-outline-secondary" onClick={clearForm}>
                  Clear
                </button>
              </div>
            </div>
          </div>

          {/* Employees List */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-bold m-0">Enterprise Employee Directory</h5>
                <div className="btn-group btn-group-sm">
                  {[
                    { label: "Active", value: "ACTIVE" },
                    { label: "Inactive", value: "INACTIVE" },
                    { label: "Archived", value: "ARCHIVED" },
                    { label: "All", value: "ALL" }
                  ].map((tab) => (
                    <button
                      key={tab.value}
                      type="button"
                      className={`btn ${filterStatus === tab.value ? "btn-primary text-white" : "btn-outline-primary"}`}
                      onClick={() => handleFilterChange(tab.value)}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Department</th>
                      <th>Designation</th>
                      <th>Salary</th>
                      <th>Status</th>
                      <th>User Account</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {employees.length > 0 ? (
                      employees.map((emp) => (
                        <tr key={emp.id}>
                          <td>
                            <div className="d-flex align-items-center gap-3">
                              <img
                                src={emp.photo || photo}
                                alt="avatar"
                                className="rounded-circle"
                                style={{ width: "42px", height: "42px", objectFit: "cover" }}
                              />
                              <div>
                                <h6 className="m-0 font-semibold">{emp.name}</h6>
                                <span className="text-secondary" style={{ fontSize: "12px" }}>{emp.empCode}</span>
                              </div>
                            </div>
                          </td>
                          <td>{emp.department}</td>
                          <td>{emp.designation}</td>
                          <td>₹{(emp.salary || 0).toLocaleString()}</td>
                          <td>
                            <span className={`badge bg-${emp.status === "ACTIVE" ? "success" : emp.status === "ARCHIVED" ? "secondary" : "danger"} text-white`} style={{ fontSize: "11px" }}>
                              {emp.status}
                            </span>
                          </td>
                          <td>
                            {(() => {
                              const linkedUser = users.find(u => emp.id === u.employeeId || u.username?.toLowerCase() === emp.empCode?.toLowerCase());
                              if (linkedUser) {
                                const isLocked = linkedUser.locked || linkedUser.status === "LOCKED";
                                return (
                                  <span className={`badge bg-${isLocked ? "warning text-dark" : "success text-white"}`} style={{ fontSize: "11px" }}>
                                    ✔ {isLocked ? "Disabled" : "Active"}
                                  </span>
                                );
                              } else {
                                return (
                                  <span className="badge bg-secondary text-white" style={{ fontSize: "11px" }}>
                                    Not Created
                                  </span>
                                );
                              }
                            })()}
                          </td>
                          <td>
                            <button className="btn btn-sm btn-link text-primary p-0 me-2" onClick={() => viewProfile(emp)} title="View Profile">
                              <FaIdCard size={18} />
                            </button>
                            <button className="btn btn-sm btn-link text-warning p-0 me-2" onClick={() => editEmployee(emp)} title="Edit">
                              <FaUserEdit size={18} />
                            </button>
                            {emp.status === "ACTIVE" ? (
                              <button className="btn btn-sm btn-link text-danger p-0 align-middle" onClick={() => deactivateEmployee(emp.id)} title="Deactivate" style={{ textDecoration: "none" }}>
                                <span className="small font-semibold text-danger">Deactivate</span>
                              </button>
                            ) : (
                              <button className="btn btn-sm btn-link text-success p-0 align-middle" onClick={() => restoreEmployee(emp.id)} title="Restore" style={{ textDecoration: "none" }}>
                                <span className="small font-semibold text-success">Restore</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="7" className="text-center py-4 text-secondary">No registered employees found.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* Employee Profile Page Modal (Glassmorphic Overlay) */}
        {selectedProfile && (
          <div className="modal fade show d-block" style={{ background: "rgba(0,0,0,0.5)" }} tabIndex="-1">
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content glass-panel p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--border-card)" }}>
                <div className="modal-header border-0 p-0 mb-3 d-flex justify-content-between align-items-center">
                  <h5 className="modal-title font-bold text-primary">Employee Corporate Profile</h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedProfile(null)}></button>
                </div>
                <div className="modal-body text-center p-0">
                  <img
                    src={selectedProfile.photo || photo}
                    alt="profile"
                    className="rounded-circle border border-primary mb-3 shadow"
                    style={{ width: "120px", height: "120px", objectFit: "cover" }}
                  />
                  <h4 className="font-bold text-primary mb-1">{selectedProfile.name}</h4>
                  <p className="text-secondary font-semibold mb-3">{selectedProfile.empCode} | {selectedProfile.designation}</p>

                  <div className="text-start p-3 rounded" style={{ background: "rgba(0,0,0,0.02)" }}>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Department:</div>
                      <div className="col-7 text-primary">{selectedProfile.department}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Corporate Email:</div>
                      <div className="col-7 text-primary">{selectedProfile.email}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Phone Contact:</div>
                      <div className="col-7 text-primary">{selectedProfile.phone}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Joined Date:</div>
                      <div className="col-7 text-primary">{selectedProfile.joiningDate}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Base Salary:</div>
                      <div className="col-7 text-primary font-bold">₹{(selectedProfile.salary || 0).toLocaleString()}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Reporting Manager:</div>
                      <div className="col-7 text-primary">{selectedProfile.manager || "None"}</div>
                    </div>
                    <div className="row mb-2">
                      <div className="col-5 font-semibold text-secondary">Work Status:</div>
                      <div className="col-7"><span className="badge bg-success">{selectedProfile.status}</span></div>
                    </div>
                    <div className="row">
                      <div className="col-5 font-semibold text-secondary">KPI Performance:</div>
                      <div className="col-7 text-primary font-bold">{selectedProfile.performanceRating || "Good"}</div>
                    </div>
                  </div>
                  <button className="btn btn-primary w-100 mt-4" onClick={() => setSelectedProfile(null)}>
                    Close Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {credentialsModal.isOpen && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 9999
          }}>
            <div className="card glass-panel p-5 border-0 shadow-lg" style={{ width: "450px", borderRadius: "16px", background: "white" }}>
              <h5 className="font-bold text-success text-center mb-3">🎉 Employee Onboarded Successfully</h5>
              <p className="text-secondary small text-center mb-4">Credentials have been generated automatically. Please copy or print them now.</p>
              
              <div className="p-3 bg-light rounded border mb-3 text-start">
                <div className="mb-2">
                  <span className="text-secondary small font-bold">Employee ID:</span>
                  <div className="font-semibold text-dark">{credentialsModal.empId}</div>
                </div>
                <div className="mb-2">
                  <span className="text-secondary small font-bold">Username / Login ID:</span>
                  <div className="font-semibold text-dark">{credentialsModal.username}</div>
                </div>
                <div className="mb-2">
                  <span className="text-secondary small font-bold">Temporary Password:</span>
                  <div className="font-semibold text-danger font-mono" style={{ letterSpacing: "1px" }}>{credentialsModal.password}</div>
                </div>
              </div>

              <div className="d-flex flex-column gap-2">
                <button className="btn btn-primary d-flex align-items-center justify-content-center gap-2 font-semibold" onClick={() => {
                  navigator.clipboard.writeText(`Employee ID: ${credentialsModal.empId}\nUsername: ${credentialsModal.username}\nTemporary Password: ${credentialsModal.password}`);
                  alert("Credentials copied to clipboard!");
                }}>
                  📋 Copy Credentials
                </button>
                <button className="btn btn-outline-primary d-flex align-items-center justify-content-center gap-2 font-semibold" onClick={() => {
                  const printWindow = window.open("", "_blank");
                  printWindow.document.write(`
                    <html>
                      <head><title>Employee Credentials</title></head>
                      <body style="font-family: sans-serif; padding: 40px; text-align: center;">
                        <h2>NovaCore ERP - Employee Credentials</h2>
                        <hr/>
                        <div style="margin: 20px 0; text-align: left; display: inline-block;">
                          <p><strong>Employee ID:</strong> ${credentialsModal.empId}</p>
                          <p><strong>Username:</strong> ${credentialsModal.username}</p>
                          <p><strong>Temporary Password:</strong> ${credentialsModal.password}</p>
                        </div>
                        <p style="color: red;"><strong>Please log in and change your password immediately.</strong></p>
                        <script>window.print();</script>
                      </body>
                    </html>
                  `);
                  printWindow.document.close();
                }}>
                  🖨️ Print Credentials
                </button>
                <button className="btn btn-secondary mt-2" onClick={() => setCredentialsModal({ isOpen: false, empId: "", username: "", password: "" })}>
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}

export default Employees;