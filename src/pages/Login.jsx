import React, { useState, useContext } from "react";
import { Form, Input, Button, Checkbox, Select, Card, Typography, notification } from "antd";
import { useMutation } from "@apollo/client";
import { AuthContext } from "../context/AuthContext";
import { LanguageContext } from "../context/LanguageContext";
import { useNavigate } from "react-router-dom";
import { gql } from "graphql-tag";

const { Option } = Select;
const { Title } = Typography;

const LOGIN_MUTATION = gql`
  mutation Login($identifier: String!, $password: String!) {
    login(input: { identifier: $identifier, password: $password }) {
      jwt
      user {
        id
        username
        email
        documentId
      }
    }
  }
`;

const Login = () => {
  const { login } = useContext(AuthContext);
  const { language, setLanguage, translations } = useContext(LanguageContext);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [api, contextHolder] = notification.useNotification();
  const [loginMutation] = useMutation(LOGIN_MUTATION);

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const { data } = await loginMutation({
        variables: { identifier: values.email, password: values.password },
      });
      if (data?.login?.jwt) {
        await login(values.email, values.password);
        navigate("/");
      }
    } catch (error) {
      api.error({
        message: translations.loginError,
        description: translations.loginError,
        duration: 5,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#f0f2f5" }}>
      {contextHolder}
      <Card style={{ width: 400, padding: 20, boxShadow: "0px 4px 10px rgba(0, 0, 0, 0.1)" }}>
        <Title level={2} style={{ textAlign: "center" }}>{translations.loginTitle}</Title>
        <Form onFinish={onFinish} layout="vertical">
          <Form.Item label={translations.email} name="email" rules={[{ required: true, message: translations.emailRequired }]}>
            <Input />
          </Form.Item>
          <Form.Item label={translations.password} name="password" rules={[{ required: true, message: translations.passwordRequired }]}>
            <Input.Password />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked">
            <Checkbox>{translations.rememberMe}</Checkbox>
          </Form.Item>
          <Form.Item>
            <Select value={language} onChange={setLanguage}>
              <Option value="en">English</Option>
              <Option value="pl">Polski</Option>
              <Option value="ua">Українська</Option>
            </Select>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" loading={loading} block>
              {translations.loginButton}
            </Button>
          </Form.Item>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
