import React, { useState, useEffect, useContext } from "react";
import { Row, Col, Typography, Spin, Button, message, Input, Form, Space, Modal, Card } from "antd";
import { PlusOutlined, DeleteOutlined, SaveOutlined } from "@ant-design/icons";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

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

// const GET_SUBORDER_PRODUCTS = gql`
//   query GetSuborderProducts($filters: SuborderProductFiltersInput) {
//     suborderProducts(filters: $filters) {
//       documentId
//       customTitle
//       productCostNetto
//       amount
//     }
//   }
// `;

const GET_SUBORDER_PRODUCTS = gql`
  query GetSuborderProducts($filters: SuborderProductFiltersInput, $pagination: PaginationArg) {
    suborderProducts(filters: $filters, pagination: $pagination) {
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

  const { convertToEUR, convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

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
      },
      pagination: {
        limit: 100
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутации
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      refetchOptions();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
    }
  });

  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.editError);
      refetchOptions();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
    }
  });

  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      refetchOptions();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
    }
  });

  // Загружаем данные существующих опций при загрузке компонента
  useEffect(() => {
    if (!loadingOptions && customOptionsData) {
      if (customOptionsData.suborderProducts && customOptionsData.suborderProducts.length > 0) {
        const options = customOptionsData.suborderProducts.map(option => ({
          id: option.documentId,
          customTitle: option.customTitle || "",
          // productCostNetto: option.productCostNetto || "",
          productCostNetto: convertFromEUR(option.productCostNetto) || "",
          amount: option.amount || 1,
          isNew: false
        }));
        setCustomOptions(options);
      } else {
        // Если опций нет, добавляем одну пустую форму для создания
        addNewOption();
      }
    }
  // }, [customOptionsData, loadingOptions]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customOptionsData, loadingOptions, convertFromEUR]);

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
      message.error(translations.enterTitle);
      return;
    }
    
    if (!option.productCostNetto) {
      message.error(translations.enterPrice);
      return;
    }

    setLoading(true);
    
    try {
      const optionData = {
        suborder: suborderId,
        type: "customOption",
        customTitle: option.customTitle,
        // productCostNetto: parseFloat(option.productCostNetto),
        productCostNetto: convertToEUR(parseFloat(option.productCostNetto)),
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
      message.error(`${translations.err}: ${error.message}`);
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
      message.error(`${translations.deleteError}: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>{translations.loading}</p>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Title level={5}>{translations.customOptions}</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            icon={<PlusOutlined />} 
            onClick={addNewOption}
          >
            {translations.add} {translations.customOption}
          </Button>
        </Col>
      </Row>

      {customOptions.map((option, index) => (
        <Card 
          key={option.id || `new-option-${index}`} 
          style={{ marginBottom: "16px" }}
          title={option.id ? `${translations.option} #${index + 1}` : translations.newOption}
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
                {translations.delete}
              </Button>
            </Space>
          }
        >
          <Row gutter={20}>
            <Col span={8}>
              <Form.Item
                label={translations.title}
                required
              >
                <Input
                  placeholder={translations.enterTitle}
                  value={option.customTitle}
                  onChange={(e) => handleOptionChange(index, "customTitle", e.target.value)}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={`${translations.price} (Netto)`}
                required
              >
                <Input
                  type="number"
                  placeholder={translations.enterPrice}
                  value={option.productCostNetto}
                  onChange={(e) => handleOptionChange(index, "productCostNetto", e.target.value)}
                  addonAfter={getCurrencySymbol()}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                label={translations.amount}
              >
                <Input
                  type="number"
                  placeholder={translations.amount}
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
          <Text type="secondary">{translations.noCustomOptions}</Text>
        </div>
      )}

      <Modal
        title={translations.confirmDel}
        open={showDeleteConfirm}
        onOk={handleDeleteOption}
        onCancel={() => setShowDeleteConfirm(false)}
        okText={translations.delete}
        cancelText={translations.cancel}
      >
        <p>{translations.sureToDel}</p>
      </Modal>
    </div>
  );
};

export default CustomOptionSelection;


