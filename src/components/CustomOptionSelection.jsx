import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Typography, Spin, Button, message, Input, Form, Space, Modal, Card } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title, Text } = Typography;

// GraphQL запросы
const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
      customTitle
      productCostNetto
      amount
    }
  }
`;

const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
      customTitle
      productCostNetto
      amount
    }
  }
`;

const DELETE_SUBORDER_PRODUCT = gql`
  mutation DeleteSuborderProduct($documentId: ID!) {
    deleteSuborderProduct(documentId: $documentId) {
      documentId
    }
  }
`;

const GET_SUBORDER_PRODUCTS = gql`
  query GetSuborderProducts($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      customTitle
      productCostNetto
      amount
    }
  }
`;

const CustomOptionSelection = ({ suborderId, onAfterSubmit }) => {
  const [customOptions, setCustomOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [optionToDelete, setOptionToDelete] = useState(null);
  const { translations } = useContext(LanguageContext);

  // Получаем данные о существующих кастомных опциях для подзаказа
  const { data: customOptionsData, loading: loadingOptions, refetch: refetchOptions } = useQuery(GET_SUBORDER_PRODUCTS, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "customOption"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутации
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Опция успешно добавлена");
      refetchOptions();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
    }
  });

  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Опция успешно обновлена");
      refetchOptions();
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
    }
  });

  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Опция успешно удалена");
      refetchOptions();
    },
    onError: (error) => {
      message.error(`Ошибка при удалении: ${error.message}`);
    }
  });

  // Загружаем данные существующих опций при загрузке компонента
  useEffect(() => {
    if (!loadingOptions && customOptionsData) {
      if (customOptionsData.suborderProducts && customOptionsData.suborderProducts.length > 0) {
        const options = customOptionsData.suborderProducts.map(option => ({
          id: option.documentId,
          customTitle: option.customTitle || "",
          productCostNetto: option.productCostNetto || "",
          amount: option.amount || 1,
          isNew: false
        }));
        setCustomOptions(options);
      } else {
        // Если опций нет, добавляем одну пустую форму для создания
        addNewOption();
      }
    }
  }, [customOptionsData, loadingOptions]);

  // Добавление новой пустой опции
  const addNewOption = () => {
    setCustomOptions([...customOptions, {
      id: null,
      customTitle: "",
      productCostNetto: "",
      amount: 1,
      isNew: true
    }]);
  };

  // Обновление значений полей опции
  const handleOptionChange = (index, field, value) => {
    const updatedOptions = [...customOptions];
    updatedOptions[index][field] = value;
    setCustomOptions(updatedOptions);
  };

  // Сохранение опции
  const handleSaveOption = async (index) => {
    const option = customOptions[index];
    
    if (!option.customTitle) {
      message.error("Пожалуйста, введите название опции");
      return;
    }
    
    if (!option.productCostNetto) {
      message.error("Пожалуйста, введите цену опции");
      return;
    }

    setLoading(true);
    
    try {
      const optionData = {
        suborder: suborderId,
        type: "customOption",
        customTitle: option.customTitle,
        productCostNetto: parseFloat(option.productCostNetto),
        amount: parseInt(option.amount, 10) || 1
      };

      if (option.id) {
        // Обновление существующей опции
        await updateSuborderProduct({
          variables: {
            documentId: option.id,
            data: optionData
          }
        });
      } else {
        // Создание новой опции
        await createSuborderProduct({
          variables: {
            data: optionData
          }
        });
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }

    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // Открытие диалога подтверждения удаления
  const confirmDeleteOption = (index) => {
    const option = customOptions[index];
    if (!option.id) {
      // Если опция еще не сохранена, просто удаляем её из списка
      const updatedOptions = [...customOptions];
      updatedOptions.splice(index, 1);
      setCustomOptions(updatedOptions);
      return;
    }
    
    setOptionToDelete(index);
    setShowDeleteConfirm(true);
  };

  // Удаление опции
  const handleDeleteOption = async () => {
    if (optionToDelete === null) return;
    
    const option = customOptions[optionToDelete];
    setLoading(true);
    
    try {
      await deleteSuborderProduct({
        variables: {
          documentId: option.id
        }
      });
      
      // Удаляем опцию из локального состояния
      const updatedOptions = [...customOptions];
      updatedOptions.splice(optionToDelete, 1);
      setCustomOptions(updatedOptions);
      
      setShowDeleteConfirm(false);
      setOptionToDelete(null);
    } catch (error) {
      message.error(`Произошла ошибка при удалении: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>Загрузка данных о кастомных опциях...</p>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Title level={4}>Кастомные опции</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addNewOption}
          >
            Добавить опцию
          </Button>
        </Col>
      </Row>

      {customOptions.map((option, index) => (
        <Card 
          key={option.id || `new-option-${index}`} 
          style={{ marginBottom: "16px" }}
          title={option.id ? `Опция #${index + 1}` : "Новая опция"}
          extra={
            <Space>
              <Button
                type="primary"
                icon={<SaveOutlined />}
                onClick={() => handleSaveOption(index)}
                loading={loading}
                style={!option.id ? {} : { backgroundColor: '#52C41A' }}
              >
                {option.id ? translations.update : translations.save}
              </Button>
              <Button
                danger
                icon={<DeleteOutlined />}
                onClick={() => confirmDeleteOption(index)}
                loading={loading}
              >
                Удалить
              </Button>
            </Space>
          }
        >
          <Row gutter={16}>
            <Col span={10}>
              <Form.Item
                label="Название опции"
                required
              >
                <Input
                  placeholder="Введите название опции"
                  value={option.customTitle}
                  onChange={(e) => handleOptionChange(index, "customTitle", e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item
                label="Цена (Netto)"
                required
              >
                <Input
                  type="number"
                  placeholder="Введите цену"
                  value={option.productCostNetto}
                  onChange={(e) => handleOptionChange(index, "productCostNetto", e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={7}>
              <Form.Item
                label="Количество"
              >
                <Input
                  type="number"
                  placeholder="Количество"
                  value={option.amount}
                  min={1}
                  onChange={(e) => handleOptionChange(index, "amount", e.target.value)}
                />
              </Form.Item>
            </Col>
          </Row>
        </Card>
      ))}

      {customOptions.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Text type="secondary">Нет добавленных кастомных опций. Нажмите "Добавить опцию", чтобы создать новую.</Text>
        </div>
      )}

      <Modal
        title="Подтверждение удаления"
        open={showDeleteConfirm}
        onOk={handleDeleteOption}
        onCancel={() => setShowDeleteConfirm(false)}
        okText="Удалить"
        cancelText="Отмена"
      >
        <p>Вы уверены, что хотите удалить эту опцию?</p>
      </Modal>
    </div>
  );
};

export default CustomOptionSelection;
