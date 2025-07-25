import React, { useState } from "react";
import { Row, Col, Typography, Descriptions, Divider, Select  } from "antd";

const { Text } = Typography;
const { Option } = Select;
const baseUrl = process.env.REACT_APP_BASE_URL;

const CompanyInformationPresentation = ({ companyData, translations, isPdf, orderData }) => {
  const [selectedManagerIndex, setSelectedManagerIndex] = useState(0);

  if (!companyData) return null;

  // Получаем список менеджеров из metaData
  const managers = companyData.metaData?.managers || [];
  const hasManagers = managers.length > 0;

  // Для режима PDF всегда показываем первого менеджера (или пустой объект)
  const selectedManager = isPdf
    ? (managers[0] || {})
    : (managers[selectedManagerIndex] || {});

  // Показывать ли блок с менеджерами
  const showManagerBlock = hasManagers && (!isPdf || (isPdf && managers.length > 0));

  return (
    <div className="company-information-presentation" style={{ marginTop: "40px" }}>
      <Divider orientation="center">{translations.company} {translations.information}</Divider>
      <Row gutter={16}>
        {/* Логотип компании */}
        <Col span={6}>
          {companyData.logo?.url ? (
            <img 
              // src={`https://dev.api.boki-groupe.com${companyData.logo.url}`} 
              src={`${baseUrl}${companyData.logo.url}`} 
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
            <Descriptions.Item label={translations.company}>
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

            <Descriptions.Item label={translations.manager}>
              <span>{selectedManager.name}</span>
              <span style={{ margin: "0 10px" }}>|</span>
              <span>{selectedManager.email}</span>
            </Descriptions.Item>

          </Descriptions>
        </Col>
        
          {showManagerBlock && (
            <>
              {!isPdf && (
                <div style={{ margin: 20 }}>
                  <span style={{fontWeight: 'bold', paddingRight: '8px'}}>{translations.selectManager} </span> 
                  <Select
                    style={{ minWidth: 220 }}
                    value={selectedManagerIndex}
                    onChange={setSelectedManagerIndex}
                  >
                    {managers.map((manager, idx) => (
                      <Option key={idx} value={idx}>
                        {manager.name}
                      </Option>
                    ))}
                  </Select>
                </div>
              )}
            </>
          )}

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