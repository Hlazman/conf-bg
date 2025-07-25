import React, { useContext, useMemo, useEffect, useState } from "react";
import { Layout, Menu, Button, Dropdown, Select } from "antd";
import { UserOutlined, LogoutOutlined, GlobalOutlined, FileAddOutlined, UnorderedListOutlined, DownOutlined, DollarOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { Link, useLocation } from "react-router-dom";
import { gql, useQuery } from "@apollo/client";
import { CurrencyContext } from "../context/CurrencyContext";

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

  const { currency, setCurrency } = useContext(CurrencyContext);

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
    // if (pathParts[0] === "edit-order" && pathParts[1]) return `${translations.editOrder} #${pathParts[1]}`;
    // if (pathParts[0] === "edit-client" && pathParts[1]) return `${translations.editClient} #${pathParts[1]}`;
    // if (pathParts[0] === "edit-agent" && pathParts[1]) return `${translations.editAgent} #${pathParts[1]}`;
    if (pathParts[0] === "edit-order") return `${translations.editOrder}`;
    if (pathParts[0] === "edit-client") return `${translations.editClient}`;
    if (pathParts[0] === "edit-agent") return `${translations.editAgent}`;
    if (pathParts[0] === "create-client") return `${translations.createClient}`;
    if (pathParts[0] === "create-agent") return `${translations.createAgent}`;
    if (pathParts[0] === "clients") return `${translations.clients}`;
    if (pathParts[0] === "agents") return `${translations.agents}`;
    if (pathParts[0] === "create-product") {
      const currentType = localStorage.getItem('currentType');
      if (currentType === "door") return translations.inDoor;
      if (currentType === "slidingDoor") return translations.sliDoor;
      if (currentType === "hiddenDoor") return translations.hiDoor;
    }
    if (pathParts[0] === "create-wallpanel") return `${translations.wallPanels}`;
    if (pathParts[0] === "create-skirting") return `${translations.skirting}`;
    if (pathParts[0] === "create-samples") return `${translations.samples}`;

    // if (pathParts[0] === "presentation") {
    //   if (pathParts[2] === "client") {
    //     return `${translations.presentation} #${pathParts[1]}`;
    //   } else if (pathParts[2] === "factory") {
    //     return `${translations.factory} #${pathParts[1]}`;
    //   }
    // }

    if (pathParts[0] === "presentation") {
      if (pathParts[2] === "client") {
        return `${translations.presentation} #${pathParts[1]}`;
      } else if (pathParts[2] === "factory") {
        return `${translations.factory} #${pathParts[1]}`;
      } else if (pathParts[2] === "short") {
        return `${translations.shortPresentation} #${pathParts[1]}`;
      }
    }
    
    return translations.dashboard;
  }, [location.pathname, translations]);

  const menuItems = [
    { key: "createOrder", icon: <FileAddOutlined />, label: <Link to="/create-order">{translations.createOrder}</Link> },
    { key: "orders", icon: <UnorderedListOutlined />, label: <Link to="/orders">{translations.orders}</Link> },
    { key: "clients", icon: <UnorderedListOutlined />, label: <Link to="/clients">{translations.clients}</Link> },
    { key: "Agents", icon: <UnorderedListOutlined />, label: <Link to="/agents">{translations.agents}</Link> },
    { 
      key: "Instruction", 
      icon: <InfoCircleOutlined />, 
      // label: <Link to="/agents">{translations.instruction}</Link>
      label: (
        <a
          href="https://personal-184.gitbook.io/configurator/"
          target="_blank"
          rel="noopener noreferrer"
        >
          {translations.instruction}
        </a>
      ), 
    },
  ];

  const languageMenu = {
    items: [
      { key: "en", label: "English", onClick: () => handleMenuClick({ key: "en" }) },
      { key: "pl", label: "Polski", onClick: () => handleMenuClick({ key: "pl" }) },
      { key: "ua", label: "Українська", onClick: () => handleMenuClick({ key: "ua" }) },
    ],
  };

    // Добавим меню для валют
    const currencyMenu = {
      items: [
        { key: "EUR", label: "Euro (€)", onClick: () => setCurrency("EUR") },
        { key: "Zloty", label: "Złoty (zł)", onClick: () => setCurrency("Zloty") },
      ],
    };

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider theme="dark" width={220}>
        <div className="logo" style={{ height: 64, textAlign: "center", color: "white", lineHeight: "64px", fontSize: 18 }}>
          {"Configurator"}
        </div>
        <Menu theme="dark" mode="inline" defaultSelectedKeys={["orders"]} items={menuItems} />
        
        <div style={{ marginTop: 15, marginBottom: 15,  }}>
          <Dropdown menu={languageMenu}>
            <Button type="text" icon={<GlobalOutlined />} style={{ color: "white", textAlign: "left" }}>
              {translations.language} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
        <div>
          <Dropdown menu={currencyMenu}>
            <Button type="text" icon={<DollarOutlined />} style={{ color: "white", textAlign: "left"}}>
              {currency} <DownOutlined />
            </Button>
          </Dropdown>
        </div>
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








