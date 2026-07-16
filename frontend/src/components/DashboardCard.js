import { API_BASE_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import DashboardCard from "../components/DashboardCard";

function Dashboard() {

  const [employeeCount,
    setEmployeeCount] =
    useState(0);

  const [attendanceCount,
    setAttendanceCount] =
    useState(0);

  const [productCount,
    setProductCount] =
    useState(0);

  const [revenue,
    setRevenue] =
    useState(0);

  useEffect(() => {

    loadDashboard();

  }, []);

  const loadDashboard =
    async () => {

      try {

        const emp =
          await axios.get(
            API_BASE_URL + "/api/employees/count"
          );

        const att =
          await axios.get(
            API_BASE_URL + "/api/hr/attendance/count"
          );

        const prod =
          await axios.get(
            API_BASE_URL + "/api/products/count"
          );

        const rev =
          await axios.get(
            API_BASE_URL + "/api/sales/revenue"
          );

        setEmployeeCount(
          emp.data
        );

        setAttendanceCount(
          att.data
        );

        setProductCount(
          prod.data
        );

        setRevenue(
          rev.data
        );

      } catch (error) {

        console.log(error);

      }
    };

  return (

    <MainLayout>

      <h1>
        Dashboard
      </h1>

      <div className="row">

        <div className="col-md-3">

          <DashboardCard
            title="Employees"
            value={employeeCount}
            color="#2563eb"
          />

        </div>

        <div className="col-md-3">

          <DashboardCard
            title="Attendance"
            value={attendanceCount}
            color="#16a34a"
          />

        </div>

        <div className="col-md-3">

          <DashboardCard
            title="Products"
            value={productCount}
            color="#eab308"
          />

        </div>

        <div className="col-md-3">

          <DashboardCard
            title="Revenue"
            value={`₹${revenue}`}
            color="#dc2626"
          />

        </div>

      </div>

    </MainLayout>

  );
}

export default Dashboard;