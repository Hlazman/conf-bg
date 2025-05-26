import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Tabs, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import DecorSelection from './DecorSelection';
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const { Title } = Typography;

// Запрос для получения настенных панелей
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
      customProductCostNetto
      amount
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
  const { convertToEUR, convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Состояние для лицевой стороны декора
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");

  const [customProductCostNetto, setCustomProductCostNetto] = useState(0);
  const [amount, setAmount] = useState(0);
  const [isCustomCostEnabled, setIsCustomCostEnabled] = useState(false);
  const [isAmountEnabled, setIsAmountEnabled] = useState(false);

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
      message.success(translations.dataSaved);
      setSaving(false);
      refetchProduct();
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
      refetchProduct();
    },
    onError: (error) => {
      message.error(`${translations.editError}: ${error.message}`);
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

        // Добавить загрузку новых полей
        if (product.customProductCostNetto !== undefined) {
          // setCustomProductCostNetto(product.customProductCostNetto);
          setCustomProductCostNetto(convertFromEUR(product.customProductCostNetto) || 0);
        }
        
        if (product.amount !== undefined) {
          setAmount(product.amount);
        }

        // Если есть продукт и пользователь еще не выбрал его, устанавливаем его
        if (product.product) {
          const productFromElements = productElements.find(elem =>
            elem.documentId === product.product.documentId
          );
          if (productFromElements) {
            setSelectedProduct(productFromElements);

            // Проверяем, нужно ли включить customProductCostNetto по умолчанию
            if (brand !== "Danapris" && 
                (productFromElements.title === "Individual light & mirror" || 
                productFromElements.title === "Individual mdf")) {
              setIsCustomCostEnabled(true);
            }
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
  }, [productElements, productData, loadingProduct, brand, convertFromEUR]);

  // Эффект для расчета площади в квадратных метрах
  useEffect(() => {
    const area = (sizes.height * sizes.width) / 1000000;
    setSquareMeters(area);
  }, [sizes.height, sizes.width]);


  // Эффект для отмены disabled customProductCostNetto
  useEffect(() => {
    if (selectedProduct && brand !== "Danapris") {
      if (selectedProduct.title === "Individual light & mirror" || 
          selectedProduct.title === "Individual mdf") {
        setIsCustomCostEnabled(true);
      }
    }
  }, [selectedProduct, brand]);

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
      message.error(translations.err);
      return;
    }

    if (!selectedProduct) {
      message.error(`${translations.choose} ${translations.wallPanels}`);
      return;
    }

    if (!sizes.height) {
      message.error(translations.enterHeight);
      return;
    }

    if (!sizes.width) {
      message.error(translations.enterWidth);
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

      // Добавляем новые поля только если brand !== "Danapris"
      if (brand !== "Danapris") {
        if (isCustomCostEnabled) {
          // productData.customProductCostNetto = customProductCostNetto;
          productData.customProductCostNetto = convertToEUR(parseFloat(customProductCostNetto));
        }
        if (isAmountEnabled) {
          productData.amount = amount;
        }
      }

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
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingProduct) return <Spin size="large" />;

  if (error) return <div>{translations.err}: {error.message}</div>;

  // Создаем items для Tabs
  const items = [
    {
      key: "1",
      label: `${translations.wallPanels}`,
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            {productElements.length === 0 ? (
              <Col span={24}>
                <Empty description={translations.noData} />
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
                        {translations.noImage}
                      </div>
                    }
                    onClick={() => handleProductSelect(product)}
                    style={{
                      border: selectedProduct?.documentId === product.documentId
                        ? '2px solid #1890ff'
                        : '1px solid #d9d9d9'
                    }}
                  >
                    {/* <Card.Meta title={product.title} /> */}
                    {/* <Card.Meta title={translations[product.title]} /> */}
                    <Card.Meta title={translations[product.title] || product.title} />
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
      label: translations.sizes,
      disabled: !selectedProduct,
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={8}>
              <Title level={5}>{translations.height}</Title>
              <InputNumber
                min={0}
                value={sizes.height}
                onChange={(value) => handleSizeChange('height', value)}
                style={{ width: '100%' }}
                addonAfter={'mm'}
              />
            </Col>
            <Col span={8}>
              <Title level={5}>{translations.width}</Title>
              <InputNumber
                min={0}
                value={sizes.width}
                onChange={(value) => handleSizeChange('width', value)}
                style={{ width: '100%' }}
                addonAfter={'mm'}
              />
            </Col>
            <Col span={8}>
              <Title level={5}>{translations.area}</Title>
              <InputNumber
                disabled
                value={squareMeters.toFixed(4)}
                style={{ width: '100%' }}
                addonAfter={'m²'}
              />
            </Col>
          </Row>

          {brand !== "Danapris" && (
            <Row gutter={16} style={{ marginTop: 16 }}>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Text strong>
                    {translations.customProductCostNetto}:
                  </Typography.Text>
                  <input
                    type="checkbox"
                    checked={isCustomCostEnabled}
                    onChange={(e) => setIsCustomCostEnabled(e.target.checked)}
                    disabled={selectedProduct && 
                      (selectedProduct.title === "Individual light & mirror" || 
                      selectedProduct.title === "Individual mdf")}
                  />
                </div>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={customProductCostNetto}
                  onChange={(value) => setCustomProductCostNetto(value || 0)}
                  disabled={!isCustomCostEnabled}
                  placeholder={`${translations.customProductCostNetto} (${getCurrencySymbol()})`}
                  addonAfter={getCurrencySymbol()}
                />
              </Col>
              <Col span={12}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Typography.Text strong>
                    {translations.amount}:
                  </Typography.Text>
                  <input
                    type="checkbox"
                    checked={isAmountEnabled}
                    onChange={(e) => setIsAmountEnabled(e.target.checked)}
                  />
                </div>
                <InputNumber
                  style={{ width: '100%', marginTop: 8 }}
                  value={amount}
                  onChange={(value) => setAmount(value || 0)}
                  disabled={!isAmountEnabled}
                  min={0}
                  step={1}
                  placeholder={translations.enterAmount}
                />
              </Col>
            </Row>
          )}
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
          {translations.decorFront}
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
      <Divider orientation="left">{translations.selection} {translations.wallPanels}</Divider>
        <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'right', alignItems: 'center' }}>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!selectedProduct}
            style={{
              ...{ marginRight: 8, marginTop: -60 },
              ...(!productId ? {} : { backgroundColor: '#52C41A' })
            }}
          >
            {productId ? translations.update : translations.save}
          </Button>
        </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};

export default WallPanelSelection;

