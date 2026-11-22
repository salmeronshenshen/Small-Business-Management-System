
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// PAGES
import Login from "./pages/Logins";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboards";
import Categories from "./pages/Categories.";
import Products from "./pages/Products";
import Customers from "./pages/Customer";
import Orders from "./pages/Orders";
import Payments from "./pages/Payments";
import Inventory from "./pages/Inventorys";
import Reports from "./pages/Report";
import Users from "./pages/Users";
import CustomerDashboard from "./pages/CustomerDashboard";

// COMPONENTS
import ProtectedRoute from "./components/ProtectedRoute";

// CSS
import "./App.css";

// ROLE ACCESS
function RoleAccess({ allowedRoles, children }) {
  const user = JSON.parse(
    localStorage.getItem("user") || "{}"
  );

  if (!allowedRoles.includes(user.role)) {
    if (user.role === "Customer") {
      return <Navigate to="/customer-dashboard" replace />;
    }

    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route path="/" element={<Login />} />

        {/* REGISTER */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* DASHBOARD - ADMIN AND STAFF */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin", "Staff"]}>
                <Dashboard />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* PRODUCTS - ADMIN AND STAFF */}
        <Route
          path="/products"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin", "Staff"]}>
                <Products />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* ORDERS - ADMIN AND STAFF */}
        <Route
          path="/orders"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin", "Staff"]}>
                <Orders />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* PAYMENTS - ADMIN AND STAFF */}
        <Route
          path="/payments"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin", "Staff"]}>
                <Payments />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* CATEGORIES - ADMIN ONLY */}
        <Route
          path="/categories"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin"]}>
                <Categories />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* CUSTOMERS - ADMIN ONLY */}
        <Route
          path="/customers"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin"]}>
                <Customers />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* INVENTORY - ADMIN ONLY */}
        <Route
          path="/inventory"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin"]}>
                <Inventory />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* REPORTS - ADMIN ONLY */}
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin"]}>
                <Reports />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* USERS - ADMIN ONLY */}
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Admin"]}>
                <Users />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

        {/* CUSTOMER DASHBOARD - CUSTOMER ONLY */}
        <Route
          path="/customer-dashboard"
          element={
            <ProtectedRoute>
              <RoleAccess allowedRoles={["Customer"]}>
                <CustomerDashboard />
              </RoleAccess>
            </ProtectedRoute>
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
