import React, { useEffect, useState } from "react";
import { Form, Input, InputNumber, Button, Select, message } from "antd";
import axios from "axios";
import { queryLink } from "../api/variables";

const CreateOrder = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState([]);
  const [clients, setClients] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);

  useEffect(() => {
    const userData = JSON.parse(localStorage.getItem("user"));
    const companyData = JSON.parse(localStorage.getItem("selectedCompany"));

    if (companyData) {
      setSelectedCompany(companyData);
      fetchAgentsAndClients(companyData.id, userData.jwt);
    }
  }, []);

  const fetchAgentsAndClients = async (companyId, token) => {
    try {
      const [agentsResponse, clientsResponse] = await Promise.all([
        axios.get(`${queryLink}/agents?filters[company][$eq]=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${queryLink}/clients?filters[company][$eq]=${companyId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setAgents(agentsResponse.data.data || []);
      setClients(clientsResponse.data.data || []);
    } catch (error) {
      console.error("Ошибка при загрузке агентов и клиентов:", error);
    }
  };

  const onFinish = async (values) => {
    const token = JSON.parse(localStorage.getItem("user"))?.jwt;
    if (!token) {
      message.error("Ошибка: Токен отсутствует");
      return;
    }

    const orderData = {
      data: {
        number: values.number,
        deliveryCost: values.deliveryCost || 0,
        clientDiscount: values.clientDiscount || 0,
        hiddenFee: values.hiddenFee || 0,
        taxRate: values.taxRate,
        clientExtraPay: values.clientExtraPay || 0,
        comment: values.comment || "",
        orderStatus: "payed",
        company: selectedCompany?.documentId || null,
        agent: values.agent ? agents.find(a => a.id === values.agent)?.documentId : null,
        client: values.client ? clients.find(c => c.id === values.client)?.documentId : null,
      },
    };

    console.log("Отправляемые данные:", JSON.stringify(orderData, null, 2));

    try {
      setLoading(true);
      const response = await axios.post(`${queryLink}/orders`, orderData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      message.success("Заказ успешно создан!");
      console.log("Заказ успешно создан:", response.data);
      form.resetFields();
    } catch (error) {
      console.error("Ошибка при создании заказа:", error.response?.data || error);
      message.error("Ошибка при создании заказа!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" onFinish={onFinish}>
      <Form.Item name="number" label="Номер заказа" rules={[{ required: true, message: "Введите номер заказа" }]}> 
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="taxRate" label="Налоговая ставка" rules={[{ required: true, message: "Введите налоговую ставку" }]}> 
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="deliveryCost" label="Стоимость доставки">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="clientDiscount" label="Скидка клиента">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="hiddenFee" label="Скрытая комиссия">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="clientExtraPay" label="Дополнительный платеж клиента">
        <InputNumber style={{ width: "100%" }} />
      </Form.Item>

      <Form.Item name="comment" label="Комментарий">
        <Input.TextArea rows={4} />
      </Form.Item>

      <Form.Item name="agent" label="Агент">
        <Select allowClear>
          {agents.map((agent) => (
            <Select.Option key={agent.id} value={agent.id}>
              {agent.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item name="client" label="Клиент">
        <Select allowClear>
          {clients.map((client) => (
            <Select.Option key={client.id} value={client.id}>
              {client.name}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={loading}>
          Создать заказ
        </Button>
      </Form.Item>
    </Form>
  );
};

export default CreateOrder;

