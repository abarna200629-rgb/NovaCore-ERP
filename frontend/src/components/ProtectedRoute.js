import { Navigate } from "react-router-dom";

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

function ProtectedRoute({
  children,
  allowedRoles
}) {
  const token = localStorage.getItem("token");
  let rawRole = localStorage.getItem("role");

  // Fallback: If rawRole is missing or undefined, extract from JWT
  if ((!rawRole || rawRole === "undefined" || rawRole === "null") && token) {
    const decoded = decodeToken(token);
    if (decoded && decoded.role) {
      rawRole = decoded.role;
      localStorage.setItem("role", rawRole);
    }
  }

  const role = rawRole ? rawRole.trim().toUpperCase().replace("ROLE_", "") : "";
  const normalizedAllowedRoles = allowedRoles ? allowedRoles.map(r => r.trim().toUpperCase().replace("ROLE_", "")) : [];

  console.log("ProtectedRoute - path:", window.location.pathname);
  console.log("ProtectedRoute - token:", token ? "Exists" : "Null");
  console.log("ProtectedRoute - rawRole:", rawRole);
  console.log("ProtectedRoute - parsedRole:", role);
  console.log("ProtectedRoute - allowedRoles:", allowedRoles);
  console.log("ProtectedRoute - normalizedAllowedRoles:", normalizedAllowedRoles);
  console.log("ProtectedRoute - allowed:", allowedRoles ? normalizedAllowedRoles.includes(role) : true);

  // Not Logged In
  if (!token) {
    return <Navigate to="/" />;
  }

  // First Login Force Password Change
  const isFirstLogin = localStorage.getItem("firstLogin") === "true";
  if (isFirstLogin && window.location.pathname !== "/change-password") {
    return <Navigate to="/change-password" />;
  }

  // Role Check
  const username = localStorage.getItem("username");
  const employeeId = localStorage.getItem("employeeId");
  const isEmployee = role === "EMPLOYEE" || !!employeeId || (username && username.startsWith("EMP"));

  const isAllowed = allowedRoles ? (
    normalizedAllowedRoles.includes(role) ||
    (normalizedAllowedRoles.includes("EMPLOYEE") && isEmployee)
  ) : true;

  if (!isAllowed) {
    return (
      <Navigate
        to="/unauthorized"
      />
    );
  }

  return children;
}

export default ProtectedRoute;