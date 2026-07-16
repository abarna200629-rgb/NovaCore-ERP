import { API_BASE_URL } from "../config";
import { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import loginBg from "../assets/images/logo-bg.jpg";

const decodeToken = (token) => {
  try {
    if (!token) return null;
    const base64Url = token.split('.')[1];
    if (!base64Url) return null;
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const pad = base64.length % 4;
    const paddedBase64 = pad ? base64 + '='.repeat(4 - pad) : base64;
    const jsonPayload = decodeURIComponent(
      window.atob(paddedBase64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

function Login() {

const [username, setUsername] = useState("");
const [password, setPassword] = useState("");
const [otp, setOtp] = useState("");
const [otpSent, setOtpSent] = useState(false);
const navigate = useNavigate();

// Forgot Password State
const [forgotMode, setForgotMode] = useState(false);
const [resetEmail, setResetEmail] = useState("");
const [resetOtp, setResetOtp] = useState("");
const [newPassword, setNewPassword] = useState("");
const [resetOtpSent, setResetOtpSent] = useState(false);
const [resetError, setResetError] = useState("");

const handleRequestResetOtp = async () => {
  if (!resetEmail) {
    alert("Please enter your registered email address.");
    return;
  }
  setResetError("");
  try {
    const response = await axios.post(API_BASE_URL + "/api/auth/forgot-password", { email: resetEmail });
    if (response.data === "OTP Sent Successfully") {
      alert("Password Reset OTP sent successfully to your email!");
      setResetOtpSent(true);
    } else {
      setResetError(response.data);
    }
  } catch (error) {
    setResetError("Failed to request reset OTP. Ensure email is correct.");
  }
};

const handleResetPassword = async () => {
  if (!resetEmail || !resetOtp || !newPassword) {
    alert("Please fill in all reset password fields!");
    return;
  }
  setResetError("");
  try {
    const response = await axios.post(API_BASE_URL + "/api/auth/reset-password", {
      email: resetEmail,
      otp: resetOtp,
      newPassword
    });
    if (response.data === "SUCCESS") {
      alert("Password reset successful! You can now log in.");
      setForgotMode(false);
      setResetEmail("");
      setResetOtp("");
      setNewPassword("");
      setResetOtpSent(false);
      setResetError("");
    } else {
      setResetError(response.data);
    }
  } catch (error) {
    if (error.response && error.response.data && error.response.data.message) {
      setResetError(error.response.data.message);
    } else if (error.response && typeof error.response.data === "string") {
      setResetError(error.response.data);
    } else {
      setResetError("Failed to reset password.");
    }
  }
};

const sendOtp = async () => {
  try {
    const response = await axios.post(
      API_BASE_URL + "/api/auth/login",
      {
        username,
        password
      }
    );
    alert(typeof response.data === "string" ? response.data : (response.data.message || "OTP Sent successfully!"));
    setOtpSent(true);
  } catch (error) {
    console.error(error);
    let errMsg = "Invalid Username or Password";
    if (!error.response) {
      errMsg = "Backend server is not running or server is unavailable. Please start the server.";
    } else if (error.response.status === 500) {
      errMsg = "Database connection failed or Internal Server Error (500).";
    } else if (error.response.status === 404) {
      errMsg = "Login API endpoint not found (404).";
    } else if (error.response.data && typeof error.response.data === "string") {
      errMsg = error.response.data;
    } else if (error.response.data?.message) {
      errMsg = error.response.data.message;
    }
    alert(errMsg);
  }
};

// STEP 2 - Verify OTP
const verifyOtp = async () => {
  try {
    const response = await axios.post(
      API_BASE_URL + "/api/auth/verify-otp",
      {
        username,
        otp
      }
    );
    const token = response.data.token;
    localStorage.setItem("token", token);
    
    let role = response.data.role;
    let employeeId = "";
    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        if (!role) role = decoded.role;
        employeeId = decoded.employeeId || "";
      }
    }
    localStorage.setItem("role", role || "EMPLOYEE");
    localStorage.setItem("username", response.data.username || username);
    localStorage.setItem("employeeId", employeeId);
    
    const isFirstLogin = response.data.firstLogin ? "true" : "false";
    localStorage.setItem("firstLogin", isFirstLogin);
    
    alert("Login Successful");
    if (isFirstLogin === "true") {
      navigate("/change-password");
    } else {
      const normRole = (role || "EMPLOYEE").trim().toUpperCase().replace("ROLE_", "");
      if (normRole === "EMPLOYEE") {
        navigate("/employee-dashboard");
      } else if (normRole === "ADMIN") {
        navigate("/dashboard");
      } else if (normRole === "HR") {
        navigate("/hr-dashboard");
      } else if (normRole === "SALES") {
        navigate("/sales-dashboard");
      } else if (normRole === "FINANCE") {
        navigate("/finance-dashboard");
      } else if (normRole === "INVENTORY") {
        navigate("/inventory-dashboard");
      } else {
        navigate("/dashboard");
      }
    }
  } catch (error) {
    console.error(error);
    let errMsg = "Invalid OTP";
    if (!error.response) {
      errMsg = "Backend server is not running or server is unavailable.";
    } else if (error.response.status === 500) {
      errMsg = "Database connection failed or Internal Server Error (500).";
    } else if (error.response.data && typeof error.response.data === "string") {
      errMsg = error.response.data;
    } else if (error.response.data?.message) {
      errMsg = error.response.data.message;
    }
    alert(errMsg);
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

    <h2
      className="text-center mb-1 text-primary font-bold"
    >
      NovaCore ERP
    </h2>
    <p className="text-center text-secondary small mb-4">AI-Powered Enterprise Suite</p>

    {window.location.search.includes("expired=true") && (
      <div className="alert alert-warning text-center mb-3 py-2" style={{ fontSize: "13px" }}>
        Session Expired. Please log in again.
      </div>
    )}

    {!forgotMode ? (
      <>
        <input
          type="text"
          className="form-control mb-3"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />

        <input
          type="password"
          className="form-control mb-3"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {!otpSent ? (
          <button className="btn btn-primary w-100 mb-3" onClick={sendOtp}>
            Send OTP
          </button>
        ) : (
          <>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
            />
            <button className="btn btn-success w-100 mb-3" onClick={verifyOtp}>
              Verify OTP
            </button>
          </>
        )}

        <div className="text-center mt-2">
          <button className="btn btn-link text-decoration-none small text-primary p-0" onClick={() => setForgotMode(true)}>
            Forgot Password?
          </button>
        </div>
      </>
    ) : (
      <>
        <div className="alert alert-info py-2 text-center mb-3" style={{ fontSize: "12.5px" }}>
          🔑 Enter your registered email. We will email you an OTP verification code.
        </div>

        {resetError && (
          <div className="alert alert-danger py-2 text-center mb-3" style={{ fontSize: "12.5px" }}>
            ⚠️ {resetError}
          </div>
        )}

        <input
          type="email"
          className="form-control mb-3"
          placeholder="Registered Email"
          value={resetEmail}
          onChange={(e) => setResetEmail(e.target.value)}
          disabled={resetOtpSent}
        />

        {!resetOtpSent ? (
          <button className="btn btn-primary w-100 mb-3" onClick={handleRequestResetOtp}>
            Send Reset OTP
          </button>
        ) : (
          <>
            <input
              type="text"
              className="form-control mb-3"
              placeholder="Enter 6-digit Reset OTP"
              value={resetOtp}
              onChange={(e) => setResetOtp(e.target.value)}
            />

            <input
              type="password"
              className="form-control mb-3"
              placeholder="Choose New Password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
            />

            <button className="btn btn-success w-100 mb-3" onClick={handleResetPassword}>
              Reset & Update Password
            </button>
          </>
        )}

        <div className="text-center mt-2">
          <button className="btn btn-link text-decoration-none small text-secondary p-0" onClick={() => { setForgotMode(false); setResetOtpSent(false); setResetError(""); }}>
            Back to Login
          </button>
        </div>
      </>
    )}

  </div>

</div>


);
}

export default Login;
