import { API_BASE_URL } from "../../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaUserPlus, FaCalendarAlt, FaBriefcase, FaBuilding, FaFilter, FaCheckCircle, FaTrash, FaPlus, FaStickyNote, FaBell, FaSearch, FaSortAmountDown, FaChevronRight } from "react-icons/fa";

function CRM() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState("pipeline"); // "pipeline" or "list" or "reminders"
  
  // Search, Filter & Sort States
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("valueDesc"); // "valueDesc", "valueAsc", "nameAsc"

  // New Lead Form States
  const [companyName, setCompanyName] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [dealValue, setDealValue] = useState("");
  const [pipelineStage, setPipelineStage] = useState("Qualification");
  const [notes, setNotes] = useState("");
  const [reminderDate, setReminderDate] = useState("");
  const [reminderText, setReminderText] = useState("");

  // Details Modal & Toast States
  const [selectedLead, setSelectedLead] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [toasts, setToasts] = useState([]);

  const API_URL = API_BASE_URL + "/api/sales/crm";
  const CUSTOMER_API = API_BASE_URL + "/api/customers";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  const showToast = (message, type = "success") => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  useEffect(() => {
    loadLeads();
  }, []);

  const loadLeads = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API_URL, getConfig());
      setLeads(response.data);
    } catch (error) {
      console.error("Error loading CRM leads:", error);
      showToast("Failed to load leads from database", "danger");
    } finally {
      setLoading(false);
    }
  };

  const appendActivity = (existingNotes, eventText) => {
    const timestamp = new Date().toLocaleString();
    const newLog = `[Activity Log - ${timestamp}] ${eventText}`;
    if (!existingNotes) return newLog;
    return `${existingNotes}\n${newLog}`;
  };

  const handleCreateLead = async (e) => {
    e.preventDefault();
    if (!companyName.trim()) {
      showToast("Company Name is required", "danger");
      return;
    }
    if (!contactName.trim()) {
      showToast("Contact Person is required", "danger");
      return;
    }
    if (email && !email.includes("@")) {
      showToast("Please enter a valid email address", "danger");
      return;
    }
    
    const initialNotes = appendActivity(notes, "Lead created and logged in CRM.");
    const payload = {
      companyName,
      contactName,
      email,
      phone,
      dealValue: dealValue ? Number(dealValue) : 0.0,
      pipelineStage,
      notes: initialNotes,
      reminderDate,
      reminderText,
      status: (pipelineStage === "Won" || pipelineStage === "Lost") ? "DEAL" : (pipelineStage === "Qualification" ? "LEAD" : "OPPORTUNITY")
    };

    try {
      await axios.post(API_URL, payload, getConfig());
      showToast("Sales prospect successfully logged!");
      // Reset Form
      setCompanyName("");
      setContactName("");
      setEmail("");
      setPhone("");
      setDealValue("");
      setPipelineStage("Qualification");
      setNotes("");
      setReminderDate("");
      setReminderText("");
      setShowAddForm(false);
      loadLeads();
    } catch (error) {
      console.error(error);
      showToast("Error saving lead record", "danger");
    }
  };

  const handleUpdateStage = async (lead, newStage) => {
    const status = (newStage === "Won" || newStage === "Lost") ? "DEAL" : (newStage === "Qualification" ? "LEAD" : "OPPORTUNITY");
    const updatedNotes = appendActivity(lead.notes, `Stage updated from "${lead.pipelineStage}" to "${newStage}".`);
    const payload = {
      ...lead,
      pipelineStage: newStage,
      status,
      notes: updatedNotes
    };
    try {
      await axios.put(`${API_URL}/${lead.id}`, payload, getConfig());
      showToast(`Lead moved to ${newStage}`);
      loadLeads();
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(payload);
      }
    } catch (error) {
      console.error(error);
      showToast("Failed to transition pipeline stage", "danger");
    }
  };

  const handleUpdateLeadDetails = async (e) => {
    e.preventDefault();
    if (!selectedLead.companyName.trim() || !selectedLead.contactName.trim()) {
      showToast("Company Name and Contact Person are required", "danger");
      return;
    }
    const updatedNotes = appendActivity(selectedLead.notes, "Lead details manually updated.");
    const payload = {
      ...selectedLead,
      notes: updatedNotes
    };
    try {
      await axios.put(`${API_URL}/${selectedLead.id}`, payload, getConfig());
      showToast("Lead details updated!");
      setSelectedLead(null);
      loadLeads();
    } catch (error) {
      console.error(error);
      showToast("Failed to save updates", "danger");
    }
  };

  const handleSaveNotes = async (lead, newNotes) => {
    const payload = {
      ...lead,
      notes: newNotes
    };
    try {
      await axios.put(`${API_URL}/${lead.id}`, payload, getConfig());
      loadLeads();
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(payload);
      }
      showToast("Prospect notes updated");
    } catch (error) {
      console.error(error);
      showToast("Failed to save notes", "danger");
    }
  };

  const handleSaveReminder = async (lead, date, text) => {
    const updatedNotes = date 
      ? appendActivity(lead.notes, `Set follow-up reminder for ${date}: "${text}"`)
      : appendActivity(lead.notes, "Follow-up reminder marked completed.");
    const payload = {
      ...lead,
      reminderDate: date,
      reminderText: text,
      notes: updatedNotes
    };
    try {
      await axios.put(`${API_URL}/${lead.id}`, payload, getConfig());
      loadLeads();
      if (selectedLead && selectedLead.id === lead.id) {
        setSelectedLead(payload);
      }
      showToast(date ? "Follow-up scheduled!" : "Reminder cleared");
    } catch (error) {
      console.error(error);
      showToast("Failed to set reminder", "danger");
    }
  };

  const handleDeleteLead = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this lead?")) return;
    try {
      await axios.delete(`${API_URL}/${id}`, getConfig());
      showToast("Prospect deleted", "success");
      loadLeads();
      setSelectedLead(null);
    } catch (error) {
      console.error(error);
      showToast("Failed to delete lead", "danger");
    }
  };

  const handleConvertToCustomer = async (lead) => {
    try {
      const payload = {
        customerName: `${lead.companyName} (${lead.contactName})`,
        email: lead.email,
        phone: lead.phone,
        address: "Converted from CRM Won Deal"
      };
      await axios.post(CUSTOMER_API, payload, getConfig());
      showToast("Corporate Customer registered!");
      
      // Update stage notes to mark conversion
      const updatedNotes = appendActivity(lead.notes, "Lead successfully converted to Customer registry.");
      await axios.put(`${API_URL}/${lead.id}`, { ...lead, notes: updatedNotes }, getConfig());
      loadLeads();
    } catch (error) {
      console.error(error);
      showToast("Failed to register customer", "danger");
    }
  };

  const stages = ["Qualification", "Proposal", "Negotiation", "Won", "Lost"];

  // Filter, Sort and Search logic
  const getProcessedLeads = () => {
    return leads
      .filter(l => {
        const q = searchQuery.toLowerCase().trim();
        if (!q) return true;
        return (
          l.companyName.toLowerCase().includes(q) ||
          l.contactName.toLowerCase().includes(q) ||
          (l.email && l.email.toLowerCase().includes(q)) ||
          (l.notes && l.notes.toLowerCase().includes(q))
        );
      })
      .sort((a, b) => {
        if (sortBy === "valueDesc") return (b.dealValue || 0) - (a.dealValue || 0);
        if (sortBy === "valueAsc") return (a.dealValue || 0) - (b.dealValue || 0);
        if (sortBy === "nameAsc") return a.companyName.localeCompare(b.companyName);
        return 0;
      });
  };

  const processedLeads = getProcessedLeads();
  const activeReminders = leads.filter(l => l.reminderDate && l.reminderDate.trim() !== "");

  // Parsing activity log history from notes
  const getActivityLogs = (notesText) => {
    if (!notesText) return [];
    return notesText.split("\n").filter(line => line.startsWith("[Activity Log"));
  };

  return (
    <MainLayout>
      <div className="container-fluid">
        {/* Style block for drag & drop hover and toasts */}
        <style>{`
          .pipeline-column {
            background: #f8fafc;
            border-radius: 12px;
            padding: 12px;
            min-height: 450px;
            transition: background-color 0.2s;
            border: 1px dashed transparent;
          }
          .pipeline-column.drag-over {
            background-color: #e2e8f0;
            border-color: #cbd5e1;
          }
          .crm-card {
            border-radius: 10px;
            background: white;
            cursor: grab;
            transition: transform 0.2s, box-shadow 0.2s;
          }
          .crm-card:active {
            cursor: grabbing;
          }
          .crm-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
          }
          .toast-container {
            position: fixed;
            bottom: 24px;
            right: 24px;
            z-index: 1060;
            display: flex;
            flex-direction: column;
            gap: 8px;
          }
        `}</style>

        {/* Dynamic header with tab navigation */}
        <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-primary m-0">Corporate CRM Hub</h2>
            <p className="text-secondary m-0" style={{ fontSize: "13px" }}>Manage Sales Pipeline, Leads & Opportunities</p>
          </div>
          <div className="d-flex gap-2">
            <button className={`btn btn-sm ${activeView === "pipeline" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActiveView("pipeline")}>
              Sales Pipeline
            </button>
            <button className={`btn btn-sm ${activeView === "list" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActiveView("list")}>
              All Leads List
            </button>
            <button className={`btn btn-sm ${activeView === "reminders" ? "btn-primary" : "btn-outline-primary"}`} onClick={() => setActiveView("reminders")}>
              Follow-ups <span className="badge bg-danger ms-1">{activeReminders.length}</span>
            </button>
            <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => setShowAddForm(!showAddForm)}>
              <FaPlus size={10} /> Log New Lead
            </button>
          </div>
        </div>

        {/* Search, Filter & Sort Controls */}
        <div className="row g-2 mb-4">
          <div className="col-md-8">
            <div className="input-group">
              <span className="input-group-text bg-white"><FaSearch className="text-secondary" /></span>
              <input
                type="text"
                className="form-control"
                placeholder="Search leads by company, contact name, or notes..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="col-md-4">
            <div className="input-group">
              <span className="input-group-text bg-white"><FaSortAmountDown className="text-secondary" /></span>
              <select className="form-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
                <option value="valueDesc">Deal Value: High to Low</option>
                <option value="valueAsc">Deal Value: Low to High</option>
                <option value="nameAsc">Company Name: A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Add Lead Form Section */}
        {showAddForm && (
          <div className="card shadow-sm p-4 mb-4 animate-fade-in" style={{ borderRadius: "14px" }}>
            <h5 className="font-bold mb-3 text-primary d-flex align-items-center gap-2">
              <FaUserPlus /> Log New Sales Prospect
            </h5>
            <form onSubmit={handleCreateLead} className="row g-3">
              <div className="col-md-3">
                <label className="form-label font-semibold small">Company Name *</label>
                <input type="text" className="form-control form-control-sm" placeholder="e.g. Acme Corp" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Contact Person *</label>
                <input type="text" className="form-control form-control-sm" placeholder="e.g. John Doe" value={contactName} onChange={e => setContactName(e.target.value)} required />
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Email Address</label>
                <input type="email" className="form-control form-control-sm" placeholder="e.g. client@acme.com" value={email} onChange={e => setEmail(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Phone Number</label>
                <input type="text" className="form-control form-control-sm" placeholder="e.g. +91 9876543210" value={phone} onChange={e => setPhone(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Deal Value (₹)</label>
                <input type="number" className="form-control form-control-sm" placeholder="e.g. 150000" value={dealValue} onChange={e => setDealValue(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Pipeline Stage</label>
                <select className="form-select form-select-sm" value={pipelineStage} onChange={e => setPipelineStage(e.target.value)}>
                  {stages.map(st => <option key={st} value={st}>{st}</option>)}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Follow-up Date</label>
                <input type="date" className="form-control form-control-sm" value={reminderDate} onChange={e => setReminderDate(e.target.value)} />
              </div>
              <div className="col-md-3">
                <label className="form-label font-semibold small">Reminder Task</label>
                <input type="text" className="form-control form-control-sm" placeholder="e.g. Send price quotation" value={reminderText} onChange={e => setReminderText(e.target.value)} />
              </div>
              <div className="col-12">
                <label className="form-label font-semibold small">Notes / Discussion Details</label>
                <textarea className="form-control form-control-sm" rows="2" placeholder="Initial discussion notes..." value={notes} onChange={e => setNotes(e.target.value)}></textarea>
              </div>
              <div className="col-12 d-flex gap-2 justify-content-end">
                <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setShowAddForm(false)}>Cancel</button>
                <button type="submit" className="btn btn-sm btn-primary">Save Lead File</button>
              </div>
            </form>
          </div>
        )}

        {/* Lead Details Modal Backdrop & Card */}
        {selectedLead && (
          <div className="modal show d-block" style={{ backgroundColor: "rgba(0,0,0,0.5)" }} tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-centered">
              <div className="modal-content" style={{ borderRadius: "16px" }}>
                <div className="modal-header border-bottom-0">
                  <h5 className="modal-title font-bold text-primary d-flex align-items-center gap-2">
                    <FaBriefcase /> Lead Record: {selectedLead.companyName}
                  </h5>
                  <button type="button" className="btn-close" onClick={() => setSelectedLead(null)}></button>
                </div>
                <form onSubmit={handleUpdateLeadDetails}>
                  <div className="modal-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label font-semibold small">Company Name</label>
                        <input type="text" className="form-control form-control-sm" value={selectedLead.companyName} onChange={e => setSelectedLead({...selectedLead, companyName: e.target.value})} required />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label font-semibold small">Contact Person</label>
                        <input type="text" className="form-control form-control-sm" value={selectedLead.contactName} onChange={e => setSelectedLead({...selectedLead, contactName: e.target.value})} required />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label font-semibold small">Email</label>
                        <input type="email" className="form-control form-control-sm" value={selectedLead.email || ""} onChange={e => setSelectedLead({...selectedLead, email: e.target.value})} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label font-semibold small">Phone</label>
                        <input type="text" className="form-control form-control-sm" value={selectedLead.phone || ""} onChange={e => setSelectedLead({...selectedLead, phone: e.target.value})} />
                      </div>
                      <div className="col-md-4">
                        <label className="form-label font-semibold small">Deal Value (₹)</label>
                        <input type="number" className="form-control form-control-sm" value={selectedLead.dealValue || ""} onChange={e => setSelectedLead({...selectedLead, dealValue: e.target.value})} />
                      </div>

                      {/* Notes / Log */}
                      <div className="col-12">
                        <label className="form-label font-semibold small">Custom Notes</label>
                        <textarea
                          className="form-control form-control-sm"
                          rows="3"
                          value={selectedLead.notes || ""}
                          onChange={(e) => setSelectedLead({...selectedLead, notes: e.target.value})}
                          placeholder="Log interaction details..."
                        ></textarea>
                      </div>

                      {/* Follow-up Reminder */}
                      <div className="col-md-6">
                        <label className="form-label font-semibold small">Reminder Follow-up Date</label>
                        <input
                          type="date"
                          className="form-control form-control-sm"
                          value={selectedLead.reminderDate || ""}
                          onChange={(e) => setSelectedLead({...selectedLead, reminderDate: e.target.value})}
                        />
                      </div>
                      <div className="col-md-6">
                        <label className="form-label font-semibold small">Reminder Task</label>
                        <input
                          type="text"
                          className="form-control form-control-sm"
                          placeholder="Task text..."
                          value={selectedLead.reminderText || ""}
                          onChange={(e) => setSelectedLead({...selectedLead, reminderText: e.target.value})}
                        />
                      </div>

                      {/* Activity History Logs */}
                      <div className="col-12 border-top pt-3">
                        <h6 className="font-bold text-secondary mb-2">Activity History Log</h6>
                        <div style={{ maxHeight: "150px", overflowY: "auto", fontSize: "12px" }} className="bg-light p-3 rounded border">
                          {getActivityLogs(selectedLead.notes).length > 0 ? (
                            getActivityLogs(selectedLead.notes).reverse().map((log, index) => (
                              <div key={index} className="py-1 border-bottom d-flex gap-2 align-items-start">
                                <FaChevronRight size={10} className="text-primary mt-1" />
                                <span>{log}</span>
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted">No automated activity logs recorded.</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="modal-footer border-top-0 d-flex justify-content-between">
                    <div>
                      <button type="button" className="btn btn-sm btn-danger d-flex align-items-center gap-1" onClick={() => handleDeleteLead(selectedLead.id)}>
                        <FaTrash size={11} /> Delete
                      </button>
                    </div>
                    <div className="d-flex gap-2">
                      <button type="button" className="btn btn-sm btn-outline-secondary" onClick={() => setSelectedLead(null)}>Cancel</button>
                      {selectedLead.pipelineStage === "Won" && (
                        <button type="button" className="btn btn-sm btn-success" onClick={() => handleConvertToCustomer(selectedLead)}>Convert Customer</button>
                      )}
                      <button type="submit" className="btn btn-sm btn-primary">Save Lead Profile</button>
                    </div>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-5 text-secondary">
            <div className="spinner-border text-primary mb-2" role="status"></div>
            <p className="font-semibold small">Syncing CRM records with live database...</p>
          </div>
        ) : (
          <>
            {/* 1. PIPELINE KANBAN VIEW (WITH HTML5 DRAG AND DROP) */}
            {activeView === "pipeline" && (
              <div className="row g-3">
                {stages.map(stage => {
                  const stageLeads = processedLeads.filter(l => l.pipelineStage === stage);
                  return (
                    <div key={stage} className="col-lg col-md-4 mb-3">
                      <div className="card h-100 shadow-sm border-0" style={{ borderRadius: "12px" }}>
                        <div className="p-3 border-bottom d-flex justify-content-between align-items-center" style={{ background: stage === "Won" ? "rgba(16, 185, 129, 0.08)" : stage === "Lost" ? "rgba(239, 68, 68, 0.08)" : "transparent" }}>
                          <span className="font-bold text-dark text-uppercase" style={{ fontSize: "11.5px" }}>{stage}</span>
                          <span className="badge bg-secondary font-bold" style={{ fontSize: "10.5px" }}>{stageLeads.length}</span>
                        </div>
                        <div 
                          className="pipeline-column d-flex flex-column gap-2"
                          onDragOver={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.add("drag-over");
                          }}
                          onDragLeave={(e) => {
                            e.currentTarget.classList.remove("drag-over");
                          }}
                          onDrop={(e) => {
                            e.preventDefault();
                            e.currentTarget.classList.remove("drag-over");
                            const leadId = e.dataTransfer.getData("leadId");
                            if (leadId) {
                              const targetLead = leads.find(l => l.id === Number(leadId));
                              if (targetLead && targetLead.pipelineStage !== stage) {
                                handleUpdateStage(targetLead, stage);
                              }
                            }
                          }}
                          style={{ minHeight: "400px" }}
                        >
                          {stageLeads.length > 0 ? (
                            stageLeads.map(lead => (
                              <div
                                key={lead.id}
                                draggable
                                onDragStart={(e) => {
                                  e.dataTransfer.setData("leadId", lead.id);
                                }}
                                className="card p-3 border shadow-xs crm-card"
                                onClick={() => setSelectedLead(lead)}
                              >
                                <div className="d-flex justify-content-between align-items-start mb-1">
                                  <h6 className="font-bold m-0 text-dark text-truncate" style={{ maxWidth: "120px" }}>{lead.companyName}</h6>
                                  <span className="badge bg-light text-dark font-semibold" style={{ fontSize: "9px" }}>₹{(lead.dealValue || 0).toLocaleString()}</span>
                                </div>
                                <p className="m-0 text-secondary small text-truncate">{lead.contactName}</p>
                                
                                {lead.reminderDate && (
                                  <div className="mt-2 text-danger font-semibold d-flex align-items-center gap-1" style={{ fontSize: "10px" }}>
                                    <FaBell size={9} /> {lead.reminderDate}
                                  </div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-muted py-4 small" style={{ fontSize: "11px" }}>Drag leads here</div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 2. ALL LEADS LIST */}
            {activeView === "list" && (
              <div className="card shadow-sm p-4" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-3">All Sales Prospects Directory</h5>
                <div className="table-responsive">
                  <table className="table table-bordered table-hover align-middle">
                    <thead className="table-primary text-uppercase" style={{ fontSize: "11px" }}>
                      <tr>
                        <th>Company</th>
                        <th>Contact Person</th>
                        <th>Email</th>
                        <th>Phone</th>
                        <th>Deal Value</th>
                        <th>Stage</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody style={{ fontSize: "12.5px" }}>
                      {processedLeads.length > 0 ? (
                        processedLeads.map(lead => (
                          <tr key={lead.id}>
                            <td><strong>{lead.companyName}</strong></td>
                            <td>{lead.contactName}</td>
                            <td>{lead.email || "N/A"}</td>
                            <td>{lead.phone || "N/A"}</td>
                            <td className="font-bold text-success">₹{(lead.dealValue || 0).toLocaleString()}</td>
                            <td>
                              <span className={`badge ${
                                lead.pipelineStage === "Won" ? "bg-success" :
                                lead.pipelineStage === "Lost" ? "bg-danger" : "bg-warning text-dark"
                              }`} style={{ fontSize: "10px" }}>{lead.pipelineStage}</span>
                            </td>
                            <td>
                              <div className="d-flex gap-2">
                                <button className="btn btn-sm btn-outline-primary" onClick={() => setSelectedLead(lead)}>Details</button>
                                {lead.pipelineStage === "Won" && (
                                  <button className="btn btn-sm btn-success" onClick={() => handleConvertToCustomer(lead)}>Convert</button>
                                )}
                                <button className="btn btn-sm btn-danger" onClick={() => handleDeleteLead(lead.id)}>Delete</button>
                              </div>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="7" className="text-center py-4 text-secondary">No CRM prospects matching queries. Log a new lead to start.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 3. FOLLOW-UPS BOARD */}
            {activeView === "reminders" && (
              <div className="card shadow-sm p-4" style={{ borderRadius: "14px" }}>
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                  <FaCalendarAlt className="text-primary" /> Active Customer Follow-up Reminders
                </h5>
                <div className="row">
                  {activeReminders.length > 0 ? (
                    activeReminders.map(lead => (
                      <div key={lead.id} className="col-md-6 col-lg-4 mb-3">
                        <div className="p-3 border rounded shadow-xs" style={{ background: "rgba(37, 99, 235, 0.02)", borderLeft: "4px solid #2563eb" }}>
                          <div className="d-flex justify-content-between align-items-center">
                            <strong className="text-dark">{lead.companyName}</strong>
                            <span className="badge bg-danger" style={{ fontSize: "10px" }}>{lead.reminderDate}</span>
                          </div>
                          <p className="small text-secondary m-0 mt-1">Person: {lead.contactName}</p>
                          <hr className="my-2" />
                          <p className="small m-0 text-dark font-semibold">Reminder: {lead.reminderText || "General Follow-up Check"}</p>
                          <div className="mt-3 text-end">
                            <button className="btn btn-xs btn-outline-success px-2 py-0.5" style={{ fontSize: "11px" }} onClick={() => handleSaveReminder(lead, "", "")}>
                              Mark Completed
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-5 text-secondary">No active reminders registered. Set date/text reminders inside any lead details view.</div>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* FIXED TOAST CONTAINER */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className={`alert alert-${t.type === "success" ? "success" : "danger"} shadow-lg m-0 py-2 px-3 animate-fade-in`} style={{ borderRadius: "8px", minWidth: "220px", fontSize: "13px" }}>
            {t.message}
          </div>
        ))}
      </div>
    </MainLayout>
  );
}

export default CRM;
