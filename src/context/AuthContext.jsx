import React, { createContext, useState, useEffect } from "react";
import axios from "axios";
import { queryLink } from "../api/variables";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await axios.post(`${queryLink}/auth/local`, {
      identifier: email,
      password: password,
      
    });

    const userData = response.data;
    const companiesResponse = await axios.get(`${queryLink}/companies`, {
      headers: { Authorization: `Bearer ${userData.jwt}` }, // Передаём токен
    });

    setUser({ ...userData, companies: companiesResponse.data });
    localStorage.setItem("user", JSON.stringify({ ...userData, companies: companiesResponse.data }));

    window.location.href = "/";    
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("user");
    localStorage.removeItem("selectedCompany");
    window.location.href = "/login"; 
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
