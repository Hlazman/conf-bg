import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Button, message, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { LanguageContext } from "../context/LanguageContext";


const { Title, Text } = Typography;

// GraphQL запросы
// const GET_SLIDING_FRAMES = gql`
//   query Products($filters: ProductFiltersInput) {
//     products(filters: $filters) {
//       documentId
//       title
//       description
//       type
//     }
//   }
// `;

const GET_SLIDING_FRAMES = gql`
  query Products($filters: ProductFiltersInput, $pagination: PaginationArg) {
    products(filters: $filters, pagination: $pagination) {
      documentId
      title
      description
      type
    }
  }
`;


const CREATE_SUBORDER_PRODUCT = gql`
  mutation CreateSuborderProduct($data: SuborderProductInput!) {
    createSuborderProduct(data: $data) {
      documentId
      product {
        documentId
        title
        description
      }
    }
  }
`;

const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
      product {
        documentId
        title
        description
      }
    }
  }
`;

const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      product {
        documentId
        title
        description
        brand
        image {
        url
        documentId
        }
      }
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

const SlidingSelection = ({ suborderId, onAfterSubmit }) => {
  const [slidingFrameProductId, setSlidingFrameProductId] = useState(null);
  const [selectedSlidingFrame, setSelectedSlidingFrame] = useState(null);
  const [saving, setSaving] = useState(false);
  const { translations } = useContext(LanguageContext);

  // Запрос для получения раздвижных систем
  const { loading, error, data } = useQuery(GET_SLIDING_FRAMES, {
    variables: {
      filters: {
        type: {
          eqi: "slidingFrame"
        }
      },
      pagination: {
        limit: 30
      }
    }
  });

  // Запрос для получения существующего SuborderProduct типа slidingFrame
  const { data: slidingFrameProductData, loading: loadingSlidingFrameProduct, refetch: refetchSlidingFrame } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "slidingFrame"
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
      refetchSlidingFrame();
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
      refetchSlidingFrame();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для удаления SuborderProduct
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(translations.dataSaved);
      setSaving(false);
      setSelectedSlidingFrame(null);
      setSlidingFrameProductId(null);
      refetchSlidingFrame();
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
      setSaving(false);
    }
  });

  // Получаем раздвижные системы из результатов запроса
  // const slidingFrames = data?.products || [];
  const slidingFrames = useMemo(() => {
    const frames = data?.products || [];
    return [...frames].sort((a, b) => a.title.localeCompare(b.title));
  }, [data]);

  // Эффект для загрузки данных при изменении slidingFrames
  useEffect(() => {
    if (!loadingSlidingFrameProduct && slidingFrameProductData && slidingFrames.length > 0) {
      if (slidingFrameProductData.suborderProducts && slidingFrameProductData.suborderProducts.length > 0) {
        const slidingFrameProduct = slidingFrameProductData.suborderProducts[0];
        setSlidingFrameProductId(slidingFrameProduct.documentId);
        
        // Если есть продукт и пользователь еще не выбрал раздвижную систему, устанавливаем её
        if (slidingFrameProduct.product) {
          const slidingFrameFromProducts = slidingFrames.find(frame =>
            frame.documentId === slidingFrameProduct.product.documentId
          );
          if (slidingFrameFromProducts) {
            setSelectedSlidingFrame(slidingFrameFromProducts);
          }
        }
      }
    }
  }, [slidingFrames, slidingFrameProductData, loadingSlidingFrameProduct]);

  // Функция для выбора раздвижной системы
  const handleSlidingFrameSelect = (slidingFrame) => {
    setSelectedSlidingFrame(slidingFrame);
  };

  // Функция сохранения выбранной раздвижной системы
  const handleSave = async () => {
    if (!suborderId) {
      message.error(translations.err);
      return;
    }

    if (!selectedSlidingFrame) {
      message.warning(translations.enterSliding);
      return;
    }

    setSaving(true);

    try {
      const slidingFrameData = {
        suborder: suborderId,
        product: selectedSlidingFrame.documentId,
        type: "slidingFrame"
      };

      if (slidingFrameProductId) {
        // Обновляем существующий SuborderProduct
        await updateSuborderProduct({
          variables: {
            documentId: slidingFrameProductId,
            data: slidingFrameData
          }
        });
      } else {
        // Создаем новый SuborderProduct
        await createSuborderProduct({
          variables: {
            data: slidingFrameData
          }
        });
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  // Функция удаления выбранной раздвижной системы
  const handleDelete = async () => {
    if (!slidingFrameProductId) {
      message.error(translations.noData);
      return;
    }

    setSaving(true);

    try {
      await deleteSuborderProduct({
        variables: {
          documentId: slidingFrameProductId
        }
      });
    } catch (error) {
      message.error(`${translations.deleteError}: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingSlidingFrameProduct) {
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
        <Title level={4}>{translations.slidingFrame}</Title>
        <p>{translations.loadError}: {error.message}</p>
      </div>
    );
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: "20px" }}>
        <Col>
          <Title level={4}>{translations.slidingFrame}</Title>
        </Col>
        <Col>
          <Row gutter={8}>
            <Col>
              <Button 
                type="primary" 
                onClick={handleSave} 
                loading={saving}
                disabled={!selectedSlidingFrame}
                style={!slidingFrameProductId ? {} : { backgroundColor: '#52C41A' }}
              >
                {slidingFrameProductId ? translations.update : translations.save}
              </Button>
            </Col>
            {slidingFrameProductId && (
              <Col>
                <Button 
                  danger 
                  onClick={handleDelete} 
                  loading={saving}
                >
                  {translations.delete}
                </Button>
              </Col>
            )}
          </Row>
        </Col>
      </Row>

      <Divider />

      <Row gutter={[16, 16]}>
        {slidingFrames.map(slidingFrame => (
          <Col xs={24} sm={12} md={8} lg={6} key={slidingFrame.documentId}>
            <Card
              hoverable
              style={{ 
                borderColor: selectedSlidingFrame?.documentId === slidingFrame.documentId ? '#1890ff' : undefined,
                borderWidth: selectedSlidingFrame?.documentId === slidingFrame.documentId ? '2px' : '1px'
              }}
              onClick={() => handleSlidingFrameSelect(slidingFrame)}
            >
              <div style={{ textAlign: "center" }}>
                <Title level={5}>{slidingFrame.title}</Title>
                {slidingFrame.description && (
                  // <Text type="secondary">{slidingFrame.description}</Text>
                  <Text type="secondary">{translations[slidingFrame.description]}</Text>
                )}
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {slidingFrames.length === 0 && (
        <div style={{ textAlign: "center", padding: "20px" }}>
          <Text type="secondary">{translations.noData}</Text>
        </div>
      )}
    </div>
  );
};

export default SlidingSelection;
