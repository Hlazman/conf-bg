import React, { useContext, useMemo, useEffect, useState } from "react";
import { Layout, Menu, Button, Dropdown, Select } from "antd";
import { UserOutlined, LogoutOutlined, GlobalOutlined, FileAddOutlined, UnorderedListOutlined, DownOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";

const { Header, Sider, Content } = Layout;

const GET_USER_COMPANIES = gql`
  query GetUserCompanies($filters: CompanyFiltersInput) {
    companies(filters: $filters) {
      name
      documentId
    }
  }
`;

const AppLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { setLanguage, translations } = useContext(LanguageContext);
  const location = useLocation();
  const [selectedCompany, setSelectedCompany] = useState(null);

  const isEditOrderPage = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    return pathParts[0] === "edit-order" && pathParts[1];
  }, [location.pathname]);
    
  const { data: companiesData } = useQuery(GET_USER_COMPANIES, {
    variables: { 
      filters: { 
        managers: { 
          documentId: { 
            eqi: user?.user?.documentId 
          } 
        } 
      } 
    },
    skip: !user?.user?.documentId,
  });
  
  const companies = useMemo(() => 
    companiesData?.companies || [], 
    [companiesData]
  );
  
  useEffect(() => {
    const storedCompany = localStorage.getItem("selectedCompany");
    
    if (storedCompany) {
      const company = companies.find(c => c.documentId === JSON.parse(storedCompany)?.documentId);
      
      if (company) {
        setSelectedCompany(company);
        return;
      }
    }
    if (companies.length > 0) {
      setSelectedCompany(companies[0]);
      localStorage.setItem("selectedCompany", JSON.stringify(companies[0]));
    }
  }, [companies]);

  const handleCompanyChange = (value) => {
    const company = companies.find((c) => c.documentId === value);
    setSelectedCompany(company);
    localStorage.setItem("selectedCompany", JSON.stringify(company));
    window.location.reload();
  };

  const handleMenuClick = ({ key }) => {
    setLanguage(key);
  };

  const pageTitle = useMemo(() => {
    const pathParts = location.pathname.split("/").filter(Boolean);
    if (pathParts[0] === "orders") {
      return pathParts[1] ? `${translations.order} #${pathParts[1]}` : translations.orders;
    }
    if (pathParts[0] === "create-order") return translations.createOrder;
    if (pathParts[0] === "edit-order" && pathParts[1]) return `${translations.editOrder || "Edit Order"} #${pathParts[1]}`;
    if (pathParts[0] === "product" && pathParts[1]) return `${translations.product} #${pathParts[1]}`;
    return translations.dashboard;
  }, [location.pathname, translations]);

  const menuItems = [
    { key: "createOrder", icon: <FileAddOutlined />, label: <Link to="/create-order">{translations.createOrder}</Link> },
    { key: "orders", icon: <UnorderedListOutlined />, label: <Link to="/orders">{translations.orders}</Link> },
    { key: "test", icon: <UnorderedListOutlined />, label: <Link to="/create-product">{'temp'}</Link> }, // TEMP
  ];

  const languageMenu = {
    items: [
      { key: "en", label: "English", onClick: () => handleMenuClick({ key: "en" }) },
      { key: "pl", label: "Polski", onClick: () => handleMenuClick({ key: "pl" }) },
      { key: "ua", label: "Українська", onClick: () => handleMenuClick({ key: "ua" }) },
    ],
  };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" width={220}>
        <div className="logo" style={{ height: 64, textAlign: "center", color: "white", lineHeight: "64px", fontSize: 18 }}>
          {"Configurator"}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["orders"]} items={menuItems} />
        <Dropdown menu={languageMenu} placement="bottomLeft">
          <Button type="text" icon={<GlobalOutlined />} style={{ color: "white", width: "100%", textAlign: "left" }}>
            {translations.language} <DownOutlined />
          </Button>
        </Dropdown>
      </Sider>

      <Layout>
        <Header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#001529", padding: "0 20px" }}>
          <div style={{ color: "#fff", fontSize: 18, fontWeight: 500 }}>{pageTitle}</div>
          <div style={{ display: "flex", alignItems: "center", gap: "15px" }}>
            <span style={{ color: "#fff" }}>
              <UserOutlined /> {user?.user.username}
            </span>
            <Select
              style={{ width: 200 }}
              value={selectedCompany?.documentId}
              onChange={handleCompanyChange}
              options={companies.map((c) => ({ value: c.documentId, label: c.name }))}
              disabled={isEditOrderPage}
            />
            <Button type="primary" icon={<LogoutOutlined />} onClick={logout}>
              {translations.logout}
            </Button>
          </div>
        </Header>
        <Content style={{ margin: "16px", padding: 24, background: "#fff", borderRadius: 8 }}>
          {children}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AppLayout;








