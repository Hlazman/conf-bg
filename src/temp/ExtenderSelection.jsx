import React, { useState, useEffect, useMemo } from "react";
import { Card, Row, Col, Typography, Spin, Empty, InputNumber, Button, message, Divider, Tabs } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import DecorSelection from '../components/DecorSelection';

const { Title } = Typography;

// Запрос для получения элементов расширителя
const GET_EXTENDER_ELEMENTS = gql`
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
  }
`;

const ExtenderSelection = ({
  selectedDoor,
  suborderId
}) => {
  const [extenderProductId, setExtenderProductId] = useState(null);
  const [selectedExtender, setSelectedExtender] = useState(null);
  const [extenderWidth, setExtenderWidth] = useState(100);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("1");
  
  // Состояние для лицевой стороны декора
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");
  
  // Состояние для тыльной стороны декора
  const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
  const [selectedBackDecor, setSelectedBackDecor] = useState(null);
  const [backColorCode, setBackColorCode] = useState("");

  // Запрос для получения элементов расширителя
  const { loading, error, data } = useQuery(GET_EXTENDER_ELEMENTS, {
    variables: {
      filters: {
        compatibleProductss: {
          title: {
            eqi: selectedDoor?.title
          }
        },
        type: {
          eqi: "extender"
        }
      }
    },
    skip: !selectedDoor
  });

  // Запрос для получения существующего SuborderProduct типа extender
  const { data: extenderProductData, loading: loadingExtenderProduct, refetch: refetchExtender } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          eq: "extender"
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для создания SuborderProduct
  const [createSuborderProduct] = useMutation(CREATE_SUBORDER_PRODUCT, {
    onCompleted: (data) => {
      message.success("Расширитель успешно добавлен");
      setSaving(false);
      refetchExtender();
    },
    onError: (error) => {
      message.error(`Ошибка при сохранении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success("Расширитель успешно обновлен");
      setSaving(false);
      refetchExtender();
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });

  // Мутация для удаления SuborderProduct
    const [deleteSuborderProduct] = useMutation(DELETE_SUBORDER_PRODUCT, {
        onCompleted: () => {
        message.success("Расширитель успешно удален");
        setSaving(false);
        refetchExtender();
        
        // Сбросить состояние после удаления
        setExtenderProductId(null);
        setSelectedExtender(null);
        setExtenderWidth(100);
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

  // Функция удаления выбранного расширителя
    const handleDelete = async () => {
        if (!extenderProductId) {
        message.error("Расширитель не найден");
        return;
        }
    
        setSaving(true);
        try {
        await deleteSuborderProduct({
            variables: {
            documentId: extenderProductId
            }
        });
        } catch (error) {
        message.error(`Произошла ошибка: ${error.message}`);
        setSaving(false);
        }
    };

  // Получаем элементы расширителя из результатов запроса
  const extenderElements = useMemo(() => {
    return data?.products || [];
  }, [data]);

  // Эффект для загрузки данных при изменении extenderElements
  useEffect(() => {
    if (!loadingExtenderProduct && extenderProductData && extenderElements.length > 0) {
      if (extenderProductData.suborderProducts && extenderProductData.suborderProducts.length > 0) {
        const extenderProduct = extenderProductData.suborderProducts[0];
        setExtenderProductId(extenderProduct.documentId);
        
        // Устанавливаем ширину расширителя
        if (extenderProduct.sizes && extenderProduct.sizes.width) {
          setExtenderWidth(extenderProduct.sizes.width);
        }
        
        // Если есть продукт и пользователь еще не выбрал расширитель, устанавливаем его
        if (extenderProduct.product) {
          const extenderFromProducts = extenderElements.find(extender =>
            extender.documentId === extenderProduct.product.documentId
          );
          if (extenderFromProducts) {
            setSelectedExtender(extenderFromProducts);
          }
        }
        
        // Устанавливаем декор и тип декора для лицевой стороны
        if (extenderProduct.decor_type) {
          setSelectedFrontDecorType(extenderProduct.decor_type);
        }
        
        if (extenderProduct.decor) {
          setSelectedFrontDecor(extenderProduct.decor);
        }
        
        if (extenderProduct.colorCode) {
          setFrontColorCode(extenderProduct.colorCode);
        }
        
        // Устанавливаем декор и тип декора для тыльной стороны
        if (extenderProduct.secondSideDecorType) {
          setSelectedBackDecorType(extenderProduct.secondSideDecorType);
        }
        
        if (extenderProduct.secondSideDecor) {
          setSelectedBackDecor(extenderProduct.secondSideDecor);
        }
        
        if (extenderProduct.secondSideColorCode) {
          setBackColorCode(extenderProduct.secondSideColorCode);
        }
      }
    }
  }, [extenderElements, extenderProductData, loadingExtenderProduct]);

  // Функция для выбора расширителя
  const handleExtenderSelect = (extender) => {
    setSelectedExtender(extender);
  };

  // Функция для изменения ширины расширителя
  const handleWidthChange = (value) => {
    setExtenderWidth(value);
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

  // Функция сохранения выбранного расширителя
  const handleSave = async () => {
    if (!suborderId) {
      message.error("ID подзаказа не найден");
      return;
    }

    if (!selectedExtender) {
      message.error("Выберите расширитель");
      return;
    }

    setSaving(true);

    try {
      const extenderData = {
        suborder: suborderId,
        product: selectedExtender.documentId,
        type: "extender",
        sizes: {
          width: extenderWidth
        },
        decor: selectedFrontDecor ? selectedFrontDecor.documentId : null,
        decor_type: selectedFrontDecorType ? selectedFrontDecorType.documentId : null,
        colorCode: isPaintType(selectedFrontDecorType?.typeName) ? frontColorCode : null,
        secondSideDecor: selectedBackDecor ? selectedBackDecor.documentId : null,
        secondSideDecorType: selectedBackDecorType ? selectedBackDecorType.documentId : null,
        secondSideColorCode: isPaintType(selectedBackDecorType?.typeName) ? backColorCode : null
      };

      if (extenderProductId) {
        // Обновляем существующий SuborderProduct
        await updateSuborderProduct({
          variables: {
            documentId: extenderProductId,
            data: extenderData
          }
        });
      } else {
        // Создаем новый SuborderProduct
        await createSuborderProduct({
          variables: {
            data: extenderData
          }
        });
      }
    } catch (error) {
      message.error(`Произошла ошибка: ${error.message}`);
      setSaving(false);
    }
  };

  if (loading || loadingExtenderProduct) return <Spin size="large" />;
  if (error) return <Empty description="Ошибка при загрузке данных" />;
  if (!selectedDoor) return <Empty description="Сначала выберите дверь" />;
  if (extenderElements.length === 0) return <Empty description="Нет доступных расширителей для выбранной двери" />;

  return (
    <div>
      <Row justify="space-between" align="middle">
        <Col>
          <Title level={4}>Выбор расширителя</Title>
        </Col>
        <Col>
          <Button 
            type="primary" 
            onClick={handleSave} 
            loading={saving}
          >
            Сохранить расширитель
          </Button>

            {extenderProductId && (
              <Button 
                type="primary" 
                danger 
                onClick={handleDelete} 
                loading={saving}
                style={{marginLeft: 10}}
              >
                Удалить
              </Button>
            )}
        </Col>
      </Row>
      
      <Row gutter={[16, 16]}>
        {extenderElements.map((extender) => (
          <Col key={extender.documentId} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              style={{ 
                borderColor: selectedExtender?.documentId === extender.documentId ? '#1890ff' : undefined,
                borderWidth: selectedExtender?.documentId === extender.documentId ? '2px' : '1px'
              }}
              onClick={() => handleExtenderSelect(extender)}
            >
              <Card.Meta title={extender.title} />
            </Card>
          </Col>
        ))}
      </Row>
      
      {selectedExtender && (
        <>
          <Divider />
          <Title level={5}>Ширина расширителя (мм)</Title>
          <InputNumber
            min={50}
            max={500}
            value={extenderWidth}
            onChange={handleWidthChange}
            style={{ width: 200, marginBottom: 16 }}
          />
          
          <Divider />
          <Tabs 
            activeKey={activeTab} 
            onChange={setActiveTab}
            items={[
                {
                key: "1",
                label: (
                    <span>
                    Лицевая сторона
                    {selectedFrontDecorType ? ` - ${selectedFrontDecorType.typeName}` : ""}
                    {selectedFrontDecor ? ` - ${selectedFrontDecor.title}` : ""}
                    {selectedFrontDecorType && isPaintType(selectedFrontDecorType.typeName) && frontColorCode ? ` - ${frontColorCode}` : ""}
                    </span>
                ),
                children: (
                    <>
                    <Title level={5}>Выбор декора для лицевой стороны</Title>
                    <DecorSelection 
                        doorId={selectedExtender?.documentId}
                        selectedDecorType={selectedFrontDecorType}
                        selectedDecor={selectedFrontDecor}
                        colorCode={frontColorCode}
                        onDecorTypeSelect={setSelectedFrontDecorType}
                        onDecorSelect={setSelectedFrontDecor}
                        onColorChange={setFrontColorCode}
                        isFrontSide={true}
                        suborderId={suborderId}
                        productType="extender"
                    />
                    </>
                )
                },
                {
                key: "2",
                label: (
                    <span>
                    Тыльная сторона
                    {selectedBackDecorType ? ` - ${selectedBackDecorType.typeName}` : ""}
                    {selectedBackDecor ? ` - ${selectedBackDecor.title}` : ""}
                    {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
                    </span>
                ),
                children: (
                    <>
                    <Title level={5}>Выбор декора для тыльной стороны</Title>
                    <DecorSelection 
                        doorId={selectedExtender?.documentId}
                        selectedDecorType={selectedBackDecorType}
                        selectedDecor={selectedBackDecor}
                        colorCode={backColorCode}
                        onDecorTypeSelect={setSelectedBackDecorType}
                        onDecorSelect={setSelectedBackDecor}
                        onColorChange={setBackColorCode}
                        isFrontSide={false}
                        onClearSelection={clearBackSelection}
                        suborderId={suborderId}
                        productType="extender"
                    />
                    </>
                )
                }
              ]}
            />
        </>
      )}
    </div>
  );
};

export default ExtenderSelection;
