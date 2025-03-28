import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Tabs, Checkbox, Divider } from "antd";
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
      length
      height
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

const SkirtingSelection = ({
  suborderId,
  onAfterSubmit,
  onSkirtingSelect
}) => {
  const [productId, setProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sizes, setSizes] = useState({ length: 0 });
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const [hasMilling, setHasMilling] = useState(false);
  const [millingProductId, setMillingProductId] = useState(null);
  const [millingChanged, setMillingChanged] = useState(false);
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
          eqi: "skirting"
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
          eq: "skirting"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Запрос для получения существующего SuborderProduct типа skirtingMilling
  const { data: millingProductData, loading: loadingMillingProduct, refetch: refetchMilling } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "skirtingMilling"
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
      refetchMilling();
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

  // Мутация для удаления SuborderProduct
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      refetchMilling();
      setSaving(false);
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
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
          const newSizes = { length: 0 };
          if (product.sizes.length !== undefined) newSizes.length = product.sizes.length;
          setSizes(newSizes);
        }

        // Если есть продукт и пользователь еще не выбрал его, устанавливаем его
        if (product.product) {
          const productFromElements = productElements.find(elem =>
            elem.documentId === product.product.documentId
          );
          if (productFromElements) {
            setSelectedProduct(productFromElements);
            if (onSkirtingSelect) {
              onSkirtingSelect(productFromElements);
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
     // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productElements, productData, loadingProduct]);

  // Эффект для проверки наличия фрезеровки
  useEffect(() => {
    if (!loadingMillingProduct && millingProductData) {
      if (millingProductData.suborderProducts && millingProductData.suborderProducts.length > 0) {
        const millingProduct = millingProductData.suborderProducts[0];
        setMillingProductId(millingProduct.documentId);
        setHasMilling(true);
      } else {
        setMillingProductId(null);
        setHasMilling(false);
      }
    }
  }, [millingProductData, loadingMillingProduct]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    if (onSkirtingSelect) {
      onSkirtingSelect(product);
    }
  };

  // Функция для изменения размеров
  const handleSizeChange = (field, value) => {
    setSizes(prev => ({ ...prev, [field]: value }));
  };

  // Функция для обработки изменения состояния фрезеровки
  const handleMillingChange = (e) => {
    setHasMilling(e.target.checked);
    setMillingChanged(true);
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
      message.error(`${translations.choose} ${translations.skirting}`);
      return;
    }

    if (!sizes.length) {
      message.error(translations.enterLength);
      return;
    }

    setSaving(true);

    try {
      const productData = {
        suborder: suborderId,
        product: selectedProduct.documentId,
        type: "skirting",
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

      // Обрабатываем фрезеровку только если ее состояние изменилось
      if (millingChanged) {
        if (hasMilling) {
          // Если фрезеровка нужна, но ее еще нет - создаем
          if (!millingProductId) {
            await createSuborderProduct({
              variables: {
                data: {
                  suborder: suborderId,
                  type: "skirtingMilling"
                }
              }
            });
          }
        } else {
          // Если фрезеровка не нужна, но она есть - удаляем
          if (millingProductId) {
            await deleteSuborderProduct({
              variables: {
                documentId: millingProductId
              }
            });
          }
        }
        setMillingChanged(false);
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

  if (error) return <Empty description={`${translations.err}: ${error.message}`} />;

  const items = [
    {
      key: "1",
      label: `${translations.skirting}`,
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
                    <Card.Meta title={translations[product.title]} />
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
              <Title level={5}>{translations.length}</Title>
              <InputNumber
                min={0}
                value={sizes.length}
                onChange={(value) => handleSizeChange('length', value)}
                style={{ width: '100%' }}
                addonAfter={'mm'}
              />
            </Col>
          </Row>
        </Card>
      )
    },
    {
      key: "3",
      label: translations["Milling insert"],
      disabled: !selectedProduct,
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            <Col span={24}>
              <Checkbox 
                checked={hasMilling}
                onChange={handleMillingChange}
              >
                {translations["Milling insert"]}
              </Checkbox>
            </Col>
          </Row>
        </Card>
      )
    }
  ];
  
  // Добавляем вкладку декора
  items.push({
    key: "4",
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
        productType="skirting"
        onAfterSubmit={onAfterSubmit}
      />
    )
  });

  return (
    <div>
      <Divider orientation="left">{translations.selection} {translations.skirting}</Divider> 
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
            {productId ? translations.update : translations.save }
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

export default SkirtingSelection;
