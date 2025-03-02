import React, { useContext, useMemo, useEffect, useState } from "react";
import { Layout, Menu, Button, Dropdown, Select } from "antd";
import { UserOutlined, LogoutOutlined, GlobalOutlined, FileAddOutlined, UnorderedListOutlined, DownOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { Link, useLocation } from "react-router-dom";

const { Header, Sider, Content } = Layout;

const AppLayout = ({ children }) => {
  const { user, logout } = useContext(AuthContext);
  const { setLanguage, translations } = useContext(LanguageContext);
  const location = useLocation();
  const [selectedCompany, setSelectedCompany] = useState(null);

  const companies = useMemo(() => user?.companies?.data || [], [user?.companies]);

  useEffect(() => {
    const storedCompany = localStorage.getItem("selectedCompany");
    if (storedCompany) {
      const company = companies.find(c => c.id === JSON.parse(storedCompany)?.id);
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
    const company = companies.find((c) => c.id === value);
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
    if (pathParts[0] === "product" && pathParts[1]) return `${translations.product} #${pathParts[1]}`;
    return translations.dashboard;
  }, [location.pathname, translations]);

  const menuItems = [
    { key: "createOrder", icon: <FileAddOutlined />, label: <Link to="/create-order">{translations.createOrder}</Link> },
    { key: "orders", icon: <UnorderedListOutlined />, label: <Link to="/orders">{translations.orders}</Link> },
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
              value={selectedCompany?.id}
              onChange={handleCompanyChange}
              options={companies.map((c) => ({ value: c.id, label: c.name }))}
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