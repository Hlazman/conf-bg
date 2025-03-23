import React, { useEffect, useState, useContext } from "react";
import { Form, Input, InputNumber, Button, Select, notification, Row, Col } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import { GET_ORDERS } from "./Orders";
import { CurrencyContext } from "../context/CurrencyContext";

const GET_ORDER = gql`
  query GetOrder($documentId: ID!) {
    order(documentId: $documentId) {
      documentId
      orderNumber
      deliveryCost
      clientDiscount
      taxRate
      clientExtraPay
      comment
      agent {
        documentId
        name
      }
      client {
        documentId
        name
      }
      company {
        documentId
      }
    }
  }
`;

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

const UPDATE_ORDER = gql`
  mutation UpdateOrder($documentId: ID!, $data: OrderInput!) {
    updateOrder(documentId: $documentId, data: $data) {
      documentId
      orderNumber
    }
  }
`;

const EditOrder = () => {
  const { documentId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();

  const { currency, convertToEUR, convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext); // eslint-disable-line no-unused-vars
  
  const [updateOrder] = useMutation(UPDATE_ORDER);

  // Получаем данные заказа
  const { data: orderData, loading: orderLoading } = useQuery(GET_ORDER, {
    variables: { documentId },
    skip: !documentId
  });

  useEffect(() => {
    if (orderData?.order) {
      form.setFieldsValue({
        orderNumber: orderData.order.orderNumber,
        deliveryCost: convertFromEUR(orderData.order.deliveryCost),
        clientDiscount: orderData.order.clientDiscount,
        taxRate: orderData.order.taxRate,
        clientExtraPay: orderData.order.clientExtraPay,
        comment: orderData.order.comment,
        agent: orderData.order.agent?.documentId,
        client: orderData.order.client?.documentId,
      });
      
      // Устанавливаем компанию
      if (orderData.order.company?.documentId) {
        const companyData = {
          documentId: orderData.order.company.documentId
        };
        setSelectedCompany(companyData);
      }
    }
  }, [orderData, form, convertFromEUR]);

  useEffect(() => {
    if (!selectedCompany) {
      const companyData = JSON.parse(localStorage.getItem("selectedCompany"));
      if (companyData) {
        setSelectedCompany(companyData);
      }
    }
  }, [selectedCompany]);

  // Получаем список агентов и клиентов
  const { data: agentsClientsData, loading: queryLoading } = useQuery(GET_AGENTS_AND_CLIENTS, {
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
  
  const agents = agentsClientsData?.agents || [];
  const clients = agentsClientsData?.clients || [];

  const onFinish = async (values) => {
    if (!selectedCompany?.documentId || !documentId) return;
  
    const orderUpdateData = {
      orderNumber: values.orderNumber,
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
      await updateOrder({
        variables: { 
          documentId: documentId,
          data: orderUpdateData 
        },
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
          },
          {
            query: GET_ORDER,
            variables: { documentId }
          }
        ]
      });
      api.success({
        message: translations.success,
        description: translations.orderUpdatedSuc,
        placement: "topRight",
      });
      
      navigate("/orders");
    } catch (error) {
      api.error({
        message: translations.err,
        description: translations.failedOrderUpdate,
        placement: "topRight",
      });
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <>
      {contextHolder}
      <h2>{translations.editOrder}</h2>
      <Form 
        form={form} 
        layout="vertical" 
        onFinish={onFinish}
        initialValues={{
          deliveryCost: 0,
          clientDiscount: 0,
          clientExtraPay: 0,
        }}
        disabled={orderLoading}
      >
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
              <InputNumber style={{ width: "100%" }} addonAfter={'%'}/>
            </Form.Item>
          </Col>
          <Col span={6}>
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
            {translations.save}
          </Button>
        </Form.Item>
      </Form>
    </>
  );
};

export default EditOrder;
