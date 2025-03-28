import React from "react";
import { Row, Col, Typography, Descriptions, Divider } from "antd";

const { Title, Text } = Typography;

const CompanyInformationPresentation = ({ companyData, translations }) => {
  if (!companyData) return null;

  return (
    <div className="company-information-presentation" style={{ marginTop: "40px" }}>
      <Divider orientation="center">{translations.company} {translations.information}</Divider>
      <Row gutter={16}>
        {/* Логотип компании */}
        <Col span={6}>
          {companyData.logo?.url ? (
            <img 
              src={`https://dev.api.boki-groupe.com${companyData.logo.url}`} 
              alt={companyData.name || translations.noData} 
              style={{ maxWidth: "100%", height: "auto", display: 'block', margin : '0 auto' }}
            />
          ) : (
            <div style={{ 
              width: "100%", 
              height: "100px", 
              backgroundColor: "#f0f0f0", 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center" 
            }}>
              {translations.noLogo}
            </div>
          )}
        </Col>

        {/* Информация о компании */}
        <Col span={18}>
          <Descriptions bordered column={1} size="small">
            <Descriptions.Item label={translations.name}>
              {companyData.name || translations.noData}
            </Descriptions.Item>
            <Descriptions.Item label={translations.phone}>
              {companyData.phone || translations.noData}
            </Descriptions.Item>
            <Descriptions.Item label={translations.email}>
              {companyData.email || translations.noData}
            </Descriptions.Item>
            <Descriptions.Item label={translations.site}>
              {companyData.site || translations.noData}
            </Descriptions.Item>
            <Descriptions.Item label={translations.address}>
              {companyData.address || translations.noData}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>

      {/* Текстовое предупреждение */}
      <Divider/>
      <div style={{ marginTop: "20px" }}>
        <Text>
          <span style={{color: 'red', fontWeight: 'bold'}}> * </span> 
          {translations.colorWarning}
        </Text>
      </div>
    </div>
  );
};

export default CompanyInformationPresentation;