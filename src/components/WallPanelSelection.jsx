import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Tabs } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import DecorSelection from './DecorSelection';
import { LanguageContext } from "../context/LanguageContext";

const { Title } = Typography;

// Запрос для получения элементов продукта
const GET_PRODUCT_ELEMENTS = gql`
  query Products($pagination: PaginationArg, $filters: ProductFiltersInput) {
    products(pagination: $pagination, filters: $filters) {
      title
      type
      brand
      image {
        documentId
        url
      }
      decor_types {
        typeName
        documentId
      }
      documentId
    }
  }`;

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
      sizes {
        height
        length
        width
        thickness
      }
      decor {
        documentId
        title
      }
      decor_type {
        documentId
        typeName
      }
      secondSideDecor {
        documentId
        title
      }
      secondSideDecorType {
        documentId
        typeName
      }
      colorCode
      secondSideColorCode
    }
  }`;

const WallPanelSelection = ({
  suborderId,
  brand,
  onAfterSubmit
}) => {
  const [productId, setProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sizes, setSizes] = useState({ height: 0, width: 0 });
  const [squareMeters, setSquareMeters] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const { translations } = useContext(LanguageContext);

  // Состояние для лицевой стороны декора
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");

  // Запрос для получения элементов продукта
  const { loading, error, data } = useQuery(GET_PRODUCT_ELEMENTS, {
    variables: {
      pagination: {
        limit: 50
      },
      filters: {
        type: {
          eqi: "wallPanel"
        },
        brand: {
          eqi: brand
        }
      }
    }
  });

  // Запрос для получения существующего SuborderProduct заданного типа
  const { data: productData, loading: loadingProduct, refetch: refetchProduct } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "wallPanel"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success(`Стеновая панель успешно добавлена`);
      setSaving(false);
      refetchProduct();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(`Стеновая панель успешно обновлена`);
      setSaving(false);
      refetchProduct();
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });

  // Получаем элементы продукта из результатов запроса
  const productElements = useMemo(() => {
    return data?.products || [];
  }, [data]);

  // Эффект для загрузки данных при изменении productElements
  useEffect(() => {
    if (!loadingProduct && productData && productElements.length > 0) {
      if (productData.suborderProducts && productData.suborderProducts.length > 0) {
        const product = productData.suborderProducts[0];
        setProductId(product.documentId);
        
        // Устанавливаем размеры продукта
        if (product.sizes) {
          const newSizes = { height: 0, width: 0 };
          if (product.sizes.height !== undefined) newSizes.height = product.sizes.height;
          if (product.sizes.width !== undefined) newSizes.width = product.sizes.width;
          setSizes(newSizes);
        }

        // Если есть продукт и пользователь еще не выбрал его, устанавливаем его
        if (product.product) {
          const productFromElements = productElements.find(elem =>
            elem.documentId === product.product.documentId
          );
          if (productFromElements) {
            setSelectedProduct(productFromElements);
          }
        }

        // Устанавливаем декор и тип декора для лицевой стороны
        if (product.decor_type) {
          setSelectedFrontDecorType(product.decor_type);
        }

        if (product.decor) {
          setSelectedFrontDecor(product.decor);
        }

        if (product.colorCode) {
          setFrontColorCode(product.colorCode);
        }
      }
    }
  }, [productElements, productData, loadingProduct]);

  // Эффект для расчета площади в квадратных метрах
  useEffect(() => {
    const area = (sizes.height * sizes.width) / 1000000;
    setSquareMeters(area);
  }, [sizes.height, sizes.width]);

  // Функция для выбора продукта
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  // Функция для изменения размеров
  const handleSizeChange = (field, value) => {
    setSizes(prev => ({ ...prev, [field]: value }));
  };

  // Функция для определения типов декора, для которых нужно показывать ColorPicker
  const isPaintType = (typeName) => {
    return typeName && (
      typeName === "Paint" ||
      typeName === "Paint glass" ||
      typeName === "Paint veneer"
    );
  };

  // Функция сохранения выбранного продукта
  const handleSave = async () => {
    if (!suborderId) {
      message.error("ID подзаказа не найден");
      return;
    }

    if (!selectedProduct) {
      message.error(`Выберите стеновую панель`);
      return;
    }

    if (!sizes.height) {
      message.error(`Выберите высоту`);
      return;
    }

    if (!sizes.width) {
      message.error(`Выберите ширину`);
      return;
    }

    setSaving(true);

    try {
      const productData = {
        suborder: suborderId,
        product: selectedProduct.documentId,
        type: "wallPanel",
        sizes: sizes,
        decor: selectedFrontDecor ? selectedFrontDecor.documentId : null,
        decor_type: selectedFrontDecorType ? selectedFrontDecorType.documentId : null,
        colorCode: isPaintType(selectedFrontDecorType?.typeName) ? frontColorCode : null
      };

      if (productId) {
        // Обновляем существующий SuborderProduct
        await updateSuborderProduct({
          variables: {
            documentId: productId,
            data: productData
          }
        });
      } else {
        // Создаем новый SuborderProduct
        await createSuborderProduct({
          variables: {
            data: productData
          }
        });
      }

      // Update title in collapse
      if (onAfterSubmit) {
        await onAfterSubmit();
      }
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingProduct) return <Spin size="large" />;

  if (error) return <div>Ошибка: {error.message}</div>;

  // Создаем items для Tabs
  const items = [
    {
      key: "1",
      label: "Выбор стеновой панели",
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            {productElements.length === 0 ? (
              <Col span={24}>
                <Empty description="Нет доступных стеновых панелей" />
              </Col>
            ) : (
              productElements.map(product => (
                <Col span={6} key={product.documentId}>
                  <Card
                    hoverable
                    cover={
                      product.image?.url ? 
                      <img 
                        alt={product.title} 
                        src={`https://dev.api.boki-groupe.com${product.image.url}`} 
                        style={{ height: 200, objectFit: 'cover' }}
                      /> : 
                      <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Нет изображения
                      </div>
                    }
                    onClick={() => handleProductSelect(product)}
                    style={{
                      border: selectedProduct?.documentId === product.documentId
                        ? '2px solid #1890ff'
                        : '1px solid #d9d9d9'
                    }}
                  >
                    <Card.Meta title={product.title} />
                  </Card>
                </Col>
              ))
            )}
          </Row>
        </Card>
      )
    },
    {
      key: "2",
      label: "Размеры",
      disabled: !selectedProduct,
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Title level={5}>Высота (мм)</Title>
              <InputNumber
                min={0}
                value={sizes.height}
                onChange={(value) => handleSizeChange('height', value)}
                style={{ width: '100%' }}
                addonAfter={'mm'}
              />
            </Col>
            <Col span={8}>
              <Title level={5}>Ширина (мм)</Title>
              <InputNumber
                min={0}
                value={sizes.width}
                onChange={(value) => handleSizeChange('width', value)}
                style={{ width: '100%' }}
                addonAfter={'mm'}
              />
            </Col>
            <Col span={8}>
              <Title level={5}>Площадь (м²)</Title>
              <InputNumber
                disabled
                value={squareMeters.toFixed(4)}
                style={{ width: '100%' }}
                addonAfter={'м²'}
              />
            </Col>
          </Row>
        </Card>
      )
    }
  ];

  // Добавляем вкладку декора только для бренда Danapris
  if (brand === "Danapris") {
    items.push({
      key: "3",
      label: (
        <span>
          Лицевая сторона
          <span style={{ color: '#00A651' }}>
            {selectedFrontDecorType ? ` - ${selectedFrontDecorType.typeName}` : ""}
            {selectedFrontDecor ? ` - ${selectedFrontDecor.title}` : ""}
            {selectedFrontDecorType && isPaintType(selectedFrontDecorType.typeName) && frontColorCode ? ` - ${frontColorCode}` : ""}
          </span>
        </span>
      ),
      disabled: !selectedProduct,
      children: (
        <DecorSelection
          doorId={selectedProduct?.documentId}
          selectedDecorType={selectedFrontDecorType}
          selectedDecor={selectedFrontDecor}
          colorCode={frontColorCode}
          onDecorTypeSelect={setSelectedFrontDecorType}
          onDecorSelect={setSelectedFrontDecor}
          onColorChange={setFrontColorCode}
          isFrontSide={true}
          suborderId={suborderId}
          productType="wallPanel"
          onAfterSubmit={onAfterSubmit}
        />
      )
    });
  }

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>Выбор стеновой панели</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!selectedProduct}
            style={{
              ...{ marginRight: 8 },
              ...(!productId ? {} : { backgroundColor: '#52C41A' })
            }}
          >
            {productId ? translations.update : translations.save}
          </Button>
        </Col>
      </Row>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};

export default WallPanelSelection;

