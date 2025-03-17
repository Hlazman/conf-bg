import React, { useEffect, useState, useContext } from "react";
import { Form, Input, InputNumber, Button, notification, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

// Определяем запрос GET_CLIENTS, который будем использовать для обновления списка
export const GET_CLIENTS = gql`
  query GetClients($filters: ClientFiltersInput) {
    clients(filters: $filters) {
      documentId
      name
      email
      phone
      address
      discount
    }
  }
`;

const CREATE_CLIENT = gql`
  mutation CreateClient($data: ClientInput!) {
    createClient(data: $data) {
      documentId
      name
    }
  }
`;

const CreateClient = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [createClient] = useMutation(CREATE_CLIENT);

  useEffect(() => {
    const companyData = JSON.parse(localStorage.getItem("selectedCompany"));
    if (companyData) {
      setSelectedCompany(companyData);
    }
  }, []);

  const onFinish = async (values) => {
    if (!selectedCompany?.documentId) return;

    const clientData = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || "",
      address: values.address || "",
      discount: values.discount || 0,
      company: selectedCompany.documentId,
    };

    try {
      setLoading(true);
      await createClient({
        variables: { data: clientData },
        refetchQueries: [
          {
            query: GET_CLIENTS,
            variables: {
              filters: {
                company: {
                  documentId: { eqi: selectedCompany?.documentId }
                }
              }
            }
          }
        ]
      });
      form.resetFields();
      navigate("/clients");
      api.success({
        message: translations.success,
        description: translations.clientCreated,
        placement: "topRight",
      });
    } catch (error) {
      api.error({
        message: translations.err,
        description: translations.failedClient,
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <div style={{ padding: "20px" }}>
        <h2>{translations.createClient}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label={translations.clientName}
                rules={[
                  {
                    required: true,
                    message: translations.pleaseEnterClientName,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={"Email"}
                rules={[
                  {
                    type: 'email',
                    message: translations.invalidEmail,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="phone"
                label={translations.phone}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="discount"
                label={translations.discount}
              >
                <InputNumber
                  min={0}
                  max={100}
                  style={{ width: "100%" }}
                  addonAfter="%"
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label={translations.address}
          >
            <Input.TextArea rows={4} />
          </Form.Item>

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ marginRight: 10 }}
            >
              {translations.create}
            </Button>
            <Button onClick={() => navigate("/clients")}>
              {translations.cancel}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default CreateClient;
