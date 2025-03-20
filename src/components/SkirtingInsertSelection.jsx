import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, Button, message, Tabs } from "antd";
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
  productType, // тип продукта (skirtingInsert)
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
  const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
  const [selectedBackDecor, setSelectedBackDecor] = useState(null);
  const [backColorCode, setBackColorCode] = useState("");

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
      message.success(`${productType} успешно добавлен`);
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
      message.success(`${productType} успешно обновлен`);
      setSaving(false);
      refetchProduct();
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для удаления SuborderProduct
  const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(`${productType} успешно удален`);
      setSaving(false);
      refetchProduct();
      // Сбросить состояние после удаления
      setProductId(null);
      setSelectedProduct(null);
      setSelectedFrontDecorType(null);
      setSelectedFrontDecor(null);
      setFrontColorCode("");
      setSelectedBackDecorType(null);
      setSelectedBackDecor(null);
      setBackColorCode("");
    },
    onError: (error) => {
      message.error(`Ошибка при удалении: ${error.message}`);
      setSaving(false);
    }
  });

  // Функция удаления выбранного продукта
  const handleDelete = async () => {
    const idToDelete = productId || productData?.suborderProducts[0]?.documentId;
    if (!idToDelete) {
      message.error(`${productType} не найден`);
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
      message.error(`Произошла ошибка: ${error.message}`);
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
      message.error("ID подзаказа не найден");
      return;
    }

    if (!selectedProduct) {
      message.error(`Выберите ${productType}`);
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
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingProduct) return <Spin size="large" />;

  if (error) return <Empty description={`Ошибка: ${error.message}`} />;

  const items = [
    {
      key: "1",
      label: "Выбор вставки",
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            {productElements.length === 0 ? (
              <Col span={24}>
                <Empty description="Нет доступных вставок" />
              </Col>
            ) : (
              productElements.map(product => (
                <Col span={6} key={product.documentId}>
                  <Card
                    hoverable
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
    }
  ];

  // Добавляем вкладку лицевой стороны декора
  if (selectedProduct) {
    items.push({
      key: "2",
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
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>{translations[productType] || "Выбор вставки плинтуса"}</Title>
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
            {productId ? translations.update || "Обновить" : translations.save || "Сохранить"}
          </Button>
          {productId && (
            <Button
              danger
              onClick={handleDelete}
              loading={saving}
            >
              {translations.delete || "Удалить"}
            </Button>
          )}
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

export default SkirtingInsertSelection;
