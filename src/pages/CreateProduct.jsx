import React, { useState, useEffect } from "react";
import { Typography, Spin, Empty, Collapse } from "antd";
import { useLocation } from "react-router-dom";
import DoorSelection from '../components/DoorSelection';
import DecorSelection from '../components/DecorSelection';
import DoorParameters from '../components/DoorParameters';
import FrameSelection from '../components/FrameSelection';
import StartData from '../components/StartData';

const { Title } = Typography;

const CreateProduct = () => {
  const location = useLocation();
  
  // Получаем данные из state или localStorage
  const locationState = location.state || {};
  const suborderId = locationState.suborderId || localStorage.getItem('currentSuborderId');
  const orderId = locationState.orderId;
  const type = locationState.type;
  
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
      // label: "Стартовые данные",
      label: <Title level={5} style={{ margin: 0 }}>Стартовые данные</Title>,
      children: <StartData 
        // onDataChange={(data) => console.log("Стартовые данные:", data)} 
        suborderId={suborderId}
      />
    },
    {
      key: '2',
      label: (
        <Title level={5} style={{ margin: 0 }}>
          Выбор полотна {selectedDoor ? `- ${selectedDoor.title}` : ""}
        </Title>
      ),
      // children: <DoorSelection selectedDoor={selectedDoor} onDoorSelect={handleDoorSelect} />
      children: 
        <DoorSelection 
          selectedDoor={selectedDoor} 
          onDoorSelect={handleDoorSelect} 
          suborderId={suborderId}
      />
    },
    {
      key: '3',
      label: <Title level={5} style={{ margin: 0 }}>Дверные параметры</Title>,
      children: (
        <DoorParameters 
          selectedDoor={selectedDoor} 
          // onParametersChange={(params) => console.log("Параметры двери:", params)}
          suborderId={suborderId}
        />
      )
    },
    {
      key: '4',
      label: (
        <Title level={5} style={{ margin: 0 }}>
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
          suborderId={suborderId}
          productType = "door"
        />
      )
    },
    {
      key: '5',
      label: (
        <Title level={5} style={{ margin: 0 }}>
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
          suborderId={suborderId}
          productType = "door"
        />
      )
    },
    {
      key: '6',
      // label: "Выбор рамы",
      label: <Title level={5} style={{ margin: 0 }}>Выбор рамы</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <FrameSelection
          doorId={selectedDoor?.documentId}
          collectionId={selectedDoor?.collections?.[0]?.documentId}
          selectedFrame={selectedFrame}
          onFrameSelect={setSelectedFrame}
          suborderId={suborderId}  // Добавляем передачу suborderId
        />
      )
    }
  ];
  
  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>
        {locationState.isEditing ? "Редактирование продукта" : "Создание продукта"}
      </Title>
      
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

