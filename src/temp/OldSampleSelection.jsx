import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Checkbox, Button, message, Empty } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import ColorPicker from '../components/ColorPicker';

const { Title, Text } = Typography;

// Запрос для получения образцов
const GET_SAMPLES = gql`
  query Products($filters: ProductFiltersInput) {
    products(filters: $filters) {
      documentId
      title
      type
      brand
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
        brand
        image {
          url
          documentId
        }
      }
      colorCode
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
        brand
        image {
          url
          documentId
        }
      }
      colorCode
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
  query GetSuborderProducts($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      product {
        documentId
        title
        brand
        image {
          url
          documentId
        }
      }
      colorCode
    }
  }
`;

const SampleSelection = ({ suborderId, onAfterSubmit }) => {
  const [selectedSamples, setSelectedSamples] = useState({});
  const [sampleColors, setSampleColors] = useState({});
  const [suborderProducts, setSuborderProducts] = useState({});
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);

  // Запрос для получения образцов
  const { loading, error, data } = useQuery(GET_SAMPLES, {
    variables: {
      filters: {
        type: { eqi: "sample" }
      }
    }
  });

  // Запрос для получения существующих SuborderProduct типа sample
  const { data: suborderProductsData, loading: loadingSuborderProducts, refetch: refetchSuborderProducts } = useQuery(GET_SUBORDER_PRODUCTS, {
    variables: {
      filters: {
        suborder: { documentId: { eq: suborderId } },
        type: { eq: "sample" }
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
      message.error(`${translations.err}: ${error.message}`);
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

  // Получаем образцы из результатов запроса
  const samples = useMemo(() => {
    return data?.products || [];
  }, [data]);

  // Загружаем данные существующих SuborderProduct при загрузке компонента
  useEffect(() => {
    if (!loadingSuborderProducts && suborderProductsData) {
      const newSelectedSamples = {};
      const newSampleColors = {};
      const newSuborderProducts = {};

      if (suborderProductsData.suborderProducts && suborderProductsData.suborderProducts.length > 0) {
        suborderProductsData.suborderProducts.forEach(suborderProduct => {
          if (suborderProduct.product) {
            const productId = suborderProduct.product.documentId;
            newSelectedSamples[productId] = true;
            newSampleColors[productId] = suborderProduct.colorCode || "";
            newSuborderProducts[productId] = suborderProduct.documentId;
          }
        });
      }

      setSelectedSamples(newSelectedSamples);
      setSampleColors(newSampleColors);
      setSuborderProducts(newSuborderProducts);
    }
  }, [suborderProductsData, loadingSuborderProducts]);

  // Обработчик изменения выбора образца
  const handleSampleChange = (checked, sample) => {
    setSelectedSamples(prev => ({ ...prev, [sample.documentId]: checked }));
    
    // Если образец требует указания цвета, устанавливаем значение по умолчанию
    if (checked && sample.brand === "colorSample" && !sampleColors[sample.documentId]) {
      setSampleColors(prev => ({ ...prev, [sample.documentId]: "" }));
    }
  };

  // Обработчик изменения цвета образца
  const handleColorChange = (color, sampleId) => {
    setSampleColors(prev => ({ ...prev, [sampleId]: color }));
  };

  // Функция сохранения выбранных образцов
  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    setSaving(true);

    try {
      // Получаем все образцы, которые есть в базе
      const existingSampleIds = Object.keys(suborderProducts);
      
      // Получаем все выбранные образцы
      const selectedSampleIds = Object.keys(selectedSamples).filter(id => selectedSamples[id]);
      
      // Образцы для создания (выбраны, но не существуют в базе)
      const samplesToCreate = selectedSampleIds.filter(id => !existingSampleIds.includes(id));
      
      // Образцы для обновления (выбраны и существуют в базе)
      const samplesToUpdate = selectedSampleIds.filter(id => existingSampleIds.includes(id));
      
      // Образцы для удаления (существуют в базе, но не выбраны)
      const samplesToDelete = existingSampleIds.filter(id => !selectedSampleIds.includes(id));

      // Создаем новые образцы
      for (const sampleId of samplesToCreate) {
        const sample = samples.find(s => s.documentId === sampleId);
        if (sample) {
          const sampleData = {
            suborder: suborderId,
            product: sampleId,
            type: "sample"
          };
          
          // Если образец требует указания цвета, добавляем его
          if (sample.brand === "colorSample") {
            sampleData.colorCode = sampleColors[sampleId] || "";
          }
          
          await createSuborderProduct({ variables: { data: sampleData } });
        }
      }

      // Обновляем существующие образцы
      for (const sampleId of samplesToUpdate) {
        const sample = samples.find(s => s.documentId === sampleId);
        if (sample && sample.brand === "colorSample") {
          await updateSuborderProduct({
            variables: {
              documentId: suborderProducts[sampleId],
              data: { colorCode: sampleColors[sampleId] || "" }
            }
          });
        }
      }

      // Удаляем ненужные образцы
      for (const sampleId of samplesToDelete) {
        await deleteSuborderProduct({
          variables: { documentId: suborderProducts[sampleId] }
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
      <Card>
        <Spin tip={translations.loading}  fullscreen={true} />
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <Text type="danger">{translations.loadError}: {error.message}</Text>
      </Card>
    );
  }

  if (samples.length === 0) {
    return (
      <Card>
        <Empty description={translations.noData} />
      </Card>
    );
  }

  return (
    <Card>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
            <Col> <Title level={4}>{translations.selection} {translations.samples}</Title></Col>
            <Col>
              <Button
                type="primary"
                onClick={handleSave}
                loading={saving}
                style={{ marginTop: 16 }}
                >
                    {translations.save}
              </Button>
            </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        {samples.map(sample => (
          <Col span={24} key={sample.documentId}>
            <Card size="small">
              <Row align="middle">
                <Col span={12}>
                  <Checkbox
                    checked={selectedSamples[sample.documentId] || false}
                    onChange={(e) => handleSampleChange(e.target.checked, sample)}
                  >
                    {/* {sample.title} */}
                    {translations[sample.title]}
                  </Checkbox>
                </Col>
                
                {sample.brand === "colorSample" && selectedSamples[sample.documentId] && (
                  <Col span={12}>
                    <ColorPicker
                      value={sampleColors[sample.documentId] || ""}
                      onChange={(color) => handleColorChange(color, sample.documentId)}
                    />
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        ))}
      </Row>      
    </Card>
  );
};

export default SampleSelection;