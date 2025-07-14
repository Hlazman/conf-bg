import React, { useEffect, useState } from "react";
import { Row, Col, Typography, Descriptions, Divider, Select, message } from "antd";
import { useMutation, gql } from "@apollo/client";

const { Text } = Typography;
const { Option } = Select;

const UPDATE_ORDER = gql`
  mutation UpdateOrder($documentId: ID!, $data: OrderInput!) {
    updateOrder(documentId: $documentId, data: $data) {
      documentId
      metaData
    }
  }
`;

const CompanyInformationPresentation = ({ companyData, translations, isPdf, orderData }) => {
  const managers = companyData?.metaData?.managers || [];
  const hasManagers = managers.length > 0;

  // Находим индекс по сохраненному email
  const getInitialManagerIndex = () => {
    if (!orderData?.metaData?.selectedManagerEmail) return 0;
    const idx = managers.findIndex(
      (m) => m.email === orderData.metaData.selectedManagerEmail
    );
    return idx >= 0 ? idx : 0;
  };

  const [selectedManagerIndex, setSelectedManagerIndex] = useState(getInitialManagerIndex());

  useEffect(() => {
    setSelectedManagerIndex(getInitialManagerIndex());
    // eslint-disable-next-line
  }, [orderData]);

  const [updateOrder] = useMutation(UPDATE_ORDER);

  const handleManagerChange = async (idx) => {
    setSelectedManagerIndex(idx);

    // Собираем новые metaData с выбранным email менеджера
    const newMetaData = {
      ...orderData.metaData,
      selectedManagerEmail: managers[idx].email,
      selectedManagerName: managers[idx].name,
    };

    try {
      await updateOrder({
        variables: {
          documentId: orderData.documentId,
          data: {
            metaData: newMetaData,
          },
        },
      });
      message.success(translations.save);
    } catch (e) {
      message.error(translations.err);
    }
  };

  const selectedManager = managers[selectedManagerIndex] || {};

  return (
    <div className="company-information-presentation" style={{ marginTop: "40px" }}>
      <Divider orientation="center">
        {translations.company} {translations.information}
      </Divider>

      <Row gutter={16}>
        <Col span={6}>
          {companyData.logo?.url ? (
            <img
              src={`${process.env.REACT_APP_BASE_URL}${companyData.logo.url}`}
              alt={companyData.name || translations.noData}
              style={{ maxWidth: "100%", height: "auto", display: "block", margin: "0 auto" }}
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

        {hasManagers && !isPdf && (
          <div style={{ margin: 20 }}>
            <span style={{ fontWeight: "bold", paddingRight: "8px" }}>{translations.selectManager}</span>
            <Select
              style={{ minWidth: 220 }}
              value={selectedManagerIndex}
              onChange={handleManagerChange}
            >
              {managers.map((manager, idx) => (
                <Option key={idx} value={idx}>
                  {manager.name}
                </Option>
              ))}
            </Select>
          </div>
        )}

      </Row>

      <Divider />
      <div style={{ marginTop: "20px" }}>
        <Text>
          <span style={{ color: 'red', fontWeight: 'bold' }}> * </span>
          {translations.colorWarning}
        </Text>
      </div>
    </div>
  );
};

export default CompanyInformationPresentation;
