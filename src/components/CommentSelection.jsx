import React, { useState, useEffect } from "react";
import { Row, Col, Typography, Spin, Button, message, Input, Form } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";

const { Title } = Typography;
const { TextArea } = Input;

// GraphQL запросы
const UPDATE_SUBORDER = gql`
  mutation UpdateSuborder($documentId: ID!, $data: SuborderInput!) {
    updateSuborder(documentId: $documentId, data: $data) {
      documentId
      comment
    }
  }
`;

const GET_SUBORDER = gql`
  query GetSuborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      comment
    }
  }
`;

const CommentSelection = ({ suborderId }) => {
  const [form] = Form.useForm();
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  // Запрос для получения данных о субордере
  const { data: suborderData, loading: loadingSuborder, refetch: refetchSuborder } = useQuery(GET_SUBORDER, {
    variables: {
      documentId: suborderId
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для обновления комментария
  const [updateSuborder] = useMutation(UPDATE_SUBORDER, {
    onCompleted: () => {
      message.success("Комментарий успешно сохранен");
      setSaving(false);
      refetchSuborder();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

  // Загружаем данные существующего комментария при загрузке компонента
  useEffect(() => {
    if (!loadingSuborder && suborderData && suborderData.suborder) {
      const existingComment = suborderData.suborder.comment || "";
      setComment(existingComment);
      form.setFieldsValue({
        comment: existingComment
      });
    }
  }, [suborderData, loadingSuborder, form]);

  // Обработчик сохранения комментария
  const handleSave = async () => {
    if (!suborderId) {
      message.error("ID подзаказа не найден");
      return;
    }

    try {
      await form.validateFields();
    } catch (error) {
      return;
    }

    setSaving(true);

    try {
      const formValues = form.getFieldsValue();
      
      await updateSuborder({
        variables: {
          documentId: suborderId,
          data: {
            comment: formValues.comment
          }
        }
      });
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  if (loadingSuborder) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>Загрузка данных...</p>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Title level={4}>Комментарий</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            onClick={handleSave} 
            loading={saving}
          >
            Сохранить
          </Button>
        </Col>
      </Row>
      
      <Form form={form} layout="vertical" initialValues={{ comment: "" }}>
        <Form.Item
          name="comment"
          rules={[{ required: false }]}
        >
          <TextArea 
            placeholder="Введите комментарий к заказу" 
            onChange={(e) => setComment(e.target.value)} 
            rows={4}
            style={{ width: '100%' }}
          />
        </Form.Item>
      </Form>
    </div>
  );
};

export default CommentSelection;
