import React, { useEffect, useState, useContext } from "react";
import { Form, Input, InputNumber, Button, Select, notification, Row, Col } from "antd";
import { useNavigate } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import { GET_ORDERS } from './Orders';
import { CurrencyContext } from "../context/CurrencyContext";

const GET_AGENTS_AND_CLIENTS = gql`
  query GetAgentsAndClients($filters: AgentFiltersInput, $clientFilters: ClientFiltersInput) {
    agents(filters: $filters) {
      documentId
      name
    }
    clients(filters: $clientFilters) {
      documentId
      name
    }
  }
`;

const CREATE_ORDER = gql`
  mutation CreateOrder($data: OrderInput!) {
    createOrder(data: $data) {
      documentId
      orderNumber
    }
  }
`;

const CreateOrder = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  const { currency, convertToEUR, convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext); // eslint-disable-line no-unused-vars
  
  const [createOrder] = useMutation(CREATE_ORDER);

  useEffect(() => {
    const companyData = JSON.parse(localStorage.getItem("selectedCompany"));
    if (companyData) {
      setSelectedCompany(companyData);
    }
  }, []);

  const { data, loading: queryLoading, error } = useQuery(GET_AGENTS_AND_CLIENTS, { // eslint-disable-line no-unused-vars
    variables: { 
      filters: { 
        company: { 
          documentId: { 
            eqi: selectedCompany?.documentId 
          } 
        } 
      },
      clientFilters: {
        company: { 
          documentId: { 
            eqi: selectedCompany?.documentId 
          } 
        }
      }
    },
    skip: !selectedCompany?.documentId,
  });
  
  const agents = data?.agents || [];
  const clients = data?.clients || [];

  const onFinish = async (values) => {
    if (!selectedCompany?.documentId) return;
  
    const orderData = {
      orderNumber: values.orderNumber,
      // deliveryCost: values.deliveryCost || 0,
      deliveryCost: convertToEUR(values.deliveryCost) || 0,
      clientDiscount: values.clientDiscount || 0,
      taxRate: values.taxRate,
      clientExtraPay: values.clientExtraPay || 0,
      comment: values.comment || "",
      company: selectedCompany.documentId,
      agent: values.agent || null,
      client: values.client || null,
    };
  
    try {
      setLoading(true);
      await createOrder({
        variables: { data: orderData },
        refetchQueries: [
          {
            query: GET_ORDERS,
            variables: { 
              filters: { 
                company: { 
                  documentId: { 
                    eqi: selectedCompany?.documentId 
                  } 
                } 
              } 
            }
          }
        ]
      });
  
      form.resetFields();
      navigate("/orders");
    } catch (error) {
      api.error({
        message: translations.err,
        description: translations.faildOrder,
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {contextHolder}
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={16}>
          <Col span={6}>
            <Form.Item
              name="orderNumber"
              label={translations.orderNumber}
              rules={[{ required: true, message: translations.requiredField }]}
            >
              <Input style={{ width: "100%" }} />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item
              name="taxRate"
              label={translations.tax}
              rules={[{ required: true, message: translations.requiredField }]}
            >
              <InputNumber style={{ width: "100%" }} addonAfter={'%'} />
            </Form.Item>
          </Col>
          <Col span={6}>
            {/* <Form.Item name="deliveryCost" label={translations.deliveryCost}>
              <InputNumber style={{ width: "100%" }} addonAfter={'???'}/>
            </Form.Item> */}
            
            <Form.Item name="deliveryCost" label={translations.deliveryCost}>
              <InputNumber 
                style={{ width: "100%" }} 
                addonAfter={getCurrencySymbol()} 
              />
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="clientDiscount" label={translations.discount}>
              <InputNumber style={{ width: "100%" }} addonAfter={'%'}/>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={6}>
            <Form.Item name="clientExtraPay" label={translations.extraCharge}>
              <InputNumber style={{ width: "100%" }} addonAfter={'%'}/>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="agent" label={translations.agent}>
              <Select allowClear placeholder={translations.chooseAgent} loading={queryLoading}>
                <Select.Option value={''}>-</Select.Option>
                {agents.map((agent) => (
                  <Select.Option key={agent.documentId} value={agent.documentId}>
                    {agent.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={6}>
            <Form.Item name="client" label={translations.client}>
              <Select allowClear placeholder={translations.chooseClient} loading={queryLoading}>
                <Select.Option value={''}>-</Select.Option>
                {clients.map((client) => (
                  <Select.Option key={client.documentId} value={client.documentId}>
                    {client.name}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item name="comment" label={translations.comment}>
              <Input.TextArea rows={2} />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
          <Button type="primary" htmlType="submit" loading={loading} block>
            {translations.createOrder}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default CreateOrder;
