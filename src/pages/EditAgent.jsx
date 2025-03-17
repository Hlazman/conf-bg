import React, { useEffect, useState, useContext } from "react";
import { Form, Input, InputNumber, Button, notification, Row, Col } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import { GET_AGENTS } from "./Agents";

const GET_AGENT = gql`
  query GetAgent($documentId: ID!) {
    agent(documentId: $documentId) {
      documentId
      name
      email
      phone
      agentFee
      company {
        documentId
      }
    }
  }
`;

const UPDATE_AGENT = gql`
  mutation UpdateAgent($documentId: ID!, $data: AgentInput!) {
    updateAgent(documentId: $documentId, data: $data) {
      documentId
      name
    }
  }
`;

const EditAgent = () => {
  const { documentId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [updateAgent] = useMutation(UPDATE_AGENT);

  // Получаем данные агента
  const { data: agentData, loading: agentLoading } = useQuery(GET_AGENT, {
    variables: { documentId },
    skip: !documentId,
    onCompleted: (data) => {
      // Заполняем форму данными с сервера
      if (data?.agent) {
        form.setFieldsValue({
          name: data.agent.name,
          email: data.agent.email,
          phone: data.agent.phone,
          agentFee: data.agent.agentFee,
        });
        
        // Устанавливаем компанию
        if (data.agent.company?.documentId) {
          const companyData = { documentId: data.agent.company.documentId };
          setSelectedCompany(companyData);
        }
      }
    }
  });

  useEffect(() => {
    if (!selectedCompany) {
      const companyData = JSON.parse(localStorage.getItem("selectedCompany"));
      if (companyData) {
        setSelectedCompany(companyData);
      }
    }
  }, []);

  const onFinish = async (values) => {
    if (!selectedCompany?.documentId || !documentId) return;

    const agentUpdateData = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || "",
      agentFee: values.agentFee || 0,
      company: selectedCompany.documentId,
    };

    try {
      setLoading(true);
      await updateAgent({
        variables: {
          documentId: documentId,
          data: agentUpdateData
        },
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
      
      api.success({
        message: translations.success,
        description: translations.agentUpdated,
        placement: "topRight",
      });
      
      navigate("/agents");
    } catch (error) {
      api.error({
        message: translations.err,
        description: translations.failedAgentUpdate,
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
        <h2>{translations.editAgent}</h2>
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
              {translations.save}
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

export default EditAgent;
