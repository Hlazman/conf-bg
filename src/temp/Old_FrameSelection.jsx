import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Spin, Empty, Checkbox, Button, message, Divider, Typography } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";

const { Title  } = Typography;

// GraphQL запрос для получения рам
const GET_FRAMES = gql`
  query GetFrames($filters: ProductFiltersInput) {
    products(filters: $filters) {
      documentId
      title
      type
      image {
        url
      }
      collections {
        documentId
        title
      }
    }
  }
`;

// Мутация для создания SuborderProduct
const CREATE_SUBORDER_PRODUCT = gql`
mutation CreateSuborderProduct($data: SuborderProductInput!) {
  createSuborderProduct(data: $data) {
    documentId
  }
}`;

// Мутация для обновления SuborderProduct
const UPDATE_SUBORDER_PRODUCT = gql`
mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
  updateSuborderProduct(documentId: $documentId, data: $data) {
    documentId
  }
}`;

// Запрос для получения существующего SuborderProduct
const GET_SUBORDER_PRODUCT = gql`
query GetSuborderProduct($filters: SuborderProductFiltersInput) {
  suborderProducts(filters: $filters) {
    documentId
    product {
      documentId
      title
      brand
      image {
        documentId
        url
      }
    }
    type
  }
}`;

// Мутация для удаления SuborderProduct
const DELETE_SUBORDER_PRODUCT = gql`
mutation DeleteSuborderProduct($documentId: ID!) {
  deleteSuborderProduct(documentId: $documentId) {
    documentId
  }
}`;

const FrameSelection = ({
  doorId,
  collectionId,
  selectedFrame,
  onFrameSelect,
  suborderId, 
  onAfterSubmit
}) => {
  const [frameProductId, setFrameProductId] = useState(null);
  const [thresholdProductId, setThresholdProductId] = useState(null);
  const [hasThreshold, setHasThreshold] = useState(false);
  const [saving, setSaving] = useState(false);
  const [thresholdChanged, setThresholdChanged] = useState(false);
  const { translations } = useContext(LanguageContext);
  const doorType = localStorage.getItem('currentType');

  // Запрос для получения рам
  const { loading, error, data } = useQuery(GET_FRAMES, {
    variables: {
      filters: {
        type: {
          eqi: "frame"
        },
        collections: doorType === "hiddenDoor" 
          ? undefined  // Для hiddenDoor не фильтруем по коллекции
          : collectionId 
            ? {
                documentId: {
                  eq: collectionId
                }
              } 
            : undefined
      }
    },
    skip: doorType !== "hiddenDoor" && !collectionId
  });
  

  // Запрос для получения существующего SuborderProduct типа frame
  const { data: frameProductData, loading: loadingFrameProduct, refetch: refetchFrame } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "frame"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Запрос для получения существующего SuborderProduct типа treshold
  const { data: thresholdProductData, loading: loadingThresholdProduct, refetch: refetchThreshold } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "treshold"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchFrame();
      refetchThreshold();
    },
    onError: (error) => {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
      refetchFrame();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для удаления SuborderProduct
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchThreshold();
      setSaving(false);
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
      setSaving(false);
    }
  });
  
  // Получаем рамы из результатов запроса
  const frames = useMemo(() => {
    if (!data?.products) return [];
    
    // Если тип двери hiddenDoor, фильтруем рамы без коллекций
    if (doorType === "hiddenDoor") {
      return data.products.filter(frame => 
        !frame.collections || frame.collections.length === 0
      );
    }
    
    // Для других типов дверей возвращаем все полученные рамы
    return data.products;
  }, [data, doorType]);


  // Эффект для загрузки данных при изменении frames
  useEffect(() => {
    if (!loadingFrameProduct && frameProductData && frames.length > 0) {
      if (frameProductData.suborderProducts && frameProductData.suborderProducts.length > 0) {
        const frameProduct = frameProductData.suborderProducts[0];
        setFrameProductId(frameProduct.documentId);
        
        // Если есть продукт и пользователь еще не выбрал раму, устанавливаем её
        if (frameProduct.product && !selectedFrame) {
          const frameFromProducts = frames.find(frame =>
            frame.documentId === frameProduct.product.documentId
          );
          if (frameFromProducts) {
            onFrameSelect(frameFromProducts);
          }
        }
      }
      console.log(frames)
    }
  }, [frames, frameProductData, loadingFrameProduct, onFrameSelect, selectedFrame]);

  // Эффект для проверки наличия порога
  useEffect(() => {
    if (!loadingThresholdProduct && thresholdProductData) {
      if (thresholdProductData.suborderProducts && thresholdProductData.suborderProducts.length > 0) {
        const thresholdProduct = thresholdProductData.suborderProducts[0];
        setThresholdProductId(thresholdProduct.documentId);
        setHasThreshold(true);
      } else {
        setThresholdProductId(null);
        setHasThreshold(false);
      }
    }
  }, [thresholdProductData, loadingThresholdProduct]);

  // Функция для обработки изменения состояния порога
  const handleThresholdChange = (e) => {
    setHasThreshold(e.target.checked);
    setThresholdChanged(true);
  };

  // Функция сохранения выбранной рамы и порога
  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    setSaving(true);

    try {
      // Сохраняем раму, если она выбрана
      if (selectedFrame) {
        const frameData = {
          suborder: suborderId,
          product: selectedFrame.documentId,
          type: "frame"
        };

        if (frameProductId) {
          // Обновляем существующий SuborderProduct
          await updateSuborderProduct({
            variables: {
              documentId: frameProductId,
              data: frameData
            }
          });
        } else {
          // Создаем новый SuborderProduct
          await createSuborderProduct({
            variables: {
              data: frameData
            }
          });
        }
      }

      // Обрабатываем порог только если его состояние изменилось
      if (thresholdChanged) {
        if (hasThreshold) {
          // Если порог нужен, но его еще нет - создаем
          if (!thresholdProductId) {
            await createSuborderProduct({
              variables: {
                data: {
                  suborder: suborderId,
                  type: "treshold",
                  product: "220" // ID продукта Frame Treshold
                }
              }
            });
          }
        } else {
          // Если порог не нужен, но он есть - удаляем
          if (thresholdProductId) {
            await deleteSuborderProduct({
              variables: {
                documentId: thresholdProductId
              }
            });
          }
        }
        setThresholdChanged(false);
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }

      message.success(translations.dataSaved);
      setSaving(false);
      
      // Обновляем данные
      refetchFrame();
      refetchThreshold();
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingFrameProduct) return <Spin size="large" />;
  if (error) return <Empty description={translations.loadError} />;
  if (frames.length === 0) return <Empty description={translations.noData} />;

  return (
    <div>
      {/* <Divider orientation="left">{translations.frame}, {translations.threshold}</Divider>  */}
      <Divider orientation="left">{translations.frame}</Divider> 
       <div style={{ marginBottom: 32, marginTop: -45, display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
        <Button 
          type="primary" 
          onClick={handleSave}
          loading={saving}
          disabled={!selectedFrame && !thresholdChanged}
          style={!frameProductId? {} : { backgroundColor: '#52C41A' }}
        >
          {frameProductId? translations.update : translations.save}
        </Button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <Checkbox
        checked={hasThreshold}
        onChange={handleThresholdChange}
        >
        {translations.add} {translations.threshold}
        </Checkbox>
      </div>

      {/* <Divider orientation="left">{translations.selection} {translations.frame}</Divider> */}
      <Row gutter={[16, 16]}>
        {frames.map(frame => (
          <Col xs={24} sm={12} md={8} lg={6} key={frame.documentId}>
            <Card
              hoverable
              style={{ 
                borderColor: selectedFrame?.documentId === frame.documentId ? '#1890ff' : undefined,
                borderWidth: selectedFrame?.documentId === frame.documentId ? '2px' : '1px'
              }}
              styles={{ body: { padding: '12px' } }}
              onClick={() => onFrameSelect(frame)}
            >
              {/* <Card.Meta title={translations[frame.title]} /> */}
              <Card.Meta 
                title={
                  <Title level={5} style={{ whiteSpace: 'normal', wordBreak: 'break-word', padding: '20px' }}>
                    {translations[frame.title]}
                  </Title >
                }
              />           
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FrameSelection;


