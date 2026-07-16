import { API_BASE_URL } from "../config";
import { useEffect, useState } from "react";
import axios from "axios";
import MainLayout from "../layouts/MainLayout";
import {
  FaUsers,
  FaBoxOpen,
  FaChartLine,
  FaHandshake,
  FaBuilding,
  FaEye,
  FaRocket,
  FaInfoCircle,
  FaEnvelope,
  FaPhone,
  FaMapMarkerAlt,
  FaCogs,
  FaArrowRight
} from "react-icons/fa";
import { Link } from "react-router-dom";

function Home() {
  const username = localStorage.getItem("username") || "User";
  const rawRole = localStorage.getItem("role");
  const role = rawRole ? rawRole.trim().toUpperCase().replace("ROLE_", "") : "";
  const getDashboardPath = () => {
    if (role === "ADMIN") return "/dashboard";
    if (role === "HR") return "/hr-dashboard";
    if (role === "EMPLOYEE") return "/employee-dashboard";
    if (role === "SALES") return "/sales-dashboard";
    if (role === "FINANCE") return "/finance-dashboard";
    if (role === "INVENTORY") return "/inventory-dashboard";
    if (role === "PRODUCTION") return "/production-dashboard";
    if (role === "MANAGER") return "/manager-dashboard";
    return "/dashboard";
  };
  const [stats, setStats] = useState({
    employees: 0,
    products: 0,
    salesCount: 0,
    customerCount: 0
  });
  const [loading, setLoading] = useState(true);

  const API_URL = API_BASE_URL + "/api/dashboard";

  const getConfig = () => {
    const token = localStorage.getItem("token");
    return {
      headers: { Authorization: `Bearer ${token}` }
    };
  };

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await axios.get(API_URL, getConfig());
        setStats({
          employees: response.data.employees || 0,
          products: response.data.products || 0,
          salesCount: response.data.salesCount || 0,
          customerCount: response.data.customerCount || 0
        });
      } catch (error) {
        console.error("Error loading home page statistics:", error);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  return (
    <MainLayout>
      <div className="container-fluid py-4 px-md-5">
        
        {/* Professional Hero Banner */}
        <div 
          className="hero-banner p-5 mb-5 text-white position-relative overflow-hidden"
          style={{
            background: "linear-gradient(135deg, #1e3a8a 0%, #3b82f6 50%, #0d9488 100%)",
            borderRadius: "24px",
            boxShadow: "0 10px 30px rgba(59, 130, 246, 0.2)"
          }}
        >
          {/* Decorative shapes */}
          <div 
            className="position-absolute"
            style={{
              width: "300px",
              height: "300px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              top: "-50px",
              right: "-50px"
            }}
          />
          <div 
            className="position-absolute"
            style={{
              width: "150px",
              height: "150px",
              background: "rgba(255, 255, 255, 0.05)",
              borderRadius: "50%",
              bottom: "-30px",
              left: "10%"
            }}
          />

          <div className="row align-items-center position-relative" style={{ zIndex: 2 }}>
            <div className="col-lg-7">
              <div className="d-flex align-items-center gap-3 mb-3">
                {/* Modern Brand Logo */}
                <div 
                  className="d-flex align-items-center justify-content-center"
                  style={{
                    width: "50px",
                    height: "50px",
                    background: "rgba(255, 255, 255, 0.2)",
                    backdropFilter: "blur(10px)",
                    borderRadius: "12px",
                    border: "1px solid rgba(255, 255, 255, 0.3)"
                  }}
                >
                  <FaCogs size={26} className="text-white" />
                </div>
                <h4 className="m-0 font-bold tracking-wider text-white">ERP CORE PRO</h4>
              </div>
              <h1 className="display-4 font-black mb-3 text-white">
                Welcome back, {username}!
              </h1>
              <p className="lead mb-4 text-white-50" style={{ maxWidth: "600px" }}>
                Unify your workforce, streamline supply chains, track financials, and scale operations with intelligence.
              </p>
              <div className="d-flex gap-3">
                <Link to={getDashboardPath()} className="btn btn-light btn-lg px-4 font-bold shadow-sm d-flex align-items-center gap-2">
                  Launch Dashboard <FaArrowRight size={14} />
                </Link>
                <Link to="/ai-hub" className="btn btn-outline-light btn-lg px-4 font-semibold">
                  AI Hub
                </Link>
              </div>
            </div>
            <div className="col-lg-5 d-none d-lg-block text-center">
              <div 
                className="glass-panel p-4 mx-auto"
                style={{
                  width: "280px",
                  background: "rgba(255, 255, 255, 0.1)",
                  border: "1px solid rgba(255, 255, 255, 0.2)",
                  borderRadius: "20px",
                  backdropFilter: "blur(15px)"
                }}
              >
                <h6 className="text-white-50 mb-1">System Status</h6>
                <div className="d-flex align-items-center justify-content-center gap-2 mb-3">
                  <span className="badge bg-success rounded-circle" style={{ width: "10px", height: "10px", padding: 0 }}></span>
                  <span className="text-white font-semibold">Operational</span>
                </div>
                <hr className="bg-white opacity-20" />
                <p className="small text-white-50 m-0">Core services synchronized successfully.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Statistics Grid */}
        <h4 className="font-bold mb-4 text-primary d-flex align-items-center gap-2">
          <FaBuilding /> Enterprise At A Glance
        </h4>
        <div className="row mb-5">
          {[
            { title: "Active Employees", value: stats.employees, icon: <FaUsers size={28} />, color: "primary" },
            { title: "Catalog Products", value: stats.products, icon: <FaBoxOpen size={28} />, color: "success" },
            { title: "Sales Invoices", value: stats.salesCount, icon: <FaChartLine size={28} />, color: "info" },
            { title: "Corporate Clients", value: stats.customerCount, icon: <FaHandshake size={28} />, color: "warning" }
          ].map((card, idx) => (
            <div key={idx} className="col-sm-6 col-lg-3 mb-4">
              <div className="card border-0 shadow-sm p-4 h-100 position-relative overflow-hidden" style={{ borderRadius: "16px" }}>
                <div className="d-flex align-items-center justify-content-between mb-3">
                  <h6 className="text-secondary font-semibold m-0">{card.title}</h6>
                  <div className={`text-${card.color} opacity-80`}>
                    {card.icon}
                  </div>
                </div>
                {loading ? (
                  <div className="spinner-border spinner-border-sm text-secondary" role="status"></div>
                ) : (
                  <h3 className="font-black m-0">{card.value.toLocaleString()}</h3>
                )}
                {/* Decorative border accent */}
                <div 
                  className={`position-absolute bg-${card.color}`} 
                  style={{
                    width: "4px",
                    height: "100%",
                    left: 0,
                    top: 0
                  }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* About, Vision & Mission Section */}
        <div className="row mb-5">
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm p-4 h-100" style={{ borderRadius: "16px" }}>
              <h5 className="font-bold mb-3 text-primary d-flex align-items-center gap-2">
                <FaInfoCircle /> About NovaCore ERP
              </h5>
              <p className="text-secondary mb-3 leading-relaxed">
                NovaCore ERP is a fully integrated, state-of-the-art enterprise resource planning platform designed to unify all your core operational business flows. From robust Human Resource Management and Payroll configurations to Inventory Catalog tracking, Production Pipelines, Billing Ledgers, and advanced AI-driven forecasts, NovaCore ERP helps your enterprise maintain full control, transparency, and efficiency.
              </p>
              <p className="text-secondary leading-relaxed">
                With a responsive, modern interface and dual-language (Tamil & English) UI support, it ensures seamless accessibility and ease of use across your entire workforce.
              </p>
            </div>
          </div>
          <div className="col-lg-6 mb-4">
            <div className="card border-0 shadow-sm p-4 h-100 d-flex flex-column justify-content-between" style={{ borderRadius: "16px" }}>
              <div>
                <h5 className="font-bold mb-3 text-primary d-flex align-items-center gap-2">
                  <FaEye /> Vision & Mission
                </h5>
                <div className="mb-4">
                  <span className="badge bg-primary-soft text-primary font-bold mb-2 px-3 py-1">OUR VISION</span>
                  <p className="text-secondary m-0 leading-relaxed italic">
                    "To empower global enterprises with cognitive automation and real-time operational alignment, making complex business workflows simple and smart."
                  </p>
                </div>
                <div className="mb-2">
                  <span className="badge bg-success-soft text-success font-bold mb-2 px-3 py-1">OUR MISSION</span>
                  <p className="text-secondary m-0 leading-relaxed">
                    "To deliver reliable, secured, and modular ERP modules that streamline human resources, finance, inventory, and sales pipelines through a unified and accessible interface."
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Features Overview */}
        <h4 className="font-bold mb-4 text-primary d-flex align-items-center gap-2">
          <FaRocket /> Platform Features Overview
        </h4>
        <div className="row mb-5">
          {[
            { title: "Human Resources", desc: "Automate recruitment onboarding, employee records, attendance check-ins, leave approvals, payroll ledgers, and performance reviews." },
            { title: "Inventory & Supply", desc: "Track stock items, set automatic reorder alarms, manage suppliers catalog, and organize incoming purchase orders." },
            { title: "Finance & Accounting", desc: "Monitor cash inflows/outflows, generate balance sheets, Cash Flow statements, tax reports, and invoice archives." },
            { title: "Sales & CRM", desc: "Execute client orders, trace performance against monthly sales targets, and compile detailed sales logs." },
            { title: "Production Pipeline", desc: "Schedule machine tasks, deduct raw material stock, perform quality checks, and track production pipelines." },
            { title: "AI Cognitive Hub", desc: "Simulate market actions, analyze fraud risks, audit carbon footprints, and run real-time predictive maintenance." }
          ].map((feat, idx) => (
            <div key={idx} className="col-md-6 col-lg-4 mb-4">
              <div className="card border-0 shadow-sm p-4 h-100 hover-lift" style={{ borderRadius: "16px", transition: "transform 0.2s" }}>
                <h6 className="font-bold mb-2 text-dark">{feat.title}</h6>
                <p className="text-secondary small leading-relaxed m-0">{feat.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Contact Info Footer */}
        <div 
          className="card border-0 p-4 text-white text-center"
          style={{
            background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)",
            borderRadius: "20px"
          }}
        >
          <h5 className="font-bold mb-3 text-white">Need Technical Support or Consultation?</h5>
          <div className="d-flex flex-wrap justify-content-center gap-4">
            <span className="d-flex align-items-center gap-2 text-white-50">
              <FaEnvelope className="text-primary" /> support@novacoreerp.com
            </span>
            <span className="d-flex align-items-center gap-2 text-white-50">
              <FaPhone className="text-success" /> +1 (555) 234-5678
            </span>
            <span className="d-flex align-items-center gap-2 text-white-50">
              <FaMapMarkerAlt className="text-danger" /> Tech City Headquarters, Suite 400
            </span>
          </div>
          <hr className="bg-white opacity-10 my-3" />
          <p className="small text-white-50 m-0">© {new Date().getFullYear()} NovaCore ERP. All rights reserved.</p>
        </div>

      </div>
    </MainLayout>
  );
}

export default Home;
