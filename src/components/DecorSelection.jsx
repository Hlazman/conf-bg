// import React, { useState } from "react";
// import { Tabs, Card, Row, Col, Spin, Empty, Button, Radio } from "antd";
// import ColorPicker from '../components/ColorPicker';

// const DecorSelection = ({ 
//   decorTypes, 
//   decors, 
//   selectedDecorType, 
//   selectedDecor, 
//   colorCode, 
//   selectedCategory,
//   onDecorTypeSelect, 
//   onDecorSelect, 
//   onColorChange,
//   onCategorySelect,
//   loading,
//   loadingDecors,
//   error,
//   errorDecors,
//   isFrontSide = true, // Параметр для определения стороны
//   onClearSelection = null, // Функция для очистки выбора (для тыльной стороны)
//   activeDecorTabKey = null // Добавлен параметр для контроля активной вкладки
// }) => {
//   // Состояние для хранения ориентации Veneer
//   const [veneerOrientation, setVeneerOrientation] = useState("vertical");
  
//   // Функция для определения типов декора, для которых нужно показывать ColorPicker
//   const isPaintType = (typeName) => {
//     return typeName && (
//       typeName === "Paint" || 
//       typeName === "Paint glass" || 
//       typeName === "Paint veneer"
//     );
//   };
  
//   // Функция для получения категорий Veneer из декоров
//   const getVeneerCategories = (decorsList) => {
//     if (!decorsList) return [];
    
//     const categories = decorsList
//       .filter(decor => decor.category && decor.category.startsWith('veneer_'))
//       .map(decor => decor.category)
//       .filter((value, index, self) => self.indexOf(value) === index);
    
//     return categories.sort();
//   };
  
//   // Функция для фильтрации декоров по категории
//   const getDecorsByCategory = (decorsList, category) => {
//     if (!decorsList || !category) return [];
    
//     return decorsList.filter(decor => decor.category === category);
//   };
  
//   // Функция для обработки выбора декора с учетом ориентации
//   const handleDecorSelect = (decor) => {
//     // Если это Veneer, передаем также ориентацию
//     if (selectedDecorType && selectedDecorType.typeName === "Veneer") {
//       onDecorSelect({ ...decor, orientation: veneerOrientation });
//     } else {
//       onDecorSelect(decor);
//     }
//   };
  
//   if (loading) return <Spin />;
  
//   if (error) {
//     return (
//       <div>
//         <div>Ошибка при загрузке типов декоров: {error.message}</div>
//         <pre>{JSON.stringify(error, null, 2)}</pre>
//       </div>
//     );
//   }
  
//   if (decorTypes.length === 0) {
//     return (
//       <Empty description={
//         <div>
//           <p>Нет доступных типов декора</p>
//         </div>
//       } />
//     );
//   }
  
//   // Создаем items для Tabs декоров
//   const decorTabItems = decorTypes.map(decorType => {
//     // Если это тип Veneer, создаем вложенные табы для категорий
//     if (decorType.typeName === "Veneer") {
//       const veneerCategories = getVeneerCategories(decors);
      
//       // Создаем вложенные табы для категорий Veneer
//       const categoryTabItems = veneerCategories.map(category => ({
//         label: category.replace('veneer_', 'Veneer '),
//         key: category,
//         children: (
//           <div>
//             <div style={{ marginBottom: 16 }}>
//               <Radio.Group 
//                 value={veneerOrientation} 
//                 onChange={(e) => setVeneerOrientation(e.target.value)}
//                 buttonStyle="solid"
//               >
//                 <Radio.Button value="vertical">Вертикальный</Radio.Button>
//                 <Radio.Button value="horizontal">Горизонтальный</Radio.Button>
//               </Radio.Group>
//             </div>
//             <Row gutter={[16, 16]}>
//               {getDecorsByCategory(decors, category).map(decor => (
//                 <Col span={4} key={decor.documentId}>
//                   <Card
//                     hoverable
//                     cover={
//                       decor.image?.url ? 
//                       <img 
//                         alt={decor.title} 
//                         src={`https://dev.api.boki-groupe.com${decor.image.url}`} 
//                         style={{ height: 200, objectFit: 'cover' }}
//                       /> : 
//                       <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                         Нет изображения
//                       </div>
//                     }
//                     onClick={() => handleDecorSelect(decor)}
//                     style={{ 
//                       border: selectedDecor?.documentId === decor.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
//                     }}
//                   >
//                     <Card.Meta title={decor.title} />
//                   </Card>
//                 </Col>
//               ))}
//             </Row>
//           </div>
//         )
//       }));
      
//       return {
//         label: decorType.typeName,
//         key: decorType.documentId,
//         children: (
//           <div>
//             {selectedDecorType && selectedDecorType.documentId === decorType.documentId ? (
//               loadingDecors ? (
//                 <Spin />
//               ) : errorDecors ? (
//                 <div>
//                   <div>Ошибка при загрузке декоров: {errorDecors.message}</div>
//                   <pre>{JSON.stringify(errorDecors, null, 2)}</pre>
//                 </div>
//               ) : veneerCategories.length > 0 ? (
//                 <Tabs 
//                   type="card" 
//                   items={categoryTabItems}
//                   onChange={(key) => onCategorySelect(key)}
//                   activeKey={selectedCategory}
//                 />
//               ) : (
//                 <Empty description={
//                   <div>
//                     <p>Нет доступных категорий Veneer</p>
//                   </div>
//                 } />
//               )
//             ) : (
//               <Empty 
//                 description="Выберите этот тип декора для просмотра содержимого" 
//                 image={Empty.PRESENTED_IMAGE_SIMPLE}
//               />
//             )}
//           </div>
//         )
//       };
//     } else {
//       // Для остальных типов декора
//       return {
//         label: decorType.typeName,
//         key: decorType.documentId,
//         children: (
//           <div>
//             {selectedDecorType && selectedDecorType.documentId === decorType.documentId ? (
//               isPaintType(decorType.typeName) ? (
//                 // Для типов Paint, Paint glass, Paint veneer показываем ColorPicker
//                 // с увеличенным размером цветного квадрата
//                 <div style={{ padding: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
//                   <ColorPicker 
//                     value={colorCode} 
//                     onChange={onColorChange} 
//                   />
//                 </div>
//               ) : (
//                 // Для остальных типов показываем декоры с изображениями
//                 loadingDecors ? (
//                   <Spin />
//                 ) : errorDecors ? (
//                   <div>
//                     <div>Ошибка при загрузке декоров: {errorDecors.message}</div>
//                     <pre>{JSON.stringify(errorDecors, null, 2)}</pre>
//                   </div>
//                 ) : decors && decors.length > 0 ? (
//                   <Row gutter={[16, 16]}>
//                     {decors.map(decor => (
//                       <Col span={4} key={decor.documentId}>
//                         <Card
//                           hoverable
//                           cover={
//                             decor.image?.url ? 
//                             <img 
//                               alt={decor.title} 
//                               src={`https://dev.api.boki-groupe.com${decor.image.url}`} 
//                               style={{ height: 200, objectFit: 'cover' }}
//                             /> : 
//                             <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                               Нет изображения
//                             </div>
//                           }
//                           onClick={() => handleDecorSelect(decor)}
//                           style={{ 
//                             border: selectedDecor?.documentId === decor.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
//                           }}
//                         >
//                           <Card.Meta title={decor.title} />
//                         </Card>
//                       </Col>
//                     ))}
//                   </Row>
//                 ) : (
//                   <Empty description={
//                     <div>
//                       <p>Нет доступных декоров типа {decorType.typeName}</p>
//                       <p>ID типа декора: {decorType.documentId}</p>
//                     </div>
//                   } />
//                 )
//               )
//             ) : (
//               <Empty 
//                 description="Выберите этот тип декора для просмотра содержимого" 
//                 image={Empty.PRESENTED_IMAGE_SIMPLE}
//               />
//             )}
//           </div>
//         )
//       };
//     }
//   });
  
//   return (
//     <div>
//       {!isFrontSide && onClearSelection && (
//         <div style={{ marginBottom: 16, textAlign: 'right' }}>
//           <Button onClick={onClearSelection} type="primary" danger>
//             Убрать выбранное
//           </Button>
//         </div>
//       )}
//       <Tabs 
//         type="card" 
//         items={decorTabItems} 
//         onChange={(key) => {
//           const selected = decorTypes.find(dt => dt.documentId === key);
//           if (selected) onDecorTypeSelect(selected);
//         }}
//         activeKey={activeDecorTabKey || (selectedDecorType ? selectedDecorType.documentId : null)}
//       />
//     </div>
//   );
// };

// export default DecorSelection;

import React, { useState, useEffect } from "react";
import { Tabs, Card, Row, Col, Spin, Empty, Button, Radio } from "antd";
import { useQuery } from "@apollo/client";
import { GET_DECOR_TYPES, GET_DECORS } from '../api/queries';
import ColorPicker from '../components/ColorPicker';

const DecorSelection = ({ 
  doorId, // ID выбранной двери
  selectedDecorType, 
  selectedDecor, 
  colorCode,
  onDecorTypeSelect, 
  onDecorSelect, 
  onColorChange,
  isFrontSide = true, // Параметр для определения стороны
  onClearSelection = null // Функция для очистки выбора (для тыльной стороны)
}) => {
  // Состояние для хранения ориентации Veneer
  const [veneerOrientation, setVeneerOrientation] = useState("vertical");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [activeDecorTabKey, setActiveDecorTabKey] = useState(null);
  
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
  
  // Эффект для логирования
  useEffect(() => {
    if (selectedDecorType && !decorsLoading) {
      console.log(`Запрос декоров для типа ID (${isFrontSide ? 'лицевая' : 'тыльная'} сторона):`, selectedDecorType.documentId);
      console.log('Результат запроса декоров:', decorsData);
      if (decorsError) {
        console.error('Ошибка запроса декоров:', decorsError);
      }
    }
  }, [selectedDecorType, decorsData, decorsLoading, decorsError, isFrontSide]);
  
  // Эффект для установки категории по умолчанию для Veneer
  useEffect(() => {
    if (selectedDecorType?.typeName === "Veneer" && decors && decors.length > 0) {
      const categories = getVeneerCategories(decors);
      if (categories.length > 0 && !selectedCategory) {
        setSelectedCategory(categories[0]);
      }
    }
  }, [selectedDecorType, decors, selectedCategory]);
  
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
  
  if (decorTypesLoading) return <Spin />;
  
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
      {!isFrontSide && onClearSelection && (
        <div style={{ marginBottom: 16, textAlign: 'right' }}>
          <Button onClick={onClearSelection} type="primary" danger>
            Убрать выбранное
          </Button>
        </div>
      )}
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
