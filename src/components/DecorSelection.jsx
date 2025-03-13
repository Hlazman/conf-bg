import React, { useState, useEffect } from "react";
import { Tabs, Card, Row, Col, Spin, Empty, Button, Radio, Typography, message } from "antd";
import { useQuery, useMutation, gql } from "@apollo/client";
import { GET_DECOR_TYPES, GET_DECORS } from '../api/queries';
import ColorPicker from '../components/ColorPicker';

const { Title } = Typography;

// Мутация для обновления SuborderProduct
const UPDATE_SUBORDER_PRODUCT = gql`
  mutation UpdateSuborderProduct($documentId: ID!, $data: SuborderProductInput!) {
    updateSuborderProduct(documentId: $documentId, data: $data) {
      documentId
    }
  }
`;

// Запрос для получения существующего SuborderProduct
const GET_SUBORDER_PRODUCT = gql`
  query GetSuborderProduct($filters: SuborderProductFiltersInput) {
    suborderProducts(filters: $filters) {
      documentId
      decor {
        documentId
        title
      }
      secondSideDecor {
        documentId
        title
      }
      colorCode
      secondSideColorCode
      veneerDirection
      secondSideVeneerDirection
      type
      decor_type {
        documentId
        typeName
      }
      secondSideDecorType {
        documentId
        typeName
      }
    }
  }
`;

const DecorSelection = ({ 
  doorId, // ID выбранной двери
  selectedDecorType, 
  selectedDecor, 
  colorCode,
  onDecorTypeSelect, 
  onDecorSelect, 
  onColorChange,
  isFrontSide = true, // Параметр для определения стороны
  onClearSelection = null, // Функция для очистки выбора (для тыльной стороны)
  suborderId, // ID подзаказа для сохранения
  productType
}) => {
  const [suborderProductId, setSuborderProductId] = useState(null);
  const [saving, setSaving] = useState(false);
  
  // Состояние для хранения ориентации Veneer
  const [veneerOrientation, setVeneerOrientation] = useState("vertical");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeDecorTabKey, setActiveDecorTabKey] = useState(null);
  
  // Запрос на получение существующего SuborderProduct
  const { data: suborderProductData, loading: loadingSuborderProduct, refetch } = useQuery(GET_SUBORDER_PRODUCT, {
    variables: {
      filters: {
        suborder: {
          documentId: {
            eq: suborderId
          }
        },
        type: {
          // eq: "door"
          eq: productType 
        }
      }
    },
    skip: !suborderId,
    fetchPolicy: "network-only"
  });

  // Мутация для обновления SuborderProduct
  const [updateSuborderProduct] = useMutation(UPDATE_SUBORDER_PRODUCT, {
    onCompleted: () => {
      message.success(`Декор ${isFrontSide ? 'лицевой' : 'тыльной'} стороны успешно обновлен`);
      setSaving(false);
      refetch(); // Обновляем данные после успешного обновления
    },
    onError: (error) => {
      message.error(`Ошибка при обновлении: ${error.message}`);
      setSaving(false);
    }
  });
  
  // Запрос типов декора для выбранной двери
  const { 
    data: decorTypesData, 
    loading: decorTypesLoading, 
    error: decorTypesError 
  } = useQuery(GET_DECOR_TYPES, {
    variables: {
      filters: {
        products: {
          documentId: {
            eq: doorId
          }
        }
      },
      pagination: {
        limit: 300
      }
    },
    skip: !doorId
  });
  
  const decorTypes = decorTypesData?.decorTypes || [];
  
  // Запрос декоров для выбранного типа декора
  const { 
    data: decorsData, 
    loading: decorsLoading, 
    error: decorsError 
  } = useQuery(GET_DECORS, {
    variables: {
      pagination: {
        limit: 300
      },
      filters: {
        decor_type: {
          documentId: {
            eq: selectedDecorType?.documentId
          }
        }
      }
    },
    skip: !selectedDecorType
  });
  
  const decors = decorsData?.decors || [];
  
  // Эффект для загрузки данных из SuborderProduct
useEffect(() => {
  if (!loadingSuborderProduct && suborderProductData) {
    if (suborderProductData.suborderProducts && suborderProductData.suborderProducts.length > 0) {
      const suborderProduct = suborderProductData.suborderProducts[0];
      setSuborderProductId(suborderProduct.documentId);
      
      // Устанавливаем активную вкладку и данные только при первой загрузке
      if (!activeDecorTabKey) {
        if (isFrontSide && suborderProduct.decor_type) {
          const decorType = decorTypes.find(dt => dt.documentId === suborderProduct.decor_type.documentId);
          if (decorType) {
            // Сначала устанавливаем тип декора и ждем загрузки декоров
            setActiveDecorTabKey(suborderProduct.decor_type.documentId);
            onDecorTypeSelect(decorType);
            
            // Остальные действия выполнятся в другом useEffect после загрузки декоров
          }
        } else if (!isFrontSide && suborderProduct.secondSideDecorType) {
          const decorType = decorTypes.find(dt => dt.documentId === suborderProduct.secondSideDecorType.documentId);
          if (decorType) {
            // Сначала устанавливаем тип декора и ждем загрузки декоров
            setActiveDecorTabKey(suborderProduct.secondSideDecorType.documentId);
            onDecorTypeSelect(decorType);
            
            // Остальные действия выполнятся в другом useEffect после загрузки декоров
          }
        }
      }
    }
  }
}, [suborderProductData, loadingSuborderProduct, decorTypes, isFrontSide, onDecorTypeSelect, activeDecorTabKey]);

// Отдельный эффект для установки декора и других параметров после загрузки декоров
useEffect(() => {
  // Если декоры загружены и есть данные о suborderProduct
  if (!decorsLoading && decors && decors.length > 0 && suborderProductData) {
    const suborderProduct = suborderProductData.suborderProducts?.[0];
    if (!suborderProduct) return;
    
    if (isFrontSide) {
      // Установка ориентации шпона
      if (selectedDecorType?.typeName === "Veneer" && suborderProduct.veneerDirection) {
        setVeneerOrientation(suborderProduct.veneerDirection);
      }
      
      // Установка декора
      if (suborderProduct.decor && selectedDecorType) {
        const decorToSelect = decors.find(d => d.documentId === suborderProduct.decor.documentId);
        if (decorToSelect) {
          onDecorSelect(decorToSelect);
        }
      }
      
      // Установка цвета
      if (isPaintType(selectedDecorType?.typeName) && suborderProduct.colorCode) {
        onColorChange(suborderProduct.colorCode);
      }
    } else {
      // Установка ориентации шпона
      if (selectedDecorType?.typeName === "Veneer" && suborderProduct.secondSideVeneerDirection) {
        setVeneerOrientation(suborderProduct.secondSideVeneerDirection);
      }
      
      // Установка декора
      if (suborderProduct.secondSideDecor && selectedDecorType) {
        const decorToSelect = decors.find(d => d.documentId === suborderProduct.secondSideDecor.documentId);
        if (decorToSelect) {
          onDecorSelect(decorToSelect);
        }
      }
      
      // Установка цвета
      if (isPaintType(selectedDecorType?.typeName) && suborderProduct.secondSideColorCode) {
        onColorChange(suborderProduct.secondSideColorCode);
      }
    }
  }
}, [decors, decorsLoading, suborderProductData, isFrontSide, selectedDecorType, onDecorSelect, onColorChange]);

  
  // Эффект для установки категории по умолчанию для Veneer
  useEffect(() => {
    if (selectedDecorType?.typeName === "Veneer" && decors && decors.length > 0) {
      const categories = getVeneerCategories(decors);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [selectedDecorType, decors, selectedCategory]);

  // Отдельный эффект для установки цвета
useEffect(() => {
  if (suborderProductData?.suborderProducts?.[0]) {
    const suborderProduct = suborderProductData.suborderProducts[0];
    
    // Проверяем, что тип декора выбран и это тип с выбором цвета
    if (selectedDecorType && isPaintType(selectedDecorType.typeName)) {
      if (isFrontSide && suborderProduct.colorCode) {
        console.log("Setting front color code:", suborderProduct.colorCode);
        onColorChange(suborderProduct.colorCode);
      } else if (!isFrontSide && suborderProduct.secondSideColorCode) {
        console.log("Setting back color code:", suborderProduct.secondSideColorCode);
        onColorChange(suborderProduct.secondSideColorCode);
      }
    }
  }
}, [suborderProductData, selectedDecorType, isFrontSide, onColorChange]);
  
  // Функция для определения типов декора, для которых нужно показывать ColorPicker
  const isPaintType = (typeName) => {
    return typeName && (
      typeName === "Paint" || 
      typeName === "Paint glass" || 
      typeName === "Paint veneer"
    );
  };
  
  // Функция для получения категорий Veneer из декоров
  const getVeneerCategories = (decorsList) => {
    if (!decorsList) return [];
    
    const categories = decorsList
      .filter(decor => decor.category && decor.category.startsWith('veneer_'))
      .map(decor => decor.category)
      .filter((value, index, self) => self.indexOf(value) === index);
    
    return categories.sort();
  };
  
  // Функция для фильтрации декоров по категории
  const getDecorsByCategory = (decorsList, category) => {
    if (!decorsList || !category) return [];
    
    return decorsList.filter(decor => decor.category === category);
  };
  
  // Обработчик выбора типа декора
  const handleDecorTypeSelect = (decorType) => {
    setActiveDecorTabKey(decorType.documentId);
    onDecorTypeSelect(decorType);
    
    // Сбрасываем выбранный декор и категорию
    onDecorSelect(null);
    setSelectedCategory(null);
    
    // Если выбран тип Paint, сбрасываем код цвета
    if (isPaintType(decorType.typeName)) {
      onColorChange("");
    }
  };
  
  // Обработчик выбора категории
  const handleCategorySelect = (category) => {
    setSelectedCategory(category);
    onDecorSelect(null);
  };
  
  // Функция для обработки выбора декора с учетом ориентации
  const handleDecorSelect = (decor) => {
    // Если это Veneer, передаем также ориентацию
    if (selectedDecorType && selectedDecorType.typeName === "Veneer") {
      onDecorSelect({ ...decor, orientation: veneerOrientation });
    } else {
      onDecorSelect(decor);
    }
  };
  
// Функция сохранения декора
const handleSaveDecor = () => {
  if (!suborderId) {
    message.error("ID подзаказа не найден");
    return;
  }

  if (!suborderProductId) {
    message.error(`Сначала выберите дверь в разделе 'Выбор полотна'`);
    return;
  }

  setSaving(true);

  // Подготавливаем данные для обновления в зависимости от стороны
  const decorData = {};

  if (isFrontSide) {
    // Явно сбрасываем все значения
    decorData.decor = selectedDecor ? selectedDecor.documentId : null;
    decorData.colorCode = colorCode || null;
    decorData.veneerDirection = null; // Сбрасываем по умолчанию
    decorData.decor_type = selectedDecorType ? selectedDecorType.documentId : null;
    
    // Устанавливаем направление шпона только если выбран тип декора Veneer
    if (selectedDecorType && selectedDecorType.typeName === "Veneer") {
      decorData.veneerDirection = veneerOrientation;
    }
  } else {
    // Явно сбрасываем все значения для тыльной стороны
    decorData.secondSideDecor = selectedDecor ? selectedDecor.documentId : null;
    decorData.secondSideColorCode = colorCode || null;
    decorData.secondSideVeneerDirection = null; // Сбрасываем по умолчанию
    decorData.secondSideDecorType = selectedDecorType ? selectedDecorType.documentId : null;
    
    // Устанавливаем направление шпона только если выбран тип декора Veneer
    if (selectedDecorType && selectedDecorType.typeName === "Veneer") {
      decorData.secondSideVeneerDirection = veneerOrientation;
    }
  }

  // Добавляем тип продукта
  decorData.type = productType;

  // Обновляем существующий SuborderProduct
  updateSuborderProduct({
    variables: {
      documentId: suborderProductId,
      data: decorData
    }
  });
};


  
  if (decorTypesLoading || loadingSuborderProduct) return <Spin />;
  
  if (decorTypesError) {
    return (
      <div>
        <div>Ошибка при загрузке типов декоров: {decorTypesError.message}</div>
        <pre>{JSON.stringify(decorTypesError, null, 2)}</pre>
      </div>
    );
  }
  
  if (!doorId) {
    return (
      <Empty 
        description="Сначала выберите полотно" 
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }
  
  if (decorTypes.length === 0) {
    return (
      <Empty description={
        <div>
          <p>Нет доступных типов декора</p>
        </div>
      } />
    );
  }
  
  // Создаем items для Tabs декоров
  const decorTabItems = decorTypes.map(decorType => {
    // Если это тип Veneer, создаем вложенные табы для категорий
    if (decorType.typeName === "Veneer") {
      const veneerCategories = getVeneerCategories(decors);
      
      // Создаем вложенные табы для категорий Veneer
      const categoryTabItems = veneerCategories.map(category => ({
        label: category.replace('veneer_', 'Veneer '),
        key: category,
        children: (
          <div>
            <div style={{ marginBottom: 16 }}>
              <Radio.Group 
                value={veneerOrientation} 
                onChange={(e) => setVeneerOrientation(e.target.value)}
                buttonStyle="solid"
              >
                <Radio.Button value="vertical">Вертикальный</Radio.Button>
                <Radio.Button value="horizontal">Горизонтальный</Radio.Button>
              </Radio.Group>
            </div>
            <Row gutter={[16, 16]}>
              {getDecorsByCategory(decors, category).map(decor => (
                <Col span={4} key={decor.documentId}>
                  <Card
                    hoverable
                    cover={
                      decor.image?.url ? 
                      <img 
                        alt={decor.title} 
                        src={`https://dev.api.boki-groupe.com${decor.image.url}`} 
                        style={{ height: 200, objectFit: 'cover' }}
                      /> : 
                      <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        Нет изображения
                      </div>
                    }
                    onClick={() => handleDecorSelect(decor)}
                    style={{ 
                      border: selectedDecor?.documentId === decor.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
                    }}
                  >
                    <Card.Meta title={decor.title} />
                  </Card>
                </Col>
              ))}
            </Row>
          </div>
        )
      }));
      
      return {
        label: decorType.typeName,
        key: decorType.documentId,
        children: (
          <div>
            {selectedDecorType && selectedDecorType.documentId === decorType.documentId ? (
              decorsLoading ? (
                <Spin />
              ) : decorsError ? (
                <div>
                  <div>Ошибка при загрузке декоров: {decorsError.message}</div>
                  <pre>{JSON.stringify(decorsError, null, 2)}</pre>
                </div>
              ) : veneerCategories.length > 0 ? (
                <Tabs 
                  type="card" 
                  items={categoryTabItems}
                  onChange={(key) => handleCategorySelect(key)}
                  activeKey={selectedCategory}
                />
              ) : (
                <Empty description={
                  <div>
                    <p>Нет доступных категорий Veneer</p>
                  </div>
                } />
              )
            ) : (
              <Empty 
                description="Выберите этот тип декора для просмотра содержимого" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        )
      };
    } else {
      // Для остальных типов декора
      return {
        label: decorType.typeName,
        key: decorType.documentId,
        children: (
          <div>
            {selectedDecorType && selectedDecorType.documentId === decorType.documentId ? (
              isPaintType(decorType.typeName) ? (
                // Для типов Paint, Paint glass, Paint veneer показываем ColorPicker
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                  <ColorPicker 
                    value={colorCode} 
                    onChange={onColorChange} 
                  />
                </div>
              ) : (
                // Для остальных типов показываем декоры с изображениями
                decorsLoading ? (
                  <Spin />
                ) : decorsError ? (
                  <div>
                    <div>Ошибка при загрузке декоров: {decorsError.message}</div>
                    <pre>{JSON.stringify(decorsError, null, 2)}</pre>
                  </div>
                ) : decors && decors.length > 0 ? (
                  <Row gutter={[16, 16]}>
                    {decors.map(decor => (
                      <Col span={4} key={decor.documentId}>
                        <Card
                          hoverable
                          cover={
                            decor.image?.url ? 
                            <img 
                              alt={decor.title} 
                              src={`https://dev.api.boki-groupe.com${decor.image.url}`} 
                              style={{ height: 200, objectFit: 'cover' }}
                            /> : 
                            <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              Нет изображения
                            </div>
                          }
                          onClick={() => handleDecorSelect(decor)}
                          style={{ 
                            border: selectedDecor?.documentId === decor.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
                          }}
                        >
                          <Card.Meta title={decor.title} />
                        </Card>
                      </Col>
                    ))}
                  </Row>
                ) : (
                  <Empty description={
                    <div>
                      <p>Нет доступных декоров типа {decorType.typeName}</p>
                      <p>ID типа декора: {decorType.documentId}</p>
                    </div>
                  } />
                )
              )
            ) : (
              <Empty 
                description="Выберите этот тип декора для просмотра содержимого" 
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </div>
        )
      };
    }
  });
  
  return (
    <div>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={4}>{isFrontSide ? "Декор лицевой стороны" : "Декор тыльной стороны"}</Title>
        <div>
          {!isFrontSide && onClearSelection && (
            <Button onClick={onClearSelection} danger style={{ marginRight: 8 }}>
              Убрать выбранное
            </Button>
          )}
          <Button 
            type="primary" 
            onClick={handleSaveDecor} 
            loading={saving}
            disabled={!suborderProductId}
          >
            Сохранить
          </Button>
        </div>
      </div>
      <Tabs 
        type="card" 
        items={decorTabItems} 
        onChange={(key) => {
          const selected = decorTypes.find(dt => dt.documentId === key);
          if (selected) handleDecorTypeSelect(selected);
        }}
        activeKey={activeDecorTabKey || (selectedDecorType ? selectedDecorType.documentId : null)}
      />
    </div>
  );
};

export default DecorSelection;