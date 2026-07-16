import { useState } from "react";
import MainLayout from "../../layouts/MainLayout";
import { FaUserPlus, FaEnvelope, FaBriefcase, FaUserCheck, FaChevronDown } from "react-icons/fa";

function Recruitment() {
  const [candidates, setCandidates] = useState([
    { id: 1, name: "Varshini R", email: "varshini@erp.com", designation: "Software Engineer", status: "Applied", score: 85 },
    { id: 2, name: "Pranesh K", email: "pranesh@erp.com", designation: "Sales Associate", status: "Interview Scheduled", score: 78 },
    { id: 3, name: "Kaviya M", email: "kaviya@erp.com", designation: "HR Generalist", status: "Offer Sent", score: 92 }
  ]);

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [designation, setDesignation] = useState("Software Engineer");
  const [score, setScore] = useState("");

  const addCandidate = () => {
    if (!name || !email || !score) {
      alert("Please fill in candidate details!");
      return;
    }
    const cand = {
      id: candidates.length + 1,
      name,
      email,
      designation,
      status: "Applied",
      score: parseInt(score)
    };
    setCandidates(prev => [...prev, cand]);
    setName("");
    setEmail("");
    setScore("");
    alert("Candidate profile logged in ATS registry.");
  };

  const updateStatus = (id, newStatus) => {
    setCandidates(prev =>
      prev.map(c => (c.id === id ? { ...c, status: newStatus } : c))
    );
    alert(`Candidate status updated to: ${newStatus}`);
  };

  const designations = ["Software Engineer", "Sales Associate", "HR Generalist", "Financial Analyst", "Operations Supervisor"];

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Applicant Tracking System (ATS)</h3>

        <div className="row">
          {/* Register Candidate */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaUserPlus /> Log Applicant File
              </h5>
              
              <div className="mb-3">
                <label className="form-label font-semibold">Full Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Abirami G"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Email Address</label>
                <input
                  type="email"
                  className="form-control"
                  placeholder="applicant@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Target Designation</label>
                <select className="form-select" value={designation} onChange={(e) => setDesignation(e.target.value)}>
                  {designations.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">Interview Evaluation Score</label>
                <input
                  type="number"
                  className="form-control"
                  placeholder="e.g. 88"
                  value={score}
                  onChange={(e) => setScore(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-100" onClick={addCandidate}>
                Add Applicant File
              </button>
            </div>
          </div>

          {/* Candidates Directory */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4 h-100">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaBriefcase /> Candidates Registry
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Candidate Info</th>
                      <th>Target Role</th>
                      <th>Interview Score</th>
                      <th>Hiring Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {candidates.map((c) => (
                      <tr key={c.id}>
                        <td>
                          <h6 className="m-0 font-semibold">{c.name}</h6>
                          <div className="text-secondary" style={{ fontSize: "11px" }}>
                            <FaEnvelope className="text-secondary" /> {c.email}
                          </div>
                        </td>
                        <td>{c.designation}</td>
                        <td>
                          <span className={`badge ${c.score >= 80 ? "bg-success" : "bg-warning text-dark"} text-white`}>
                            {c.score} / 100
                          </span>
                        </td>
                        <td>
                          <span className={`badge-modern ${
                            c.status === "Offer Sent" ? "bg-success text-white" :
                            c.status === "Interview Scheduled" ? "bg-info text-white" : "bg-secondary text-white"
                          }`}>
                            {c.status}
                          </span>
                        </td>
                        <td>
                          <select className="form-select form-select-sm" style={{ width: "160px" }} value={c.status} onChange={(e) => updateStatus(c.id, e.target.value)}>
                            <option value="Applied">Applied</option>
                            <option value="Interview Scheduled">Interview Scheduled</option>
                            <option value="Offer Sent">Offer Sent</option>
                            <option value="Rejected">Rejected</option>
                          </select>
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

export default Recruitment;