import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ApolloProvider } from "@apollo/client";
import { client } from "./api/apolloClient"; 
import { AuthProvider } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import Login from "./pages/Login";
import App from "./App";
import "antd/dist/reset.css";
import '@ant-design/v5-patch-for-react-19';

// const root = ReactDOM.createRoot(document.getElementById("root"));
// root.render(
//   <React.StrictMode>
//     <ApolloProvider client={client}>
//       <AuthProvider>
//         <LanguageProvider>
//           <Router>
//             <Routes>
//               <Route path="/login" element={<Login />} />
//               <Route path="/*" element={<App />} />
//               <Route path="*" element={<Navigate to="/" />} />
//             </Routes>
//           </Router>
//         </LanguageProvider>
//       </AuthProvider>
//     </ApolloProvider>
//   </React.StrictMode>
// );

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <AuthProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <Router>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/*" element={<App />} />
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </Router>
          </CurrencyProvider>
        </LanguageProvider>
      </AuthProvider>
    </ApolloProvider>
  </React.StrictMode>
);




