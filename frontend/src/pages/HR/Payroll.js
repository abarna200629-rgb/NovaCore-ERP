import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../../layouts/MainLayout";
import { FaFileInvoiceDollar, FaCalculator } from "react-icons/fa";

function Payroll() {
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [employeeId, setEmployeeId] = useState("");
  const role = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
  const [month, setMonth] = useState("July");
  const [year, setYear] = useState(2026);

  const BASE_URL = (process.env.REACT_APP_API_BASE_URL || "http://localhost:8080") + "/api";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    loadPayrolls();
    loadEmployees();
  }, []);

  const loadPayrolls = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/hr/payroll`, getConfig());
      setPayrolls(response.data || []);
    } catch (error) {
      console.error(error);
    }
  };

  const loadEmployees = async () => {
    try {
      const response = await axios.get(`${BASE_URL}/employees`, getConfig());
      setEmployees(response.data || []);
      
      const userRole = localStorage.getItem("role") ? localStorage.getItem("role").trim().toUpperCase().replace("ROLE_", "") : "";
      const userNm = localStorage.getItem("username") || "";

      if (userRole === "EMPLOYEE") {
        const matched = response.data.find(e => e.name.toLowerCase() === userNm.toLowerCase());
        if (matched) {
          setEmployeeId(matched.id.toString());
        } else if (response.data.length > 0) {
          setEmployeeId(response.data[0].id.toString());
        }
      } else {
        if (response.data.length > 0) {
          setEmployeeId(response.data[0].id.toString());
        }
      }
    } catch (error) {
      console.error(error);
    }
  };

  const generatePayroll = async () => {
    if (!employeeId) {
      alert("Please select an employee!");
      return;
    }
    const payload = {
      employeeId: Number(employeeId),
      month,
      year: Number(year)
    };
    try {
      await axios.post(`${BASE_URL}/hr/payroll/generate`, payload, getConfig());
      alert("Payroll generated and recorded successfully");
      loadPayrolls();
    } catch (error) {
      alert(error.response?.data || "Generation failed");
    }
  };

  const getEmpName = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.name : `Employee ID: ${empId}`;
  };

  const getEmpCode = (empId) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? emp.empCode : "-";
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const years = [2025, 2026, 2027];

  return (
    <MainLayout>
      <div className="container-fluid">
        <h3 className="mb-4 text-primary font-bold">Smart Payroll Management</h3>

        <div className="row">
           {/* Payroll Generator */}
          {role !== "EMPLOYEE" && (
            <div className="col-lg-4 mb-4">
              <div className="card glass-panel p-4">
                <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                  <FaCalculator /> Generate Month Payroll
                </h5>
                <p className="text-secondary" style={{ fontSize: "13.5px" }}>
                  Basic salary is retrieved directly from Employee Records. The system dynamically evaluates attendance, leaves, late minutes, and sales target bonuses.
                </p>

                <div className="mb-3">
                  <label className="form-label font-semibold">Select Employee</label>
                  <select className="form-select" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} ({emp.empCode})</option>
                    ))}
                  </select>
                </div>

                <div className="mb-3">
                  <label className="form-label font-semibold">Month</label>
                  <select className="form-select" value={month} onChange={(e) => setMonth(e.target.value)}>
                    {months.map(m => (
                      <option key={m} value={m}>{m}</option>
                    ))}
                  </select>
                </div>

                <div className="mb-4">
                  <label className="form-label font-semibold">Year</label>
                  <select className="form-select" value={year} onChange={(e) => setYear(e.target.value)}>
                    {years.map(y => (
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                </div>

                <button className="btn btn-primary w-100" onClick={generatePayroll}>
                  Run Payroll Calculation
                </button>
              </div>
            </div>
          )}

          {/* Payroll List */}
          <div className={role === "EMPLOYEE" ? "col-lg-12 mb-4" : "col-lg-8 mb-4"}>
            <div className="card glass-panel p-4">
              <h5 className="font-bold mb-3 d-flex align-items-center gap-2">
                <FaFileInvoiceDollar /> Generated Payslips Ledger
              </h5>
              <div className="table-responsive">
                <table className="table table-modern align-middle">
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Period</th>
                      <th>Basic Salary</th>
                      <th>Earning Bonuses</th>
                      <th>Deductions / Taxes</th>
                      <th>Net Salary</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payrolls.length > 0 ? (
                      payrolls
                        .filter(p => {
                          if (role === "EMPLOYEE" && employeeId) {
                            return p.employeeId.toString() === employeeId;
                          }
                          return true;
                        })
                        .map((payroll) => (
                        <tr key={payroll.id}>
                          <td>
                            <h6 className="m-0 font-semibold">{getEmpName(payroll.employeeId)}</h6>
                            <span className="text-secondary" style={{ fontSize: "11.5px" }}>{getEmpCode(payroll.employeeId)}</span>
                          </td>
                          <td>
                            {payroll.month} {payroll.year}
                          </td>
                          <td>₹{(payroll.basicSalary || 0).toLocaleString()}</td>
                          <td>
                            <div>Allw: +₹{(payroll.allowances || 0).toLocaleString()}</div>
                            {((payroll.performanceBonus || 0) > 0 || (payroll.salesBonus || 0) > 0) && (
                              <div className="text-success" style={{ fontSize: "11.5px", fontWeight: "bold" }}>
                                Bonus: +₹{((payroll.performanceBonus || 0) + (payroll.salesBonus || 0)).toLocaleString()}
                              </div>
                            )}
                          </td>
                          <td>
                            <div className="text-danger">Ded: -₹{((payroll.lateDeduction || 0) + (payroll.attendanceDeduction || 0) + (payroll.taskPenalty || 0)).toLocaleString()}</div>
                            <div className="text-secondary" style={{ fontSize: "11px" }}>Tax: -₹{((payroll.tax || 0) + (payroll.pf || 0) + (payroll.esi || 0) + (payroll.professionalTax || 0)).toLocaleString()}</div>
                          </td>
                          <td>
                            <strong className="text-success" style={{ fontSize: "15px" }}>
                              ₹{(payroll.netSalary || 0).toLocaleString()}
                            </strong>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="text-center py-4 text-secondary">No payslips have been run for this cycle.</td>
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

export default Payroll;