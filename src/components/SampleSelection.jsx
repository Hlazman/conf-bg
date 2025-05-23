import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Typography, Spin, Checkbox, Button, message, Empty, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";
import DecorSelection from './DecorSelection';

const { Text } = Typography;

// Запрос для получения образцов
const GET_SAMPLES = gql`
query Products($filters: ProductFiltersInput) {
  products(filters: $filters) {
    documentId
    title
    type
    brand
    description
    collections {
      documentId
    }
    guarantee
    image {
      url
      documentId
    }
  }
}`;

// Мутация для создания SuborderProduct
const CREATE_SUBORDER_PRODUCT = gql`
mutation CreateSuborderProduct($data: SuborderProductInput!) {
  createSuborderProduct(data: $data) {
    documentId
    product {
      documentId
      title
      type
      brand
      description
      collections {
        documentId
      }
      guarantee
      image {
        url
        documentId
      }
    }
    colorCode
  }
}`;

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
      description
      collections {
        documentId
      }
      guarantee
      image {
        url
        documentId
      }
      maxSizes {
        height
        width
      }
    }
    colorCode
  }
}`;

// Мутация для удаления SuborderProduct
const DELETE_SUBORDER_PRODUCT = gql`
mutation DeleteSuborderProduct($documentId: ID!) {
  deleteSuborderProduct(documentId: $documentId) {
    documentId
  }
}`;

// Запрос для получения существующих SuborderProduct
const GET_SUBORDER_PRODUCTS = gql`
query GetSuborderProducts($filters: SuborderProductFiltersInput) {
  suborderProducts(filters: $filters) {
    documentId
    product {
      documentId
      title
      type
      brand
      description
      collections {
        documentId
      }
      guarantee
      image {
        url
        documentId
      }
    }
    colorCode
    decor {
      documentId
      title
    }
    decor_type {
      documentId
      typeName
    }
  }
}`;

const SampleSelection = ({ suborderId, onAfterSubmit }) => {
  const [selectedSamples, setSelectedSamples] = useState({});
  const [suborderProducts, setSuborderProducts] = useState({});
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);
  
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");

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
      const newSuborderProducts = {};

      if (suborderProductsData.suborderProducts && suborderProductsData.suborderProducts.length > 0) {
        suborderProductsData.suborderProducts.forEach(suborderProduct => {
          if (suborderProduct.product) {
            const productId = suborderProduct.product.documentId;
            newSelectedSamples[productId] = true;
            newSuborderProducts[productId] = suborderProduct.documentId;
            
            if (suborderProduct.product.brand === "colorSample") {
              setSelectedFrontDecorType(suborderProduct.decor_type || null);
              setSelectedFrontDecor(suborderProduct.decor || null);
              setFrontColorCode(suborderProduct.colorCode || "");
            }
          }
        });
      }

      setSelectedSamples(newSelectedSamples);
      setSuborderProducts(newSuborderProducts);
    }
  }, [suborderProductsData, loadingSuborderProducts]);

  // Обработчик изменения выбора образца
  const handleSampleChange = (checked, sample) => {
    setSelectedSamples(prev => ({ ...prev, [sample.documentId]: checked }));
    if (checked && sample.brand === "colorSample") {
      setFrontColorCode("");
      setSelectedFrontDecorType(null);
      setSelectedFrontDecor(null);
    }
  };

  // Функция сохранения выбранных образцов
  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    setSaving(true);
    
    try {
      const existingSampleIds = Object.keys(suborderProducts); 
      const selectedSampleIds = Object.keys(selectedSamples).filter(id => selectedSamples[id]); 
      const samplesToCreate = selectedSampleIds.filter(id => !existingSampleIds.includes(id)); 
      const samplesToUpdate = selectedSampleIds.filter(id => existingSampleIds.includes(id)); 
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
            sampleData.colorCode = frontColorCode;
            if (selectedFrontDecorType) {
              sampleData.decor_type = selectedFrontDecorType.documentId;
            }
            if (selectedFrontDecor) {
              sampleData.decor = selectedFrontDecor.documentId;
            }
          }
          
          await createSuborderProduct({ variables: { data: sampleData } });
        }
      }

      // Обновляем существующие образцы
      for (const sampleId of samplesToUpdate) {
        const sample = samples.find(s => s.documentId === sampleId);
        if (sample && sample.brand === "colorSample") {
          const updateData = { 
            colorCode: frontColorCode
          };
          
          if (selectedFrontDecorType) {
            updateData.decor_type = selectedFrontDecorType.documentId;
          }
          if (selectedFrontDecor) {
            updateData.decor = selectedFrontDecor.documentId;
          }
          
          await updateSuborderProduct({
            variables: {
              documentId: suborderProducts[sampleId],
              data: updateData
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
    return <Spin size="large" />;
  }

  if (error) {
    return <div>{translations.loadError}: {error.message}</div>;
  }

  if (samples.length === 0) {
    return <Empty description={translations.noData} />;
  }

  // Находим выбранный образец с brand === "colorSample"
  const selectedColorSample = samples.find(
    sample => sample.brand === "colorSample" && selectedSamples[sample.documentId]
  );
  // console.log(selectedColorSample)

  return (
    <>
    <Card>
      <Divider orientation="left">{translations.selection} {translations.samples}</Divider> 
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

        {samples.map(sample => (
          <Card key={sample.documentId} style={{marginBottom: 16}}>
            <Checkbox 
              checked={selectedSamples[sample.documentId] || false}
              onChange={(e) => handleSampleChange(e.target.checked, sample)}
            />
            <Text> {translations[sample.title]}</Text>
          </Card>
        ))}
    </Card>

    {/* DecorSelection размещен под продуктами, а не внутри Card */}
    {selectedColorSample && (
        <div style={{ marginTop: 32 }}>
          <DecorSelection
            doorId={selectedColorSample.documentId}
            selectedDecorType={selectedFrontDecorType}
            selectedDecor={selectedFrontDecor}
            colorCode={frontColorCode}
            onDecorTypeSelect={setSelectedFrontDecorType}
            onDecorSelect={setSelectedFrontDecor}
            onColorChange={setFrontColorCode}
            isFrontSide={true}
            suborderId={suborderId}
            productType="sample"
            onAfterSubmit={onAfterSubmit}
          />
        </div>
      )}
    </>
  );
};

export default SampleSelection;

