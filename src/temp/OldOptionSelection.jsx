import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Checkbox, Button, message, InputNumber, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title, Text } = Typography;

const GET_OPTIONS = gql`
  query Products($filters: ProductFiltersInput, $pagination: PaginationArg) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      title
      type
      brand
      collections {
        documentId
        title
      }
      image {
        url
        documentId
      }
    }
  }
`;

// Мутация для создания SuborderProduct
const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
      product {
        documentId
        title
      }
      amount
    }
  }
`;

// Мутация для обновления SuborderProduct
const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
      product {
        documentId
        title
        type
        brand
        image {
          url
          documentId
        }
        collections {
          documentId
          title
        }
      }
      amount
    }
  }
`;

// Мутация для удаления SuborderProduct
const DELETE_SUBORDER_PRODUCT = gql`
  mutation DeleteSuborderProduct($documentId: ID!) {
    deleteSuborderProduct(documentId: $documentId) {
      documentId
    }
  }
`;

// Запрос для получения существующих SuborderProduct
const GET_SUBORDER_PRODUCTS = gql`
  query GetSuborderProducts($filters: SuborderProductFiltersInput, $pagination: PaginationArg) {
    suborderProducts(filters: $filters, pagination: $pagination) {
      documentId
      product {
        documentId
        title
        brand
        image {
          url
          documentId
        }
        collections {
          documentId
          title
        }
        type
      }
      amount
    }
  }
`;

const OptionSelection = ({ selectedDoor, suborderId, onAfterSubmit }) => {
  const [selectedOptions, setSelectedOptions] = useState({});
  const [optionAmounts, setOptionAmounts] = useState({});
  const [suborderProducts, setSuborderProducts] = useState({});
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);

  // Запрос для получения опций, совместимых с выбранной дверью
  const { loading, error, data } = useQuery(GET_OPTIONS, {
    variables: {
      filters: {
        compatibleProductss: {
          title: {
            eqi: selectedDoor?.title
          }
        },
        type: {
          eqi: "option"
        }
      },
      pagination: {
        limit: 40
      }
    },
    skip: !selectedDoor
  });

  // Запрос для получения существующих SuborderProduct типа option
  // const { data: suborderProductsData, loading: loadingSuborderProducts, refetch: refetchSuborderProducts } = useQuery(GET_SUBORDER_PRODUCTS, {
  //   variables: {
  //     filters: {
  //       suborder: {
  //         documentId: {
  //           eq: suborderId
  //         }
  //       },
  //       type: {
  //         eq: "option"
  //       }
  //     }
  //   },
  //   skip: !suborderId,
  //   fetchPolicy: "network-only"
  // });

  const { 
    data: suborderProductsData, 
    loading: loadingSuborderProducts, 
    refetch: refetchSuborderProducts 
  } = useQuery(GET_SUBORDER_PRODUCTS, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "option"
        }
      },
      pagination: {
        limit: 100 // Установите нужное значение лимита
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchSuborderProducts();
    },
    onError: (error) => {
      message.error(`${translations.saveError} ${error.message}`);
    }
  });

  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchSuborderProducts();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
    }
  });

  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchSuborderProducts();
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
    }
  });

  // Получаем опции из результатов запроса
  const options = useMemo(() => {
    return data?.products || [];
  }, [data]);

  // Загружаем данные существующих SuborderProduct при загрузке компонента
  useEffect(() => {
    if (!loadingSuborderProducts && suborderProductsData) {
      const newSelectedOptions = {};
      const newOptionAmounts = {};
      const newSuborderProducts = {};

      if (suborderProductsData.suborderProducts && suborderProductsData.suborderProducts.length > 0) {
        suborderProductsData.suborderProducts.forEach(suborderProduct => {
          if (suborderProduct.product) {
            const productId = suborderProduct.product.documentId;
            newSelectedOptions[productId] = true;
            newOptionAmounts[productId] = suborderProduct.amount || 1;
            newSuborderProducts[productId] = suborderProduct.documentId;
          }
        });
      }

      setSelectedOptions(newSelectedOptions);
      setOptionAmounts(newOptionAmounts);
      setSuborderProducts(newSuborderProducts);
    }
  }, [suborderProductsData, loadingSuborderProducts]);

  // Обработчик изменения выбора опции
  const handleOptionChange = (checked, option) => {
    setSelectedOptions(prev => ({
      ...prev,
      [option.documentId]: checked
    }));

    // Если опция требует указания количества, устанавливаем значение по умолчанию
    if (checked && option.brand === "countOptions" && !optionAmounts[option.documentId]) {
      setOptionAmounts(prev => ({
        ...prev,
        [option.documentId]: 1
      }));
    }
  };

  // Обработчик изменения количества опции
  const handleAmountChange = (value, optionId) => {
    setOptionAmounts(prev => ({
      ...prev,
      [optionId]: value
    }));
  };

  // Функция сохранения выбранных опций
  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    setSaving(true);
    try {
      // Получаем все опции, которые есть в базе
      const existingOptionIds = Object.keys(suborderProducts);
      
      // Получаем все выбранные опции
      const selectedOptionIds = Object.keys(selectedOptions).filter(id => selectedOptions[id]);
      
      // Опции для создания (выбраны, но не существуют в базе)
      const optionsToCreate = selectedOptionIds.filter(id => !existingOptionIds.includes(id));
      
      // Опции для обновления (выбраны и существуют в базе)
      const optionsToUpdate = selectedOptionIds.filter(id => existingOptionIds.includes(id));
      
      // Опции для удаления (существуют в базе, но не выбраны)
      const optionsToDelete = existingOptionIds.filter(id => !selectedOptionIds.includes(id));

      // Создаем новые опции
      for (const optionId of optionsToCreate) {
        const option = options.find(o => o.documentId === optionId);
        if (option) {
          const optionData = {
            suborder: suborderId,
            product: optionId,
            type: "option"
          };
          
          // Если опция требует указания количества, добавляем его
          if (option.brand === "countOptions") {
            optionData.amount = parseInt(optionAmounts[optionId] || 1, 10);
          }
          
          await createSuborderProduct({
            variables: {
              data: optionData
            }
          });
        }
      }

      // Обновляем существующие опции
      for (const optionId of optionsToUpdate) {
        const option = options.find(o => o.documentId === optionId);
        if (option && option.brand === "countOptions") {
          await updateSuborderProduct({
            variables: {
              documentId: suborderProducts[optionId],
              data: {
                amount: parseInt(optionAmounts[optionId] || 1, 10)
              }
            }
          });
        }
      }

      // Удаляем ненужные опции
      for (const optionId of optionsToDelete) {
        await deleteSuborderProduct({
          variables: {
            documentId: suborderProducts[optionId]
          }
        });
      }

    // Update title in collapse
    if (onAfterSubmit) {
      await onAfterSubmit();
    }

      message.success(translations.dataSaved);
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingSuborderProducts) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Spin size="large" />
        <p>{translations.loading}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div>
        <Title level={4}>{translations.options}</Title>
        <p>`${translations.loadError}: ${error.message}`</p>
      </div>
    );
  }

  if (!selectedDoor) {
    return (
      <div>
        <Title level={4}>{translations.options}</Title>
        <p>{translations.firstDoor}</p>
      </div>
    );
  }

  if (options.length === 0) {
    return (
      <div>
        <Title level={4}>{translations.options}</Title>
        <p>{translations.noAvOptions}</p>
      </div>
    );
  }

  return (
    <div>
      <Divider orientation="left">{translations.options}</Divider>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
          <Button 
            type="primary" 
            onClick={handleSave} 
            loading={saving}
            style={{ marginTop: -60 }}
          >
            {translations.save}
          </Button>
      </div>
      {/* <Divider /> */}
      {options.map(option => (
        <Card 
          key={option.documentId} 
          style={{ marginBottom: "16px" }}
          size="small"
        >
          <Row align="middle">
            <Col span={16}>
              <Checkbox
                checked={!!selectedOptions[option.documentId]}
                onChange={(e) => handleOptionChange(e.target.checked, option)}
              >
                {/* <Text strong>{option.title}</Text> */}
                <Text strong>{translations[option.title]}</Text>
              </Checkbox>
            </Col>
            {option.brand === "countOptions" && selectedOptions[option.documentId] && (
              <Col span={8}>
                <Row justify="end">
                  <Col>
                    <Text style={{ marginRight: "8px" }}>{translations.amount}:</Text>
                  </Col>
                  <Col>
                    <InputNumber
                      min={1}
                      value={optionAmounts[option.documentId] || 1}
                      onChange={(value) => handleAmountChange(value, option.documentId)}
                      style={{ width: "80px" }}
                    />
                  </Col>
                </Row>
              </Col>
            )}
          </Row>
        </Card>
      ))}
    </div>
  );
};

export default OptionSelection;