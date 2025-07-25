import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Tabs, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import DecorSelection from './DecorSelection';
import { LanguageContext } from "../context/LanguageContext";
import ArchiveOverlay from './ArchiveOverlay';

const { Title } = Typography;

// Запрос для получения элементов продукта
const GET_PRODUCT_ELEMENTS = gql`
query Products($pagination: PaginationArg, $filters: ProductFiltersInput) {
  products(pagination: $pagination, filters: $filters) {
    title
    archive
    type
    decorCombinations
    decor_types {
      typeName
      documentId
    }
    documentId
    maxSizes {
      height
      width
      minWidth
      recomendedWidth
    }
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
      type
      maxSizes {
        height
        width
        minWidth
        recomendedWidth
      }
      collections { 
        documentId
        title 
      }
      description
      guarantee
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

// Мутация для удаления SuborderProduct
const DELETE_SUBORDER_PRODUCT = gql`
mutation DeleteSuborderProduct($documentId: ID!) {
  deleteSuborderProduct(documentId: $documentId) {
    documentId
  }
}`;

// GraphQL запрос для получения данных субордера
export const SUBORDER_QUERY = gql`
  query Suborder($documentId: ID!) {
    suborder(documentId: $documentId) {
      documentId
      extenderCalculatedWidth
    }
  }
`;

const ElementSelection = ({
  selectedDoor,
  suborderId,
  productType, // тип продукта (extender, и т.д.)
  availableSizes = { height: true, length: true, width: true, thickness: true }, // какие размеры доступны
  defaultSizes = { height: 0, length: 0, width: 100, thickness: 0 }, // значения по умолчанию
  onAfterSubmit,
  isBackDecorDisabled,
  selectedFrame
}) => {
  const [productId, setProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [sizes, setSizes] = useState(defaultSizes);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  const { translations } = useContext(LanguageContext);

  // Состояние для лицевой стороны декора
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");

  // Состояние для тыльной стороны декора
  const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
  const [selectedBackDecor, setSelectedBackDecor] = useState(null);
  const [backColorCode, setBackColorCode] = useState("");

  // Состояние реккомендованой ширины добора
  const [extenderCalculatedWidth, setExtenderCalculatedWidth] = useState(null);

  const currentType = localStorage.getItem('currentType');

  const getCompatibleTitle = () => {
    if (productType === "extender") {
      // Если currentType === 'hiddenDoor' — фильтруем по selectedDoor иначе по selectedFrame
      return currentType === 'hiddenDoor'
        ? selectedDoor?.title
        : selectedFrame?.title;
    }
    return selectedDoor?.title;
  };

  // Запрос для получения элементов продукта
  const { loading, error, data } = useQuery(GET_PRODUCT_ELEMENTS, {
    variables: {
      filters: {
        compatibleProductss: {
          title: {
            // eqi: selectedDoor?.title
            // eqi: productType === "extender"
            // ? selectedFrame?.title
            // : selectedDoor?.title
            eqi: getCompatibleTitle()
          }
        },
        type: {
          eqi: productType
        }
      }
    },
    // skip: !selectedDoor
    skip: !selectedDoor || (productType === "extender" && !selectedFrame)
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
          eq: productType
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success(`${productType}: ${translations.dataSaved}`);
      setSaving(false);
      refetchProduct();
    },
    onError: (error) => {
      message.error(`${translations.saveError}: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(`${productType}: ${translations.dataSaved}`);
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
      message.success(`${productType}: ${translations.removed}`);
      setSaving(false);
      refetchProduct();
      // Сбросить состояние после удаления
      setProductId(null);
      setSelectedProduct(null);
      setSizes(defaultSizes);
      setSelectedFrontDecorType(null);
      setSelectedFrontDecor(null);
      setFrontColorCode("");
      setSelectedBackDecorType(null);
      setSelectedBackDecor(null);
      setBackColorCode("");
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
      setSaving(false);
    }
  });

  const { data: suborderData } = useQuery(SUBORDER_QUERY, {
    variables: { documentId: suborderId },
    skip: !suborderId,
  });

  const handleDelete = async () => {
    const idToDelete = productId || productData?.suborderProducts[0]?.documentId;
    
    if (!idToDelete) {
      message.error(`${productType}: ${translations.noData}`);
      return;
    }
  
    setSaving(true);
    try {
      await deleteSuborderProduct({
        variables: {
          documentId: idToDelete
        }
      });
    } catch (error) {
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

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
          const newSizes = { ...defaultSizes };
          if (product.sizes.height !== undefined) newSizes.height = product.sizes.height;
          if (product.sizes.length !== undefined) newSizes.length = product.sizes.length;
          if (product.sizes.width !== undefined) newSizes.width = product.sizes.width;
          if (product.sizes.thickness !== undefined) newSizes.thickness = product.sizes.thickness;
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

        // Устанавливаем декор и тип декора для тыльной стороны
        if (product.secondSideDecorType) {
          setSelectedBackDecorType(product.secondSideDecorType);
        }

        if (product.secondSideDecor) {
          setSelectedBackDecor(product.secondSideDecor);
        }

        if (product.secondSideColorCode) {
          setBackColorCode(product.secondSideColorCode);
        }
      }
    }
  }, [productElements, productData, loadingProduct, defaultSizes]);

  // useEffect, для extenderCalculatedWidth
  useEffect(() => {
    if (suborderData?.suborder?.extenderCalculatedWidth) {
      setExtenderCalculatedWidth(suborderData.suborder.extenderCalculatedWidth);
    }
  }, [suborderData]);


  // Функция для выбора продукта
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  // Функция для изменения размеров
  const handleSizeChange = (field, value) => {
    setSizes(prev => ({ ...prev, [field]: value }));
  };

  // Обработчик для очистки выбора тыльной стороны
  const clearBackSelection = () => {
    setSelectedBackDecorType(null);
    setSelectedBackDecor(null);
    setBackColorCode("");
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
      message.error(`${translations.choose} ${productType}`);
      return;
    }

    if (availableSizes.height && !sizes.height ) {
      message.error(translations.enterHeight);
      return;
    }

    if (availableSizes.width && !sizes.width ) {
      message.error(translations.enterWidth);
      return;
    }

    if (availableSizes.length && !sizes.length ) {
      message.error(translations.enterLength);
      return;
    }

    if (availableSizes.thickness && !sizes.thickness ) {
      message.error(translations.enterThickness);
      return;
    }

    setSaving(true);
    try {
      const productData = {
        suborder: suborderId,
        product: selectedProduct.documentId,
        type: productType,
        sizes: sizes,
        decor: selectedFrontDecor ? selectedFrontDecor.documentId : null,
        decor_type: selectedFrontDecorType ? selectedFrontDecorType.documentId : null,
        colorCode: isPaintType(selectedFrontDecorType?.typeName) ? frontColorCode : null,
        secondSideDecor: selectedBackDecor ? selectedBackDecor.documentId : null,
        secondSideDecorType: selectedBackDecorType ? selectedBackDecorType.documentId : null,
        secondSideColorCode: isPaintType(selectedBackDecorType?.typeName) ? backColorCode : null
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
      message.error(`${translations.err}: ${error.message}`);
      setSaving(false);
    }
  };

  const compatibleProducts = useMemo(() => {
    return productElements.filter(p => p.type?.toLowerCase() === productType.toLowerCase());
  }, [productElements, productType]);


  if (loading || loadingProduct) return <Spin size="large" />;

  if (compatibleProducts.length === 0) {
    return (
      <div style={{ textAlign: 'center', marginTop: 32, color: '#999' }}>
        <Typography.Text>{translations.noData}</Typography.Text>
      </div>
    );
  }

  if (error) return <Empty description={`${translations.loadError}: ${error.message}`} />;

  // Создаем items для Tabs
  const items = [
    {
      key: "1",
      label: translations.element,
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            {/* {productElements.map(product => ( */}
            {compatibleProducts.map(product => (
              <Col span={6} key={product.documentId}>
                
                {/* <Card
                  hoverable
                  onClick={() => handleProductSelect(product)}
                  style={{
                    border: selectedProduct?.documentId === product.documentId
                      ? '2px solid #1890ff'
                      : '1px solid #d9d9d9'
                  }}
                >
                  <Title level={5}>{translations[product.title]}</Title>
                </Card> */}

                <Card
                  hoverable={!product.archive}
                  onClick={() => {
                    if (!product.archive) handleProductSelect(product);
                  }}
                  style={{
                    border: selectedProduct?.documentId === product.documentId
                      ? '2px solid #1890ff'
                      : '1px solid #d9d9d9',
                    position: 'relative',
                    cursor: product.archive ? 'not-allowed' : 'pointer'
                  }}
                >
                  <Title level={5}>{translations[product.title]}</Title>
                  {product.archive && <ArchiveOverlay text={translations.notAvailable} />}
                </Card>

              </Col>
            ))}
          </Row>
        </Card>
      )
    },
    {
      key: "2",
      label: translations.sizes,
      // disabled: !selectedProduct,
      disabled: !selectedProduct || !(
        availableSizes.height ||
        availableSizes.width ||
        availableSizes.length ||
        availableSizes.thickness
      ),
      children: (
        <Card>
          
          {productType === "platband" && (
            <Typography.Paragraph style={{ color: '#888' }}>
              {translations.standardPlatbandSize}
            </Typography.Paragraph>
          )}


          {/* {productType === "extender" && (
            //TODO
            <Typography.Paragraph style={{ color: '#888' }}>
              {translations.extenderRecomendedWidth }: {extenderCalculatedWidth ?? '-'}
            </Typography.Paragraph>
          )} */}

          <Row gutter={[16, 16]}>
            {availableSizes.height && (
              <Col span={6}>
                <Title level={5}>{translations.height}</Title>
                <InputNumber
                  min={0}
                  max={selectedProduct?.maxSizes[0]?.height}
                  value={sizes.height}
                  onChange={(value) => handleSizeChange('height', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
            {availableSizes.width && (
              <Col span={6}>
                <Title level={5}>{translations.width}</Title>
                <InputNumber
                  // min={0}
                  min={selectedProduct?.maxSizes[0]?.minWidth}
                  max={selectedProduct?.maxSizes[0]?.width}
                  value={sizes.width}
                  onChange={(value) => handleSizeChange('width', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
            {availableSizes.length && (
              <Col span={6}>
                <Title level={5}>{translations.length}</Title>
                <InputNumber
                  min={0}
                  max={selectedProduct?.maxSizes[0]?.length}
                  value={sizes.length}
                  onChange={(value) => handleSizeChange('length', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
            {availableSizes.thickness && (
              <Col span={6}>
                <Title level={5}>{translations.thickness}</Title>
                <InputNumber
                  min={0}
                  max={selectedProduct?.maxSizes[0]?.thickness}
                  value={sizes.thickness}
                  onChange={(value) => handleSizeChange('thickness', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
          </Row>
        </Card>
      )
    },
    {
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
          productType={productType}
        />
      )
    },
    {
      key: "4",
      label: (
        <span>
          {translations.decorBack}
          <span style={{ color: '#00A651' }}>
            {selectedBackDecorType ? ` - ${selectedBackDecorType.typeName}` : ""}
            {selectedBackDecor ? ` - ${selectedBackDecor.title}` : ""}
            {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
          </span>
        </span>
      ),
      disabled: !selectedProduct || isBackDecorDisabled,
      children: (
        <DecorSelection
          doorId={selectedProduct?.documentId}
          selectedDecorType={selectedBackDecorType}
          selectedDecor={selectedBackDecor}
          colorCode={backColorCode}
          onDecorTypeSelect={setSelectedBackDecorType}
          onDecorSelect={setSelectedBackDecor}
          onColorChange={setBackColorCode}
          isFrontSide={false}
          onClearSelection={clearBackSelection}
          suborderId={suborderId}
          productType={productType}
          decorCombinations={selectedProduct?.decorCombinations}
        />
      )
    }
  ];

  return (
    <div>
      <Divider orientation="left">{translations.selection} {productType}</Divider>
      <div style={{ display: 'flex', justifyContent: 'right', alignItems: 'center', marginBottom: 32, marginTop: -45 }}>
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
          {productId? translations.update : translations.save}
        </Button>
        
        {(productId || productData?.suborderProducts[0]?.documentId) && (
          <Button
            danger
            onClick={handleDelete}
            loading={saving}
          >
            {translations.delete}
          </Button>
        )}
      </div>

      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={items}
      />
    </div>
  );
};

export default ElementSelection;