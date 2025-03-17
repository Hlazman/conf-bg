import React, { useState, useEffect, useMemo, useContext } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Divider, Tabs } from "antd";
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

const ElementSelection = ({
  selectedDoor,
  suborderId,
  productType, // тип продукта (extender, и т.д.)
  availableSizes = { height: true, length: true, width: true, thickness: true }, // какие размеры доступны
  defaultSizes = { height: 0, length: 0, width: 100, thickness: 0 }, // значения по умолчанию
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

  // Запрос для получения элементов продукта
  const { loading, error, data } = useQuery(GET_PRODUCT_ELEMENTS, {
    variables: {
      filters: {
        compatibleProductss: {
          title: {
            eqi: selectedDoor?.title
          }
        },
        type: {
          eqi: productType
        }
      }
    },
    skip: !selectedDoor
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
      setSizes(defaultSizes);
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
  // const handleDelete = async () => {
  //   if (!productId) {
  //     message.error(`${productType} не найден`);
  //     return;
  //   }

  //   setSaving(true);
  //   try {
  //     await deleteSuborderProduct({
  //       variables: {
  //         documentId: productId
  //       }
  //     });
  //   } catch (error) {
  //     message.error(`Произошла ошибка: ${error.message}`);
  //     setSaving(false);
  //   }
  // };

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
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingProduct) return <Spin size="large" />;

  if (error) return <Empty description={`Ошибка загрузки данных: ${error.message}`} />;

  // Создаем items для Tabs
  const items = [
    {
      key: "1",
      label: "Выбор элемента",
      children: (
        <Card>
          <Row gutter={[16, 16]}>
            {productElements.map(product => (
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
                  <Title level={5}>{product.title}</Title>
                </Card>
              </Col>
            ))}
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
            {availableSizes.height && (
              <Col span={6}>
                <Title level={5}>Высота (мм)</Title>
                <InputNumber
                  min={0}
                  value={sizes.height}
                  onChange={(value) => handleSizeChange('height', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
            {availableSizes.width && (
              <Col span={6}>
                <Title level={5}>Ширина (мм)</Title>
                <InputNumber
                  min={0}
                  value={sizes.width}
                  onChange={(value) => handleSizeChange('width', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
            {availableSizes.length && (
              <Col span={6}>
                <Title level={5}>Длина (мм)</Title>
                <InputNumber
                  min={0}
                  value={sizes.length}
                  onChange={(value) => handleSizeChange('length', value)}
                  style={{ width: '100%' }}
                  addonAfter={'mm'}
                />
              </Col>
            )}
            {availableSizes.thickness && (
              <Col span={6}>
                <Title level={5}>Толщина (мм)</Title>
                <InputNumber
                  min={0}
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
          productType={productType}
        />
      )
    },
    {
      key: "4",
      label: (
        <span>
          Тыльная сторона
          <span style={{ color: '#00A651' }}>
            {selectedBackDecorType ? ` - ${selectedBackDecorType.typeName}` : ""}
            {selectedBackDecor ? ` - ${selectedBackDecor.title}` : ""}
            {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
          </span>
        </span>
      ),
      disabled: !selectedProduct,
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
        />
      )
    }
  ];

  return (
    <div>
      <Row justify="space-between" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <Title level={3}>Выбор {productType}</Title>
        </Col>
        <Col>
          <Button
            type="primary"
            onClick={handleSave}
            loading={saving}
            disabled={!selectedProduct}
            // style={{ marginRight: 8 }}
            style={{
              ...{ marginRight: 8 },
              ...(!productId ? {} : { backgroundColor: '#52C41A' })
            }}
          >
            {/* Сохранить */}
            {productId? translations.update : translations.save}
          </Button>
          {/* {productId && ( */}
          {(productId || productData?.suborderProducts[0]?.documentId) && (
            <Button
              danger
              onClick={handleDelete}
              loading={saving}
            >
              Удалить
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

export default ElementSelection;