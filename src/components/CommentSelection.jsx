import React, { useState, useEffect, useContext } from "react";
import { Spin, Button, message, Input, Form, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

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

const CommentSelection = ({ suborderId, onAfterSubmit }) => {
  const [form] = Form.useForm();
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);

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
      message.success(translations.dataSaved);
      setSaving(false);
      refetchSuborder();
    },
    onError: (error) => {
      message.error(`${translations.saveError}: ${error.message}`);
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
      message.error(translations.err);
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

      if (onAfterSubmit) {
        await onAfterSubmit();
      }

    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  if (loadingSuborder) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>{translations.loading}</p>
      </div>
    );
  }

  return (
    <div>
      <Divider orientation="left">{translations.comment}</Divider> 
      <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center', marginBottom: 32, marginTop: -45 }}>
          <Button 
            type="primary" 
            onClick={handleSave} 
            loading={saving}
            style={!comment ? {} : { backgroundColor: '#52C41A' }}
          >
            {comment ? translations.update : translations.save}
          </Button>
      </div>
      
      <Form form={form} layout="vertical" initialValues={{ comment: "" }}>
        <Form.Item
          name="comment"
          rules={[{ required: false }]}
        >
          <TextArea 
            placeholder={translations.comment} 
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
