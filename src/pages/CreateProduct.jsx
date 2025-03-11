// import React, { useState, useEffect } from "react";
// import { Typography, Spin, Empty, Collapse } from "antd";
// import { useQuery } from "@apollo/client";
// import { GET_PRODUCTS, GET_DECOR_TYPES, GET_DECORS, GET_FRAMES } from '../api/queries';
// import ColorPicker from '../components/ColorPicker';
// import DoorSelection from '../components/DoorSelection';
// import DecorSelection from '../components/DecorSelection';
// import DoorParameters from '../components/DoorParameters';
// import FrameSelection from '../components/FrameSelection';
// import StartData from '../components/StartData';

// const { Title } = Typography;
// const { Panel } = Collapse;

// const useProducts = () => {
//   const { loading, error, data } = useQuery(GET_PRODUCTS, {
//     variables: {
//       pagination: {
//         limit: 100
//       },
//       filters: {
//         type: {
//           eqi: "door"
//         }
//       }
//     }
//   });

//   return {
//     products: data?.products || [],
//     loading,
//     error
//   };
// };

// const useDecorTypes = (doorId) => {
//   const { loading, error, data } = useQuery(GET_DECOR_TYPES, {
//     variables: {
//       filters: {
//         products: {
//           documentId: {
//             eq: doorId
//           }
//         }
//       },
//       pagination: {
//         limit: 300
//       }
//     },
//     skip: !doorId
//   });

//   return {
//     decorTypes: data?.decorTypes || [],
//     loading,
//     error
//   };
// };

// const useDecors = (decorTypeId) => {
//   const { loading, error, data } = useQuery(GET_DECORS, {
//     variables: {
//       pagination: {
//         limit: 300
//       },
//       filters: {
//         decor_type: {
//           documentId: {
//             eq: decorTypeId
//           }
//         }
//       }
//     },
//     skip: !decorTypeId
//   });

//   useEffect(() => {
//     if (decorTypeId && !loading) {
//       console.log('Запрос декоров для типа ID:', decorTypeId);
//       console.log('Результат запроса декоров:', data);
//       if (error) {
//         console.error('Ошибка запроса декоров:', error);
//       }
//     }
//   }, [decorTypeId, data, loading, error]);

//   return {
//     decors: data?.decors || [],
//     loading,
//     error
//   };
// };

// const CreateProduct = () => {
//   const { products, loading, error } = useProducts();
//   const [selectedDoor, setSelectedDoor] = useState(null);
  
//   // Состояние для лицевой стороны
//   const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
//   const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
//   const [frontColorCode, setFrontColorCode] = useState("");
//   const [selectedFrontCategory, setSelectedFrontCategory] = useState(null);
//   const [activeFrontDecorTabKey, setActiveFrontDecorTabKey] = useState(null);
  
//   // Состояние для тыльной стороны
//   const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
//   const [selectedBackDecor, setSelectedBackDecor] = useState(null);
//   const [backColorCode, setBackColorCode] = useState("");
//   const [selectedBackCategory, setSelectedBackCategory] = useState(null);
//   const [activeBackDecorTabKey, setActiveBackDecorTabKey] = useState(null);
  
//   const [activeKeys, setActiveKeys] = useState(['1', '2', '3', '4', '5', '6']);
  
//   // Запросы для лицевой стороны
//   const { 
//     decorTypes: frontDecorTypes, 
//     loading: frontDecorTypesLoading, 
//     error: frontDecorTypesError 
//   } = useDecorTypes(selectedDoor?.documentId);
  
//   const { 
//     decors: frontDecors, 
//     loading: frontDecorsLoading, 
//     error: frontDecorsError 
//   } = useDecors(selectedFrontDecorType?.documentId);
  
//   // Запросы для тыльной стороны (используем те же типы декоров, что и для лицевой)
//   const { 
//     decors: backDecors, 
//     loading: backDecorsLoading, 
//     error: backDecorsError 
//   } = useDecors(selectedBackDecorType?.documentId);
  
//   useEffect(() => {
//     // Логируем для отладки
//     if (selectedDoor) {
//       console.log('Выбранная дверь:', selectedDoor);
//     }
    
//     if (frontDecorTypes.length > 0) {
//       console.log('Доступные типы декоров:', frontDecorTypes);
//     } else if (!frontDecorTypesLoading && selectedDoor) {
//       console.log('Типы декоров не найдены для двери:', selectedDoor.title);
//     }
    
//     if (frontDecorTypesError) {
//       console.error('Ошибка при загрузке типов декоров:', frontDecorTypesError);
//     }
//   }, [selectedDoor, frontDecorTypes, frontDecorTypesLoading, frontDecorTypesError]);
  
//   // Фильтруем только двери с коллекциями
//   const doors = products.filter(product => 
//     product.type === "door" && 
//     product.collections && 
//     product.collections.length > 0
//   );
  
//   // Получаем уникальные коллекции из дверей
//   const collections = doors.reduce((acc, door) => {
//     door.collections.forEach(collection => {
//       if (!acc.some(c => c.documentId === collection.documentId)) {
//         acc.push(collection);
//       }
//     });
//     return acc;
//   }, []);
  
//   // Сортируем коллекции по алфавиту
//   collections.sort((a, b) => a.title.localeCompare(b.title));
  
//   // Группируем двери по коллекциям и сортируем внутри каждой коллекции по title
//   const doorsByCollection = collections.reduce((acc, collection) => {
//     acc[collection.documentId] = doors
//       .filter(door => door.collections.some(c => c.documentId === collection.documentId))
//       .sort((a, b) => a.title.localeCompare(b.title));
//     return acc;
//   }, {});
  
//   const handleDoorSelect = (door) => {
//     setSelectedDoor(door);
//     setSelectedFrame(null);
    
//     // Проверяем, доступен ли текущий тип декора для новой двери
//     if (selectedFrontDecorType) {
//       // Получаем типы декора для выбранной двери
//       const doorDecorTypes = door.decor_types || [];
      
//       // Проверяем, есть ли текущий тип декора среди доступных для новой двери
//       const isDecorTypeAvailable = doorDecorTypes.some(
//         dt => dt.documentId === selectedFrontDecorType.documentId
//       );
      
//       if (!isDecorTypeAvailable) {
//         // Если тип декора недоступен, сбрасываем выбор
//         setSelectedFrontDecorType(null);
//         setSelectedFrontDecor(null);
//         setFrontColorCode("");
//         setSelectedFrontCategory(null);
//         setActiveFrontDecorTabKey(null);
//       }
//     }
    
//     // То же самое для тыльной стороны
//     if (selectedBackDecorType) {
//       const doorDecorTypes = door.decor_types || [];
//       const isDecorTypeAvailable = doorDecorTypes.some(
//         dt => dt.documentId === selectedBackDecorType.documentId
//       );
      
//       if (!isDecorTypeAvailable) {
//         setSelectedBackDecorType(null);
//         setSelectedBackDecor(null);
//         setBackColorCode("");
//         setSelectedBackCategory(null);
//         setActiveBackDecorTabKey(null);
//       }
//     }
//   };
  
//   // Обработчики для лицевой стороны
//   const handleFrontDecorTypeSelect = (decorType) => {
//     setSelectedFrontDecorType(decorType);
//     setSelectedFrontDecor(null);
//     setFrontColorCode("");
//     setSelectedFrontCategory(null);
//     setActiveFrontDecorTabKey(decorType.documentId);
    
//     // Если выбран тип Veneer, установим первую категорию по умолчанию
//     if (decorType.typeName === "Veneer" && frontDecors && frontDecors.length > 0) {
//       const categories = getVeneerCategories(frontDecors);
//       if (categories.length > 0) {
//         setSelectedFrontCategory(categories[0]);
//       }
//     }
//   };
  
//   const handleFrontDecorSelect = (decor) => {
//     console.log('Выбран декор для лицевой стороны:', decor);
//     setSelectedFrontDecor(decor);
//   };
  
//   const handleFrontCategorySelect = (category) => {
//     setSelectedFrontCategory(category);
//     setSelectedFrontDecor(null);
//   };
  
//   // Обработчики для тыльной стороны
//   const handleBackDecorTypeSelect = (decorType) => {
//     setSelectedBackDecorType(decorType);
//     setSelectedBackDecor(null);
//     setBackColorCode("");
//     setSelectedBackCategory(null);
//     setActiveBackDecorTabKey(decorType.documentId);
    
//     // Если выбран тип Veneer, установим первую категорию по умолчанию
//     if (decorType.typeName === "Veneer" && backDecors && backDecors.length > 0) {
//       const categories = getVeneerCategories(backDecors);
//       if (categories.length > 0) {
//         setSelectedBackCategory(categories[0]);
//       }
//     }
//   };
  
//   const handleBackDecorSelect = (decor) => {
//     console.log('Выбран декор для тыльной стороны:', decor);
//     setSelectedBackDecor(decor);
//   };
  
//   const handleBackCategorySelect = (category) => {
//     setSelectedBackCategory(category);
//     setSelectedBackDecor(null);
//   };
  
//   const clearBackSelection = () => {
//     setSelectedBackDecorType(null);
//     setSelectedBackDecor(null);
//     setBackColorCode("");
//     setSelectedBackCategory(null);
//     setActiveBackDecorTabKey(null);
//   };
  
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
  
//   const onCollapseChange = (keys) => {
//     setActiveKeys(keys);
//   };

//   const [selectedFrame, setSelectedFrame] = useState(null);

//   const useFrames = (collectionId) => {
//     const { loading, error, data } = useQuery(GET_FRAMES, {
//       variables: {
//         filters: {
//           type: {
//             eqi: "frame"
//           },
//           collections: collectionId ? {
//             documentId: {
//               eq: collectionId
//             }
//           } : undefined
//         }
//       },
//       skip: !collectionId
//     });
  
//     return {
//       frames: data?.products || [],
//       loading,
//       error
//     };
//   };
  
//   const {
//     frames,
//     loading: framesLoading,
//     error: framesError
//   } = useFrames(selectedDoor?.collections?.[0]?.documentId);

//   const handleFrameSelect = (frame) => {
//     setSelectedFrame(frame);
//     console.log('Выбрана рама:', frame);
//   };
  
//   useEffect(() => {
//     // Проверяем, доступен ли текущий декор после загрузки декоров
//     if (selectedFrontDecor && frontDecors && !frontDecorsLoading) {
//       const isDecorAvailable = frontDecors.some(
//         d => d.documentId === selectedFrontDecor.documentId
//       );
      
//       if (!isDecorAvailable) {
//         setSelectedFrontDecor(null);
//       }
//     }
    
//     if (selectedBackDecor && backDecors && !backDecorsLoading) {
//       const isDecorAvailable = backDecors.some(
//         d => d.documentId === selectedBackDecor.documentId
//       );
      
//       if (!isDecorAvailable) {
//         setSelectedBackDecor(null);
//       }
//     }
//   }, [frontDecors, frontDecorsLoading, selectedFrontDecor, backDecors, backDecorsLoading, selectedBackDecor]);
  
//   if (loading) return <Spin size="large" />;
  
//   if (error) return <div>Error loading products: {error.message}</div>;
  
//   if (doors.length === 0) {
//     return (
//       <div style={{ padding: "20px" }}>
//         <Title level={2}>Создание продукта</Title>
//         <Empty description="Не найдены двери с коллекциями" />
//       </div>
//     );
//   }
  
//   // Создаем массив items для компонента Collapse
//   const items = [
//     {
//       key: '1',
//       label: "Стартовые данные",
//       children: <StartData selectedDoor={selectedDoor} />
//     },
//     {
//       key: '2',
//       label: (
//         <Title level={3} style={{ margin: 0 }}>
//           Выбор полотна {selectedDoor ? `- ${selectedDoor.title}` : ""}
//         </Title>
//       ),
//       children: (
//         <DoorSelection 
//           collections={collections}
//           doorsByCollection={doorsByCollection}
//           selectedDoor={selectedDoor}
//           onDoorSelect={handleDoorSelect}
//           loading={false}
//         />
//       )
//     },
//     {
//       key: '3',
//       label: (
//         <Title level={3} style={{ margin: 0 }}>
//           Дверные параметры
//         </Title>
//       ),
//       children: <DoorParameters selectedDoor={selectedDoor} />
//     },
//     {
//       key: '4',
//       label: (
//         <Title level={3} style={{ margin: 0 }}>
//           Выбор декора (лицевая сторона) {selectedFrontDecorType ? `- ${selectedFrontDecorType.typeName}` : ""}
//           {selectedFrontDecor ? ` - ${selectedFrontDecor.title}` : ""}
//           {selectedFrontDecorType && isPaintType(selectedFrontDecorType.typeName) && frontColorCode ? ` - ${frontColorCode}` : ""}
//         </Title>
//       ),
//       children: selectedDoor ? (
//         <DecorSelection 
//           decorTypes={frontDecorTypes}
//           decors={frontDecors}
//           selectedDecorType={selectedFrontDecorType}
//           selectedDecor={selectedFrontDecor}
//           colorCode={frontColorCode}
//           selectedCategory={selectedFrontCategory}
//           onDecorTypeSelect={handleFrontDecorTypeSelect}
//           onDecorSelect={handleFrontDecorSelect}
//           onColorChange={setFrontColorCode}
//           onCategorySelect={handleFrontCategorySelect}
//           loading={frontDecorTypesLoading}
//           loadingDecors={frontDecorsLoading}
//           error={frontDecorTypesError}
//           errorDecors={frontDecorsError}
//           isFrontSide={true}
//           activeDecorTabKey={activeFrontDecorTabKey}
//         />
//       ) : (
//         <Empty 
//           description="Сначала выберите полотно" 
//           image={Empty.PRESENTED_IMAGE_SIMPLE}
//         />
//       )
//     },
//     {
//       key: '5',
//       label: (
//         <Title level={3} style={{ margin: 0 }}>
//           Выбор декора (тыльная сторона) {selectedBackDecorType ? `- ${selectedBackDecorType.typeName}` : ""}
//           {selectedBackDecor ? ` - ${selectedBackDecor.title}` : ""}
//           {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
//         </Title>
//       ),
//       children: selectedDoor ? (
//         <DecorSelection 
//           decorTypes={frontDecorTypes}
//           decors={backDecors}
//           selectedDecorType={selectedBackDecorType}
//           selectedDecor={selectedBackDecor}
//           colorCode={backColorCode}
//           selectedCategory={selectedBackCategory}
//           onDecorTypeSelect={handleBackDecorTypeSelect}
//           onDecorSelect={handleBackDecorSelect}
//           onColorChange={setBackColorCode}
//           onCategorySelect={handleBackCategorySelect}
//           loading={frontDecorTypesLoading}
//           loadingDecors={backDecorsLoading}
//           error={frontDecorTypesError}
//           errorDecors={backDecorsError}
//           isFrontSide={false}
//           onClearSelection={clearBackSelection}
//           activeDecorTabKey={activeBackDecorTabKey}
//         />
//       ) : (
//         <Empty 
//           description="Сначала выберите полотно" 
//           image={Empty.PRESENTED_IMAGE_SIMPLE}
//         />
//       )
//     },
//     {
//       key: '6',
//       label: "Выбор рамы",
//       collapsible: !selectedDoor ? "disabled" : undefined,
//       children: selectedDoor ? (
//         <FrameSelection
//           frames={frames}
//           selectedFrame={selectedFrame}
//           onFrameSelect={handleFrameSelect}
//           loading={framesLoading}
//           error={framesError}
//         />
//       ) : (
//         <Empty description="Сначала выберите дверь" />
//       )
//     }
//   ];
  
//   return (
//     <div style={{ padding: "20px" }}>
//       <Title level={2}>Создание продукта</Title>
      
//       <Collapse 
//         items={items}
//         defaultActiveKey={activeKeys} 
//         onChange={onCollapseChange}
//         style={{ marginTop: 20 }}
//       />
//     </div>
//   );
// };

// export default CreateProduct;


import React, { useState, useEffect } from "react";
import { Typography, Spin, Empty, Collapse } from "antd";
import DoorSelection from '../components/DoorSelection';
import DecorSelection from '../components/DecorSelection';
import DoorParameters from '../components/DoorParameters';
import FrameSelection from '../components/FrameSelection';
import StartData from '../components/StartData';

const { Title } = Typography;

const CreateProduct = () => {
  // Состояние для выбранной двери
  const [selectedDoor, setSelectedDoor] = useState(null);
  
  // Состояние для лицевой стороны
  const [selectedFrontDecorType, setSelectedFrontDecorType] = useState(null);
  const [selectedFrontDecor, setSelectedFrontDecor] = useState(null);
  const [frontColorCode, setFrontColorCode] = useState("");
  
  // Состояние для тыльной стороны
  const [selectedBackDecorType, setSelectedBackDecorType] = useState(null);
  const [selectedBackDecor, setSelectedBackDecor] = useState(null);
  const [backColorCode, setBackColorCode] = useState("");
  
  // Состояние для рамы
  const [selectedFrame, setSelectedFrame] = useState(null);
  
  // Состояние для аккордеона
  const [activeKeys, setActiveKeys] = useState(['1', '2', '3', '4', '5', '6']);
  
  // Обработчик выбора двери
  const handleDoorSelect = (door) => {
    setSelectedDoor(door);
    setSelectedFrame(null);
    
    // Сбрасываем выбор декоров, если они недоступны для новой двери
    // Логика сброса перенесена в компонент DecorSelection
  };
  
  // Обработчик изменения состояния аккордеона
  const onCollapseChange = (keys) => {
    setActiveKeys(keys);
  };
  
  // Функция для определения типов декора, для которых нужно показывать ColorPicker
  const isPaintType = (typeName) => {
    return typeName && (
      typeName === "Paint" || 
      typeName === "Paint glass" || 
      typeName === "Paint veneer"
    );
  };
  
  // Обработчик для очистки выбора тыльной стороны
  const clearBackSelection = () => {
    setSelectedBackDecorType(null);
    setSelectedBackDecor(null);
    setBackColorCode("");
  };
  
  // Создаем массив items для компонента Collapse
  const items = [
    {
      key: '1',
      label: "Стартовые данные",
      children: <StartData onDataChange={(data) => console.log("Стартовые данные:", data)} />
    },
    {
      key: '2',
      label: (
        <Title level={3} style={{ margin: 0 }}>
          Выбор полотна {selectedDoor ? `- ${selectedDoor.title}` : ""}
        </Title>
      ),
      children: <DoorSelection selectedDoor={selectedDoor} onDoorSelect={handleDoorSelect} />
    },
    {
      key: '3',
      label: <Title level={3} style={{ margin: 0 }}>Дверные параметры</Title>,
      children: (
        <DoorParameters 
          selectedDoor={selectedDoor} 
          onParametersChange={(params) => console.log("Параметры двери:", params)} 
        />
      )
    },
    {
      key: '4',
      label: (
        <Title level={3} style={{ margin: 0 }}>
          Выбор декора (лицевая сторона) {selectedFrontDecorType ? `- ${selectedFrontDecorType.typeName}` : ""}
          {selectedFrontDecor ? ` - ${selectedFrontDecor.title}` : ""}
          {selectedFrontDecorType && isPaintType(selectedFrontDecorType.typeName) && frontColorCode ? ` - ${frontColorCode}` : ""}
        </Title>
      ),
      children: (
        <DecorSelection 
          doorId={selectedDoor?.documentId}
          selectedDecorType={selectedFrontDecorType}
          selectedDecor={selectedFrontDecor}
          colorCode={frontColorCode}
          onDecorTypeSelect={setSelectedFrontDecorType}
          onDecorSelect={setSelectedFrontDecor}
          onColorChange={setFrontColorCode}
          isFrontSide={true}
        />
      )
    },
    {
      key: '5',
      label: (
        <Title level={3} style={{ margin: 0 }}>
          Выбор декора (тыльная сторона) {selectedBackDecorType ? `- ${selectedBackDecorType.typeName}` : ""}
          {selectedBackDecor ? ` - ${selectedBackDecor.title}` : ""}
          {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
        </Title>
      ),
      children: (
        <DecorSelection 
          doorId={selectedDoor?.documentId}
          selectedDecorType={selectedBackDecorType}
          selectedDecor={selectedBackDecor}
          colorCode={backColorCode}
          onDecorTypeSelect={setSelectedBackDecorType}
          onDecorSelect={setSelectedBackDecor}
          onColorChange={setBackColorCode}
          isFrontSide={false}
          onClearSelection={clearBackSelection}
        />
      )
    },
    {
      key: '6',
      label: "Выбор рамы",
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <FrameSelection
          doorId={selectedDoor?.documentId}
          collectionId={selectedDoor?.collections?.[0]?.documentId}
          selectedFrame={selectedFrame}
          onFrameSelect={setSelectedFrame}
        />
      )
    }
  ];
  
  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>Создание продукта</Title>
      
      <Collapse 
        items={items}
        defaultActiveKey={activeKeys} 
        onChange={onCollapseChange}
        style={{ marginTop: 20 }}
      />
    </div>
  );
};

export default CreateProduct;
