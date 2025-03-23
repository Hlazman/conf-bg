import React, { useEffect, useState, useContext } from "react";
import { Form, Input, InputNumber, Button, notification, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { gql, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

// Запрос GET_AGENTS, который будем использовать для обновления списка
export const GET_AGENTS = gql`
  query GetAgents($filters: AgentFiltersInput, $pagination: PaginationArg) {
    agents(filters: $filters, pagination: $pagination) {
      documentId
      name
      email
      phone
      agentFee
    }
  }
`;

const CREATE_AGENT = gql`
  mutation CreateAgent($data: AgentInput!) {
    createAgent(data: $data) {
      documentId
      name
    }
  }
`;

const CreateAgent = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [createAgent] = useMutation(CREATE_AGENT);

  useEffect(() => {
    const companyData = JSON.parse(localStorage.getItem("selectedCompany"));
    if (companyData) {
      setSelectedCompany(companyData);
    }
  }, []);

  const onFinish = async (values) => {
    if (!selectedCompany?.documentId) return;

    const agentData = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || "",
      agentFee: values.agentFee || 0,
      company: selectedCompany.documentId,
    };

    try {
      setLoading(true);
      await createAgent({
        variables: { data: agentData },
        refetchQueries: [
          {
            query: GET_AGENTS,
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
      navigate("/agents");
      api.success({
        message: translations.success,
        description: translations.agentCreated,
        placement: "topRight",
      });
    } catch (error) {
      api.error({
        message: translations.err,
        description: translations.failedAgent,
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
        <h2>{translations.createAgent}</h2>
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
                label={translations.agentName}
                rules={[
                  {
                    required: true,
                    message: translations.pleaseEnterAgentName,
                  },
                ]}
              >
                <Input />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label={translations.email}
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
                name="agentFee"
                label={translations.agentFee}
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

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              style={{ marginRight: 10 }}
            >
              {translations.create}
            </Button>
            <Button onClick={() => navigate("/agents")}>
              {translations.cancel}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </>
  );
};

export default CreateAgent;
