import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaTasks, FaCheckCircle, FaExclamationCircle } from "react-icons/fa";

function TaskManagement() {
  const [tasks, setTasks] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Form states
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("Human Resources");
  const [taskName, setTaskName] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [deadline, setDeadline] = useState("");

  const [taskComments, setTaskComments] = useState("");

  const role = localStorage.getItem("role");
  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/tasks";
  const EMP_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api/employees";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadTasks();
    loadEmployees();
  }, []);

  const loadTasks = async () => {
    try {
      const response = await axios.get(BASE_URL, getConfig());
      setTasks(response.data);
    } catch (err) {
      console.error(err);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await axios.get(EMP_URL, getConfig());
      setEmployees(response.data);
      if (response.data.length > 0) {
        setEmployeeId(response.data[0].id.toString());
      }
    } catch (err) {
      console.error(err);
    }
  };

  const assignTask = async () => {
    if (!employeeId || !taskName || !description || !deadline) {
      alert("Please fill in all task fields!");
      return;
    }
    const payload = {
      employeeId: Number(employeeId),
      department,
      taskName,
      description,
      priority,
      deadline
    };
    try {
      await axios.post(BASE_URL, payload, getConfig());
      alert("Task Assigned successfully");
      setTaskName("");
      setDescription("");
      setDeadline("");
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const completeTask = async (taskId) => {
    const comments = prompt("Enter task completion notes/comments:", taskComments);
    if (comments === null) return;
    try {
      await axios.put(`${BASE_URL}/complete/${taskId}`, { comments }, getConfig());
      alert("Task completed. Pending verification.");
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const verifyTask = async (taskId) => {
    try {
      await axios.put(`${BASE_URL}/verify/${taskId}?status=Verified`, {}, getConfig());
      alert("Task verified. Performance rating recalculated.");
      loadTasks();
    } catch (err) {
      console.error(err);
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : `Employee ID: ${empId}`;
  };

  const departments = ["Human Resources", "Finance", "Sales", "Inventory", "Production", "Management"];

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Task Management Board</h3>

        <div className="row">
          {/* Assign Task Form */}
          <div className="col-lg-4 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaTasks /> Delegate Corporate Task
              </h5>

              <div className="mb-3">
                <label className="form-label font-semibold">Assign Employee</label>
                <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                  {employees.map(emp => (
                    <option key={emp.id} value={emp.id}>{emp.name} ({emp.empCode})</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Department</label>
                <select className="form-select" value={department} onChange={(e) => setDepartment(e.target.value)}>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Task Name</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. Audit ledger"
                  value={taskName}
                  onChange={(e) => setTaskName(e.target.value)}
                />
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Task Description</label>
                <textarea
                  className="form-control"
                  rows="3"
                  placeholder="Specify task deliverables..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                ></textarea>
              </div>

              <div className="mb-3">
                <label className="form-label font-semibold">Priority</label>
                <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                </select>
              </div>

              <div className="mb-4">
                <label className="form-label font-semibold">Deadline</label>
                <input
                  type="date"
                  className="form-control"
                  value={deadline}
                  onChange={(e) => setDeadline(e.target.value)}
                />
              </div>

              <button className="btn btn-primary w-100" onClick={assignTask}>
                Assign Task
              </button>
            </div>
          </div>

          {/* Tasks Pipeline */}
          <div className="col-lg-8 mb-4">
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaTasks /> Tasks Lifecycle Tracking
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Task Name</th>
                      <th>Assigned To</th>
                      <th>Dept / Priority</th>
                      <th>Progress %</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.length > 0 ? (
                      tasks.map(task => (
                        <tr key={task.id}>
                          <td>
                            <h6 className="m-0 font-semibold">{task.taskName}</h6>
                            <span className="text-secondary" style={{ fontSize: "12px" }}>{task.description}</span>
                            {task.comments && <div className="text-secondary mt-1" style={{ fontSize: "11px" }}><strong>Notes:</strong> {task.comments}</div>}
                          </td>
                          <td>{getEmpName(task.employeeId)}</td>
                          <td>
                            <div>{task.department}</div>
                            <span className={`badge ${
                              task.priority === "HIGH" ? "bg-danger" :
                              task.priority === "MEDIUM" ? "bg-warning text-dark" : "bg-info"
                            } text-white`} style={{ fontSize: "10px" }}>
                              {task.priority}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <div className="progress flex-grow-1" style={{ height: "6px", minWidth: "60px" }}>
                                <div className="progress-bar bg-success" style={{ width: `${task.progress}%` }}></div>
                              </div>
                              <span style={{ fontSize: "12px" }}>{task.progress}%</span>
                            </div>
                          </td>
                          <td>
                            <span className={`badge-modern ${
                              task.status === "Verified" ? "bg-success text-white" :
                              task.status === "Completed" ? "bg-info text-white" : "bg-warning text-dark"
                            }`}>
                              {task.status}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex gap-1">
                              {task.status === "Assigned" && (
                                <button className="btn btn-sm btn-outline-primary" onClick={() => completeTask(task.id)}>
                                  Complete
                                </button>
                              )}
                              {task.status === "Completed" && (role === "ADMIN" || role === "HR" || role === "SALES" || role === "FINANCE") && (
                                <button className="btn btn-sm btn-success d-flex align-items-center gap-1" onClick={() => verifyTask(task.id)}>
                                  <FaCheckCircle /> Verify
                                </button>
                              )}
                              {task.status === "Verified" && (
                                <span className="text-secondary" style={{ fontSize: "12.5px" }}>Archived</span>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">No corporate tasks delegated.</td>
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

export default TaskManagement;
