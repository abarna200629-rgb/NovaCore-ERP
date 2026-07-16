import { API_BASE_URL } from "../config";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import loginBg from "../assets/images/logo-bg.jpg";

function ChangePassword() {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const navigate = useNavigate();

  const username = localStorage.getItem("username") || "";

  const handlePasswordChange = async (e) => {
    e.preventDefault();

    if (!oldPassword || !newPassword || !confirmPassword) {
      alert("All fields are required!");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("New password and confirm password do not match!");
      return;
    }

    if (newPassword.length < 6) {
      alert("New password must be at least 6 characters long.");
      return;
    }

    try {
      const payload = {
        username,
        oldPassword,
        newPassword
      };

      const response = await axios.post(API_BASE_URL + "/api/auth/change-password", payload);
      
      if (response.data === "SUCCESS") {
        alert("Password changed successfully! Welcome to NovaCore ERP.");
        localStorage.setItem("firstLogin", "false");
        navigate("/home");
      } else {
        alert(response.data);
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data || "Failed to change password. Please verify your current password.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        backgroundImage: `url(${loginBg})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        display: "flex",
        justifyContent: "center",
        alignItems: "center"
      }}
    >
      <div
        className="shadow"
        style={{
          width: "420px",
          padding: "40px",
          borderRadius: "20px",
          background: "rgba(255,255,255,0.95)"
        }}
      >
        <h3 className="text-center mb-1 text-primary font-bold">
          NovaCore ERP
        </h3>
        <p className="text-center text-secondary small mb-4">First-Time Login Security Setup</p>

        <div className="alert alert-info py-2 text-center mb-4" style={{ fontSize: "12.5px" }}>
          🔐 You are using a temporary password. For security, please choose a new password before accessing the system.
        </div>

        <form onSubmit={handlePasswordChange}>
          <div className="mb-3">
            <label className="form-label font-semibold small text-secondary">Current Temporary Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Enter temporary password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label font-semibold small text-secondary">New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Choose new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />
          </div>

          <div className="mb-3">
            <label className="form-label font-semibold small text-secondary">Confirm New Password</label>
            <input
              type="password"
              className="form-control"
              placeholder="Retype new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <button type="submit" className="btn btn-primary w-100 mt-2 font-semibold">
            Update Password & Continue
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;
