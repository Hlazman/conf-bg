import React, { useEffect, useState, useContext } from "react";
import { Form, Input, InputNumber, Button, notification, Row, Col } from "antd";
import { useNavigate, useParams } from "react-router-dom";
import { gql, useQuery, useMutation } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import { GET_CLIENTS } from "./Clients";

const GET_CLIENT = gql`
  query GetClient($documentId: ID!) {
    client(documentId: $documentId) {
      documentId
      name
      email
      phone
      address
      discount
      company {
        documentId
      }
    }
  }
`;

const UPDATE_CLIENT = gql`
  mutation UpdateClient($documentId: ID!, $data: ClientInput!) {
    updateClient(documentId: $documentId, data: $data) {
      documentId
      name
    }
  }
`;

const EditClient = () => {
  const { documentId } = useParams();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const { translations } = useContext(LanguageContext);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [updateClient] = useMutation(UPDATE_CLIENT);

  // Получаем данные клиента
  const { data: clientData, loading: clientLoading } = useQuery(GET_CLIENT, {
    variables: { documentId },
    skip: !documentId,
    onCompleted: (data) => {
      // Заполняем форму данными с сервера
      if (data?.client) {
        form.setFieldsValue({
          name: data.client.name,
          email: data.client.email,
          phone: data.client.phone,
          address: data.client.address,
          discount: data.client.discount,
        });
        
        // Устанавливаем компанию
        if (data.client.company?.documentId) {
          const companyData = { documentId: data.client.company.documentId };
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

    const clientUpdateData = {
      name: values.name,
      email: values.email || null,
      phone: values.phone || "",
      address: values.address || "",
      discount: values.discount || 0,
      company: selectedCompany.documentId,
    };

    try {
      setLoading(true);
      await updateClient({
        variables: {
          documentId: documentId,
          data: clientUpdateData
        },
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
      
      api.success({
        message: translations.success,
        description: translations.clientUpdated,
        placement: "topRight",
      });
      
      navigate("/clients");
    } catch (error) {
      api.error({
        message: translations.err,
        description: translations.failedClientUpdate,
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
        <h2>{translations.editClient}</h2>
        <Form
          form={form}
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
          initialValues={{ discount: 0 }}
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
              {translations.save}
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

export default EditClient;
