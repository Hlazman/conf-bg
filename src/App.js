import React, { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "./context/AuthContext";
import Orders from "./pages/Orders";
import CreateOrder from "./pages/CreateOrder";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import EditOrder from "./pages/EditOrder";
import './App.css';
import CreateProduct from "./pages/CreateProduct";
import CreateClient from "./pages/CreateClient";
import EditClient from "./pages/EditClient";
import Clients from "./pages/Clients";
import CreateAgent from "./pages/CreateAgent";
import EditAgent from "./pages/EditAgent";
import Agents from "./pages/Agents";

const App = () => {
  const { user } = React.useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      localStorage.setItem("lastPage", location.pathname);
    }
  }, [location.pathname, user]);

  useEffect(() => {
    if (user) {
      const lastPage = localStorage.getItem("lastPage") || "/orders";
      navigate(lastPage);
    }
  }, [user, navigate]);

  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          user ? (
            <Layout>
              <Routes>
                <Route path="/orders" element={<Orders />} />
                <Route path="/create-order" element={<CreateOrder />} />
                <Route path="/edit-order/:documentId" element={<EditOrder />} />
                <Route path="/create-product" element={<CreateProduct />} />
                <Route path="/create-client" element={<CreateClient />} />
                <Route path="/clients" element={<Clients />} />
                <Route path="/edit-client/:documentId" element={<EditClient />} />
                <Route path="/create-agent" element={<CreateAgent />} />
                <Route path="/agents" element={<Agents />} />
                <Route path="/edit-agent/:documentId" element={<EditAgent />} />
                <Route path="*" element={<Orders />} /> 
              </Routes>
            </Layout>
          ) : (
            <Login />
          )
        }
      />
    </Routes>
  );
};

export default App;
