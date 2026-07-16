import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import {
  FaUserCog, FaLock, FaUnlock, FaKey, FaEye, FaEdit, FaTrash,
  FaPlus, FaUserCheck, FaUserTimes, FaShieldAlt, FaSearch, FaFilter,
  FaArrowLeft, FaArrowRight, FaTimes
} from "react-icons/fa";

function Users() {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search & Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Add User Fields
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [roleId, setRoleId] = useState(2);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  // Selection states
  const [selectedUser, setSelectedUser] = useState(null);
  const [editUsername, setEditUsername] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editRoleId, setEditRoleId] = useState(2);
  const [editStatus, setEditStatus] = useState("ACTIVE");
  const [newResetPassword, setNewResetPassword] = useState("");

  const API_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/users";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const userRes = await axios.get(API_URL, getConfig());
      if (userRes && Array.isArray(userRes.data)) {
        setUsers(userRes.data);
      } else {
        setUsers([]);
      }
      
      const roleRes = await axios.get(`${API_URL}/roles`, getConfig());
      if (roleRes && Array.isArray(roleRes.data)) {
        setRoles(roleRes.data);
      } else {
        setRoles([]);
      }
    } catch (error) {
      console.error("Error loading user management data:", error);
      setUsers([]);
      setRoles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = async (e) => {
    e.preventDefault();
    if (!username || !password || !email) {
      alert("Please fill in all required fields.");
      return;
    }
    try {
      await axios.post(
        API_URL,
        { username, password, email, roleId },
        getConfig()
      );
      alert("User added successfully!");
      setIsAddModalOpen(false);
      // Clear fields
      setUsername("");
      setPassword("");
      setEmail("");
      setRoleId(2);
      loadData();
    } catch (error) {
      alert("Failed to add user.");
    }
  };

  const handleEditUser = async (e) => {
    e.preventDefault();
    if (!editUsername || !editEmail) {
      alert("Username and Email are required.");
      return;
    }
    try {
      await axios.put(
        `${API_URL}/${selectedUser.id}`,
        {
          username: editUsername,
          email: editEmail,
          roleId: editRoleId,
          status: editStatus
        },
        getConfig()
      );
      alert("User updated successfully!");
      setIsEditModalOpen(false);
      loadData();
    } catch (error) {
      alert("Failed to update user.");
    }
  };

  const handleDeleteUser = async (id, name) => {
    if (!window.confirm(`Are you sure you want to permanently delete user: ${name}?`)) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getConfig());
      alert("User deleted successfully.");
      loadData();
    } catch (error) {
      alert("Failed to delete user.");
    }
  };

  const handleToggleLock = async (user) => {
    const isCurrentlyLocked = user.locked || user.status === "LOCKED";
    const action = isCurrentlyLocked ? "unlock" : "lock";
    if (!window.confirm(`Are you sure you want to ${action} user: ${user.username}?`)) return;

    try {
      await axios.post(`${API_URL}/${user.id}/${action}`, {}, getConfig());
      alert(`User ${action}ed successfully.`);
      loadData();
    } catch (error) {
      alert(`Failed to ${action} user.`);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!newResetPassword || newResetPassword.length < 4) {
      alert("Password must be at least 4 characters.");
      return;
    }
    try {
      await axios.post(
        `${API_URL}/${selectedUser.id}/reset-password`,
        { password: newResetPassword },
        getConfig()
      );
      alert("User password reset successfully! User will be forced to change password on next login.");
      setIsResetModalOpen(false);
      setNewResetPassword("");
    } catch (error) {
      alert("Failed to reset password.");
    }
  };

  // Open Modals helpers
  const openEditModal = (user) => {
    setSelectedUser(user);
    setEditUsername(user.username || "");
    setEditEmail(user.email || "");
    setEditRoleId(user.role?.id || 2);
    setEditStatus(user.status || (user.locked ? "LOCKED" : "ACTIVE"));
    setIsEditModalOpen(true);
  };

  const openViewModal = (user) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const openResetModal = (user) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };

  // Statistics Calculations
  const totalCount = users.length;
  const activeCount = users.filter(u => u.status === "ACTIVE" || !u.locked).length;
  const lockedCount = users.filter(u => u.status === "LOCKED" || u.locked).length;
  const adminCount = users.filter(u => u.role?.roleName === "ADMIN" || u.roleString === "ADMIN").length;

  // Filter & Search Logic
  const filteredUsers = users.filter(user => {
    const matchesSearch =
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.email || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const roleName = user.role?.roleName || user.roleString || "";
    const matchesRole = selectedRole === "ALL" || roleName.toUpperCase() === selectedRole.toUpperCase();
    
    const isLocked = user.locked || user.status === "LOCKED";
    const statusStr = isLocked ? "LOCKED" : "ACTIVE";
    const matchesStatus = selectedStatus === "ALL" || statusStr.toUpperCase() === selectedStatus.toUpperCase();

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Pagination Logic
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage) || 1;
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredUsers.slice(indexOfFirstItem, indexOfLastItem);

  const getRoleBadgeClass = (roleName) => {
    const norm = (roleName || "").toUpperCase();
    if (norm === "ADMIN") return "bg-danger";
    if (norm === "HR") return "bg-primary";
    if (norm === "FINANCE") return "bg-success";
    if (norm === "INVENTORY") return "bg-warning text-dark";
    if (norm === "SALES") return "bg-info text-dark";
    return "bg-secondary";
  };

  const formatDateTime = (dtStr) => {
    if (!dtStr) return "Never";
    try {
      return new Date(dtStr).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return dtStr;
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="d-flex flex-column align-items-center justify-content-center py-5 h-100">
          <div className="spinner-border text-primary mb-3" style={{ width: "3rem", height: "3rem" }}></div>
          <h5 className="font-semibold text-secondary">Loading User Management database...</h5>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container-fluid mb-5">
        
        {/* Title Header */}
        <div className="d-flex flex-wrap justify-content-between align-items-center mb-4 gap-3">
          <div>
            <h3 className="mb-1 text-primary font-bold"><FaUserCog /> User Management</h3>
            <p className="text-secondary mb-0">Admin command center for configuring system access, roles, and password policies.</p>
          </div>
          <button className="btn btn-primary d-flex align-items-center gap-2" onClick={() => setIsAddModalOpen(true)}>
            <FaPlus /> Add User
          </button>
        </div>

        {/* Row 1: Statistics Cards */}
        <div className="row mb-4">
          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-primary h-100">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Total Users</h6>
              <h3 className="font-bold text-primary mb-0">{totalCount}</h3>
              <span className="small text-secondary mt-1">Configured accounts</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-success h-100">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Active Accounts</h6>
              <h3 className="font-bold text-success mb-0">{activeCount}</h3>
              <span className="small text-secondary mt-1">Status: Operational</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-danger h-100">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Administrators</h6>
              <h3 className="font-bold text-danger mb-0">{adminCount}</h3>
              <span className="small text-secondary mt-1">Full access control</span>
            </div>
          </div>

          <div className="col-lg-3 col-md-6 mb-3">
            <div className="card glass-panel p-3 border-start border-4 border-warning h-100">
              <h6 className="text-secondary font-semibold small uppercase mb-1">Locked Out</h6>
              <h3 className="font-bold text-warning mb-0">{lockedCount}</h3>
              <span className="small text-secondary mt-1">Temporary lock restrictions</span>
            </div>
          </div>
        </div>

        {/* Row 2: Search & Filters Panel */}
        <div className="card glass-panel p-3 mb-4">
          <div className="row g-3">
            <div className="col-md-5">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaSearch /></span>
                <input
                  className="form-control border-start-0"
                  placeholder="Search by username or email address..."
                  value={searchTerm}
                  onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                />
              </div>
            </div>

            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaFilter /></span>
                <select
                  className="form-select border-start-0 font-medium"
                  value={selectedRole}
                  onChange={(e) => { setSelectedRole(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Roles</option>
                  <option value="ADMIN">ADMIN</option>
                  <option value="HR">HR</option>
                  <option value="FINANCE">FINANCE</option>
                  <option value="INVENTORY">INVENTORY</option>
                  <option value="SALES">SALES</option>
                </select>
              </div>
            </div>

            <div className="col-md-3">
              <div className="input-group">
                <span className="input-group-text bg-white border-end-0 text-secondary"><FaShieldAlt /></span>
                <select
                  className="form-select border-start-0 font-medium"
                  value={selectedStatus}
                  onChange={(e) => { setSelectedStatus(e.target.value); setCurrentPage(1); }}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ACTIVE">ACTIVE</option>
                  <option value="LOCKED">LOCKED</option>
                </select>
              </div>
            </div>

            <div className="col-md-1">
              <button className="btn btn-outline-secondary w-100" onClick={() => { setSearchTerm(""); setSelectedRole("ALL"); setSelectedStatus("ALL"); }}>
                Reset
              </button>
            </div>
          </div>
        </div>

        {/* Row 3: Users Table Ledger */}
        <div className="card glass-panel p-4 mb-3">
          <div className="table-responsive">
            <table className="table table-modern align-middle" style={{ fontSize: "14px" }}>
              <thead>
                <tr>
                  <th>Emp ID</th>
                  <th>Emp Name</th>
                  <th>Username</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Dept</th>
                  <th>Account Status</th>
                  <th>Employee Status</th>
                  <th>Created Date</th>
                  <th>Last Login</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentItems.length > 0 ? (
                  currentItems.map(user => {
                    const isLocked = user.locked || user.status === "LOCKED";
                    const roleName = user.role?.roleName || user.roleString || "N/A";
                    return (
                      <tr key={user.id}>
                        <td><code>{user.employeeId ? `#EMP-${user.employeeId}` : "None"}</code></td>
                        <td><strong>{user.employeeName || "System Account"}</strong></td>
                        <td>{user.username}</td>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${getRoleBadgeClass(roleName)}`}>
                            {roleName}
                          </span>
                        </td>
                        <td><span className="badge bg-light text-dark border">{user.department || "N/A"}</span></td>
                        <td>
                          <span className={`badge bg-${isLocked ? "warning text-dark" : "success"}`}>
                            {isLocked ? "LOCKED" : "ACTIVE"}
                          </span>
                        </td>
                        <td>
                          {user.employeeStatus ? (
                            <span className={`badge bg-${user.employeeStatus === "ACTIVE" ? "success" : user.employeeStatus === "ARCHIVED" ? "secondary" : "danger"}`}>
                              {user.employeeStatus}
                            </span>
                          ) : (
                            <span className="text-secondary small">N/A</span>
                          )}
                        </td>
                        <td>{formatDateTime(user.createdDate)}</td>
                        <td>{formatDateTime(user.lastLogin)}</td>
                        <td>
                          <div className="d-flex gap-1.5 justify-content-end">
                            <button className="btn btn-xs btn-outline-primary py-1 px-2" onClick={() => openEditModal(user)} title="Edit User">
                              <FaEdit size={12} /> Edit
                            </button>
                            <button className="btn btn-xs btn-outline-info py-1 px-2" onClick={() => openResetModal(user)} title="Reset Password">
                              <FaKey size={12} /> Reset
                            </button>
                            <button 
                              className={`btn btn-xs ${isLocked ? "btn-outline-success" : "btn-outline-warning"} py-1 px-2`} 
                              onClick={() => handleToggleLock(user)} 
                              title={isLocked ? "Unlock User" : "Lock User"}
                            >
                              {isLocked ? <FaUnlock size={12} /> : <FaLock size={12} />} {isLocked ? "Unlock" : "Lock"}
                            </button>
                            <button className="btn btn-xs btn-outline-danger py-1 px-2" onClick={() => handleDeleteUser(user.id, user.username)} title="Delete User">
                              <FaTrash size={12} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="10" className="text-center text-secondary py-4">No users match your active filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Table Pagination Footer */}
          <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2 border-top pt-3">
            <span className="small text-secondary">
              Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredUsers.length)} of {filteredUsers.length} entries
            </span>
            <div className="d-flex gap-2">
              <button 
                className="btn btn-xs btn-outline-primary py-1 px-2" 
                disabled={currentPage === 1} 
                onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              >
                <FaArrowLeft size={11} /> Previous
              </button>
              <span className="font-semibold align-self-center px-2" style={{ fontSize: "13px" }}>
                Page {currentPage} of {totalPages}
              </span>
              <button 
                className="btn btn-xs btn-outline-primary py-1 px-2" 
                disabled={currentPage === totalPages} 
                onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              >
                Next <FaArrowRight size={11} />
              </button>
            </div>
          </div>
        </div>

        {/* MODAL 1: ADD USER MODAL */}
        {isAddModalOpen && (
          <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "450px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-bold mb-0 text-primary">➕ Add New User</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsAddModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleAddUser}>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Username</label>
                  <input className="form-control" required value={username} onChange={(e) => setUsername(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Email Address</label>
                  <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Temporary Password</label>
                  <input type="password" className="form-control" required value={password} onChange={(e) => setPassword(e.target.value)} />
                </div>
                <div className="mb-4">
                  <label className="form-label font-semibold small">Access Privilege Role</label>
                  <select className="form-select font-medium" value={roleId} onChange={(e) => setRoleId(Number(e.target.value))}>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.roleName}</option>
                    ))}
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsAddModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-50">Save User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 2: EDIT USER MODAL */}
        {isEditModalOpen && selectedUser && (
          <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "450px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-bold mb-0 text-primary">✏️ Edit User Config</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsEditModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleEditUser}>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Username</label>
                  <input className="form-control" required value={editUsername} onChange={(e) => setEditUsername(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Email Address</label>
                  <input type="email" className="form-control" required value={editEmail} onChange={(e) => setEditEmail(e.target.value)} />
                </div>
                <div className="mb-3">
                  <label className="form-label font-semibold small">Access Privilege Role</label>
                  <select className="form-select font-medium" value={editRoleId} onChange={(e) => setEditRoleId(Number(e.target.value))}>
                    {roles.map(r => (
                      <option key={r.id} value={r.id}>{r.roleName}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="form-label font-semibold small">Account Status</label>
                  <select className="form-select font-medium" value={editStatus} onChange={(e) => setEditStatus(e.target.value)}>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="LOCKED">LOCKED</option>
                  </select>
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsEditModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary w-50">Update User</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MODAL 3: VIEW USER DETAILS MODAL */}
        {isViewModalOpen && selectedUser && (
          <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "480px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-bold mb-0 text-primary">👁️ Account Credentials Details</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsViewModalOpen(false)}><FaTimes /></button>
              </div>
              <div className="p-2">
                <table className="table table-bordered table-sm small">
                  <tbody>
                    <tr>
                      <th className="bg-light w-45">User ID</th>
                      <td><code>#{selectedUser.id}</code></td>
                    </tr>
                    <tr>
                      <th className="bg-light">Username</th>
                      <td><strong>{selectedUser.username}</strong></td>
                    </tr>
                    <tr>
                      <th className="bg-light">Email Address</th>
                      <td>{selectedUser.email}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Access Privilege Role</th>
                      <td>
                        <span className={`badge ${getRoleBadgeClass(selectedUser.role?.roleName || selectedUser.roleString)}`}>
                          {selectedUser.role?.roleName || selectedUser.roleString}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-light">Account Status</th>
                      <td>
                        <span className={`badge bg-${(selectedUser.locked || selectedUser.status === "LOCKED") ? "warning text-dark" : "success"}`}>
                          {(selectedUser.locked || selectedUser.status === "LOCKED") ? "LOCKED" : "ACTIVE"}
                        </span>
                      </td>
                    </tr>
                    <tr>
                      <th className="bg-light">Email Verified</th>
                      <td>{selectedUser.emailVerified ? "Yes (Active)" : "No (Verification Pending)"}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Created Timestamp</th>
                      <td>{formatDateTime(selectedUser.createdDate)}</td>
                    </tr>
                    <tr>
                      <th className="bg-light">Last Login Date</th>
                      <td>{formatDateTime(selectedUser.lastLogin)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <button className="btn btn-primary w-100 mt-3" onClick={() => setIsViewModalOpen(false)}>Close View</button>
            </div>
          </div>
        )}

        {/* MODAL 4: RESET PASSWORD MODAL */}
        {isResetModalOpen && selectedUser && (
          <div className="modal-overlay d-flex align-items-center justify-content-center" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.5)", zIndex: 1050 }}>
            <div className="card shadow border-0 p-4 animate-fade-in" style={{ width: "420px", borderRadius: "14px" }}>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="font-bold mb-0 text-primary">🔑 Reset User Password</h5>
                <button className="btn btn-light rounded-circle p-1" onClick={() => setIsResetModalOpen(false)}><FaTimes /></button>
              </div>
              <form onSubmit={handleResetPassword}>
                <p className="text-secondary small">
                  Set a new password for account <strong>{selectedUser.username}</strong>. The user will be required to change this password on their next login session.
                </p>
                <div className="mb-4">
                  <label className="form-label font-semibold small">New Admin Password</label>
                  <input type="password" className="form-control" required value={newResetPassword} onChange={(e) => setNewResetPassword(e.target.value)} placeholder="Minimum 4 characters" />
                </div>
                <div className="d-flex gap-2">
                  <button type="button" className="btn btn-light w-50" onClick={() => setIsResetModalOpen(false)}>Cancel</button>
                  <button type="submit" className="btn btn-danger w-50">Reset Password</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </MainLayout>
  );
}

export default Users;
