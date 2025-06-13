import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Spin, Empty, Button, message, Tabs, Divider } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import DecorSelection from './DecorSelection';
import { LanguageContext } from "../context/LanguageContext";
import ArchiveOverlay from './ArchiveOverlay';

// Запрос для получения элементов продукта
const GET_PRODUCT_ELEMENTS = gql`
query Products($pagination: PaginationArg, $filters: ProductFiltersInput) {
  products(pagination: $pagination, filters: $filters) {
    title
    archive
    type
    decor_types {
      typeName
      documentId
    }
    documentId
    brand
    image {
      documentId
      url
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
      image {
        documentId
        url
      }
    }
    type
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

const SkirtingInsertSelection = ({
  selectedSkirting,
  suborderId,
  productType, // тип продукта skirtingInsert
  onAfterSubmit
}) => {
  const [productId, setProductId] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  
  const { translations } = useContext(LanguageContext);

  // Состояние для лицевой стороны декора
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");

  // Состояние для тыльной стороны декора
  // const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
  // const [selectedBackDecor, setSelectedBackDecor] = useState(null);
  // const [backColorCode, setBackColorCode] = useState("");

  // Запрос для получения элементов продукта
  const { loading, error, data } = useQuery(GET_PRODUCT_ELEMENTS, {
    variables: {
      filters: {
        compatibleProductss: {
          title: {
            eqi: selectedSkirting?.title
          }
        },
        type: {
          eqi: productType
        }
      }
    },
    skip: !selectedSkirting
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
      message.error(`${translations.err}: ${error.message}`);
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
      message.success(`${productType} ${translations.removed}`);
      setSaving(false);
      refetchProduct();
      // Сбросить состояние после удаления
      setProductId(null);
      setSelectedProduct(null);
      setSelectedFrontDecorType(null);
      setSelectedFrontDecor(null);
      setFrontColorCode("");
      // setSelectedBackDecorType(null);
      // setSelectedBackDecor(null);
      // setBackColorCode("");
    },
    onError: (error) => {
      message.error(`${translations.deleteError}: ${error.message}`);
      setSaving(false);
    }
  });

  // Функция удаления выбранного продукта
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
        // if (product.secondSideDecorType) {
        //   setSelectedBackDecorType(product.secondSideDecorType);
        // }
        
        // if (product.secondSideDecor) {
        //   setSelectedBackDecor(product.secondSideDecor);
        // }
        
        // if (product.secondSideColorCode) {
        //   setBackColorCode(product.secondSideColorCode);
        // }
      }
    }
  }, [productElements, productData, loadingProduct]);

  // Функция для выбора продукта
  const handleProductSelect = (product) => {
    setSelectedProduct(product);
  };

  // Обработчик для очистки выбора тыльной стороны
//   const clearBackSelection = () => {
//     setSelectedBackDecorType(null);
//     setSelectedBackDecor(null);
//     setBackColorCode("");
//   };

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

    setSaving(true);
    try {
      const productData = {
        suborder: suborderId,
        product: selectedProduct.documentId,
        type: productType,
        decor: selectedFrontDecor ? selectedFrontDecor.documentId : null,
        decor_type: selectedFrontDecorType ? selectedFrontDecorType.documentId : null,
        colorCode: isPaintType(selectedFrontDecorType?.typeName) ? frontColorCode : null,
        // secondSideDecor: selectedBackDecor ? selectedBackDecor.documentId : null,
        // secondSideDecorType: selectedBackDecorType ? selectedBackDecorType.documentId : null,
        // secondSideColorCode: isPaintType(selectedBackDecorType?.typeName) ? backColorCode : null
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

  if (loading || loadingProduct) return <Spin size="large" />;

  if (error) return <Empty description={`${translations.err}: ${error.message}`} />;

  const items = [
    {
      key: "1",
      label: translations.insert,
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

                  {/* <Card
                    hoverable
                    onClick={() => handleProductSelect(product)}
                    style={{
                      border: selectedProduct?.documentId === product.documentId
                        ? '2px solid #1890ff'
                        : '1px solid #d9d9d9'
                    }}
                  >
                    <Card.Meta title={translations[product.title]} />
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
                      cursor: product.archive ? 'not-allowed' : 'pointer',
                      position: 'relative'
                    }}
                  >
                    <Card.Meta title={translations[product.title]} />
                    {product.archive && <ArchiveOverlay text={translations.notAvailable} />}
                  </Card>

                </Col>
              ))
            )}
          </Row>
        </Card>
      )
    }
  ];

  // Добавляем вкладку лицевой стороны декора
  if (selectedProduct) {
    items.push({
      key: "2",
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
          onAfterSubmit={onAfterSubmit}
        />
      )
    });

    // Добавляем вкладку тыльной стороны декора
    // items.push({
    //   key: "3",
    //   label: (
    //     <span>
    //       Тыльная сторона
    //       <span style={{ color: '#00A651' }}>
    //         {selectedBackDecorType ? ` - ${selectedBackDecorType.typeName}` : ""}
    //         {selectedBackDecor ? ` - ${selectedBackDecor.title}` : ""}
    //         {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
    //       </span>
    //     </span>
    //   ),
    //   children: (
    //     <DecorSelection
    //       doorId={selectedProduct?.documentId}
    //       selectedDecorType={selectedBackDecorType}
    //       selectedDecor={selectedBackDecor}
    //       colorCode={backColorCode}
    //       onDecorTypeSelect={setSelectedBackDecorType}
    //       onDecorSelect={setSelectedBackDecor}
    //       onColorChange={setBackColorCode}
    //       isFrontSide={false}
    //       onClearSelection={clearBackSelection}
    //       suborderId={suborderId}
    //       productType={productType}
    //       onAfterSubmit={onAfterSubmit}
    //     />
    //   )
    // });
  }

  return (
    <div>
      <Divider orientation="left">{translations.selection} {translations.insert}</Divider> 
        <div style={{ marginBottom: 32, display: 'flex', justifyContent: 'right', alignItems: 'center', marginTop: -45  }}>
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
          {productId && (
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

export default SkirtingInsertSelection;
