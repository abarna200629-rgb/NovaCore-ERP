import React from "react";
import { useNavigate } from "react-router-dom";
import { FaShieldAlt, FaHome, FaArrowLeft } from "react-icons/fa";
import MainLayout from "../layouts/MainLayout";

function Unauthorized() {
  const navigate = useNavigate();

  const handleGoBack = () => {
    if (document.referrer && document.referrer.includes(window.location.host)) {
      navigate(-1);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <MainLayout>
      <div className="container d-flex align-items-center justify-content-center" style={{ minHeight: "75vh" }}>
        <style>{`
          .unauthorized-card {
            background: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
            border: 1px solid rgba(220, 38, 38, 0.15);
            border-radius: 24px;
            box-shadow: 0 20px 40px rgba(0, 0, 0, 0.05);
            padding: 48px;
            max-width: 550px;
            text-align: center;
            transition: all 0.3s ease;
          }
          .unauthorized-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 30px 60px rgba(220, 38, 38, 0.08);
          }
          .shield-icon-container {
            background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
            width: 100px;
            height: 100px;
            border-radius: 50px;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 28px;
            animation: pulse-red 2s infinite;
          }
          @keyframes pulse-red {
            0% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
            }
            70% {
              box-shadow: 0 0 0 20px rgba(239, 68, 68, 0);
            }
            100% {
              box-shadow: 0 0 0 0 rgba(239, 68, 68, 0);
            }
          }
        `}</style>

        <div className="unauthorized-card">
          <div className="shield-icon-container">
            <FaShieldAlt className="text-danger" style={{ fontSize: "48px" }} />
          </div>
          <h2 className="font-bold text-dark mb-3" style={{ fontSize: "28px", letterSpacing: "-0.5px" }}>
            Access Denied
          </h2>
          <p className="text-secondary mb-4 mx-auto" style={{ maxWidth: "400px", fontSize: "15px", lineHeight: "1.6" }}>
            Your current role does not have authorization to view this module. Please contact your system administrator if you believe this is an error.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <button 
              onClick={handleGoBack} 
              className="btn btn-light px-4 py-2 d-flex align-items-center gap-2"
              style={{ borderRadius: "12px", border: "1px solid #e2e8f0", fontWeight: "600" }}
            >
              <FaArrowLeft /> Go Back
            </button>
            <button 
              onClick={() => navigate("/dashboard")} 
              className="btn btn-primary px-4 py-2 d-flex align-items-center gap-2"
              style={{ borderRadius: "12px", fontWeight: "600", background: "linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)", border: "none" }}
            >
              <FaHome /> Return Dashboard
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}

export default Unauthorized;
