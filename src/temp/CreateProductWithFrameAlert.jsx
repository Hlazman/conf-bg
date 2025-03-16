import React, { useState, useEffect } from "react";
import { Typography, Spin, Empty, Collapse, Alert } from "antd";
import { useLocation } from "react-router-dom";
import DoorSelection from '../components/DoorSelection';
import DecorSelection from '../components/DecorSelection';
import DoorParameters from '../components/DoorParameters';
import FrameSelection from '../components/FrameSelection';
import StartData from '../components/StartData';
import SlidingSelection from '../components/SlidingSelection';
import ElementSelection from '../components/ElementSelection';
import HingeSelection from '../components/HingeSelection';
import LockSelection from "../components/LockSelection";
import KnobSelection from "../components/KnobSelection";
import OptionSelection from "../components/OptionSelection";
import CustomOptionSelection from "../components/CustomOptionSelection";

const { Title } = Typography;

const CreateProduct = () => {
  const location = useLocation();
  
  // Получаем данные из state или localStorage
  const locationState = location.state || {};
  const suborderId = locationState.suborderId || localStorage.getItem('currentSuborderId');
  const orderId = locationState.orderId;
  // const type = locationState.type;
  const type = locationState.type || localStorage.getItem('currentType');
  const doorType = localStorage.getItem('currentType');
  
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

  // ПЕТЛИ, ЗАМКИ, Ручки
  const [selectedHinge, setSelectedHinge] = useState(null);
  const handleHingeSelect = (hinge) => {
    setSelectedHinge(hinge);
  };

  const [selectedLock, setSelectedLock] = useState(null);
  const handleLockSelect = (lock) => {
    setSelectedLock(lock);
  };

  const [selectedKnob, setSelectedKnob] = useState(null);
  const handleKnobSelect = (knob) => {
  setSelectedKnob(knob);
  };
   
  
  // Состояние для аккордеона
  // const [activeKeys, setActiveKeys] = useState(['1', '2', '3', '4', '5', '6', '7']);
  const [activeKeys, setActiveKeys] = useState(['1', '2']);

  // Состояние для отслеживания изменения коллекции двери
  const [doorCollectionChanged, setDoorCollectionChanged] = useState(false);
  const [previousDoorCollection, setPreviousDoorCollection] = useState(null);
  
  // Проверяем localStorage при инициализации компонента
  useEffect(() => {
    if (suborderId) {
      const storedAlertState = localStorage.getItem(`doorCollectionChanged_${suborderId}`);
      if (storedAlertState === 'true') {
        setDoorCollectionChanged(true);
      }
      
      const storedPrevCollection = localStorage.getItem(`previousDoorCollection_${suborderId}`);
      if (storedPrevCollection) {
        setPreviousDoorCollection(storedPrevCollection);
      }
    }
  }, [suborderId]);
 
  // Обработчик выбора двери
  const handleDoorSelect = (door) => {
    // Проверяем, изменилась ли коллекция И была ли выбрана рама ранее
    if (selectedDoor && selectedFrame && door.collections && selectedDoor.collections) {
      const previousCollectionId = selectedDoor.collections[0]?.documentId;
      const newCollectionId = door.collections[0]?.documentId;
      
      if (previousCollectionId !== newCollectionId) {
        setDoorCollectionChanged(true);
        setPreviousDoorCollection(selectedDoor.collections[0]?.title || "предыдущей коллекции");
        
        // Сохраняем состояние в localStorage с привязкой к suborderId
        if (suborderId) {
          localStorage.setItem(`doorCollectionChanged_${suborderId}`, 'true');
          localStorage.setItem(`previousDoorCollection_${suborderId}`, selectedDoor.collections[0]?.title || "предыдущей коллекции");
        }
      }
    }
    
    setSelectedDoor(door);
    setSelectedFrame(null); // Сбрасываем выбор рамы
  };
    
  // Сбрасываем флаг изменения коллекции при выборе новой рамы
  const handleFrameSelect = (frame) => {
    setSelectedFrame(frame);
    setDoorCollectionChanged(false);

    // Сбрасываем флаг изменения двери при выборе нового расширителя
    // Очищаем состояние в localStorage с привязкой к suborderId
    if (suborderId) {
      localStorage.removeItem(`doorCollectionChanged_${suborderId}`);
      localStorage.removeItem(`previousDoorCollection_${suborderId}`);
    }
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
        suborderId={suborderId}
      />
    },
    {
      key: '2',
      label: (
        <Title level={5} style={{ margin: 0 }}>
          {/* Выбор полотна  {selectedDoor ? `- ${selectedDoor.title}` : ""} */}
          Выбор полотна <span style={{ color: '#00A651' }}> {selectedDoor ? `- ${selectedDoor.title}` : ""} </span> 
        </Title>
      ),
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
          suborderId={suborderId}
        />
      )
    },
    {
      key: '4',
      label: (
        <Title level={5} style={{ margin: 0 }}>
          Выбор декора (лицевая сторона)
          <span style={{ color: '#00A651' }}>
            {selectedFrontDecorType ? ` : ${selectedFrontDecorType.typeName}` : ""}
            {selectedFrontDecor ? ` : ${selectedFrontDecor.title}` : ""}
            {selectedFrontDecorType && isPaintType(selectedFrontDecorType.typeName) && frontColorCode ? ` - ${frontColorCode}` : ""}
          </span>
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
          productType={doorType} 
        />
      )
    },
    {
      key: '5',
      label: (
        <Title level={5} style={{ margin: 0 }}>
          Выбор декора (тыльная сторона) 
          <span style={{ color: '#00A651' }}>
            {selectedBackDecorType ? `: ${selectedBackDecorType.typeName}` : ""}
            {selectedBackDecor ? ` : ${selectedBackDecor.title}` : ""}
            {selectedBackDecorType && isPaintType(selectedBackDecorType.typeName) && backColorCode ? ` - ${backColorCode}` : ""}
          </span>
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
          productType={doorType}
        />
      )
    },
    {
      key: '6',
      label: 
        <Title level={5} style={{ margin: 0 }}>
          {type === 'slidingDoor' ? 'Раздвижная система' : 'Выбор рамы'}
        </Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: type === 'slidingDoor' ? (
        <SlidingSelection 
          suborderId={suborderId}
        />
      ) : (
        <FrameSelection
          doorId={selectedDoor?.documentId}
          collectionId={selectedDoor?.collections?.[0]?.documentId}
          selectedFrame={selectedFrame}
          onFrameSelect={handleFrameSelect}
          suborderId={suborderId}
        />
      )
    },
    {
      key: '7',
      label: <Title level={5} style={{ margin: 0 }}>Выбор расширителя</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="extender"
          availableSizes={{ width: true, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '8',
      label: <Title level={5} style={{ margin: 0 }}>Выбор наличника</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="platband"
          availableSizes={{ width: true, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '9',
      label: <Title level={5} style={{ margin: 0 }}>Выбор наличника с резбой</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="platbandThread"
          availableSizes={{ width: true, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '10',
      label: <Title level={5} style={{ margin: 0 }}>Выбор наличника лицевая сторона (Alum Line) </Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="platbandFront"
          availableSizes={{ width: true, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '11',
      label: <Title level={5} style={{ margin: 0 }}>Выбор наличника тыльная сторона (Alum Line)</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="platbandBack"
          availableSizes={{ width: true, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '12',
      label: <Title level={5} style={{ margin: 0 }}>Выбор капителя</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="kapitel"
          availableSizes={{ width: false, height: true, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '13',
      label: <Title level={5} style={{ margin: 0 }}>Выбор алюминиевого молдинга</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="aluminumMolding"
          availableSizes={{ width: false, height: false, length: true, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '14',
      label: <Title level={5} style={{ margin: 0 }}>Выбор алюминиевого обклада</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="aluminumFrame"
          availableSizes={{ width: false, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    {
      key: '15',
      label: <Title level={5} style={{ margin: 0 }}>Выбор алюминиевого каркаса</Title>,
      collapsible: !selectedDoor ? "disabled" : undefined,
      children: (
        <ElementSelection
          selectedDoor={selectedDoor}
          suborderId={suborderId}
          productType="aluminumCladding"
          availableSizes={{ width: false, height: false, length: false, thickness: false }}
          defaultSizes={{ width: 0, height: 0, length: 0, thickness: 0 }}
        />
      )
    },
    // {
    //   key: '16',
    //   label: <Title level={5} style={{ margin: 0 }}>Выбор петель</Title>,
    //   children: (
    //     <HingeSelection 
    //     suborderId={suborderId}
    //     collectionId={selectedDoor?.collections?.[0]?.documentId}
    //     selectedHinge={selectedHinge}
    //     onHingeSelect={handleHingeSelect}
    //     />
    //   )
    // },
    // {
    //   key: '17',
    //   label: <Title level={5} style={{ margin: 0 }}>Выбор замка </Title>,
    //   children: (
    //     <LockSelection 
    //       suborderId={suborderId}
    //       selectedLock={selectedLock}
    //       onLockSelect={handleLockSelect}
    //     />
    //   )
    // },
    
    // Добавляем условную логику для элементов выбора петель и замков
    ...(type !== 'slidingDoor' ? [
      {
        key: '16',
        label: <Title level={5} style={{ margin: 0 }}>Выбор петель</Title>,
        children: (
          <HingeSelection 
            suborderId={suborderId}
            collectionId={selectedDoor?.collections?.[0]?.documentId}
            selectedHinge={selectedHinge}
            onHingeSelect={handleHingeSelect}
          />
        )
      },
      {
        key: '17',
        label: <Title level={5} style={{ margin: 0 }}>Выбор замка </Title>,
        children: (
          <LockSelection 
            suborderId={suborderId}
            selectedLock={selectedLock}
            onLockSelect={handleLockSelect}
          />
        )
      }
    ] : []),
    {
      key: '18',
      label: <Title level={5} style={{ margin: 0 }}>Выбор ручки</Title>,
      children: (
        <KnobSelection 
          suborderId={suborderId}
          collectionId={selectedDoor?.collections?.[0]?.documentId}
          selectedKnob={selectedKnob}
          onKnobSelect={handleKnobSelect}
        />
      )
    },
    {
      key: '19',
      label: <Title level={5} style={{ margin: 0 }}>Выбор опций</Title>,
      children: (
        <OptionSelection 
          suborderId={suborderId}
          selectedDoor={selectedDoor}
        />
      )
    },
    {
      key: '20',
      label: <Title level={5} style={{ margin: 0 }}>Выбор кастомных опций</Title>,
      children: (
        <CustomOptionSelection 
          suborderId={suborderId}
        />
      )
    },
  ];
  
  return (
    <div style={{ padding: "20px" }}>
      <Title level={2}>
        {locationState.isEditing ? "Редактирование продукта" : "Создание продукта"}
      </Title>

    {/* Добавляем Alert с предупреждением */}
      {doorCollectionChanged && (
        <Alert
          message="Внимание! Требуется замена рамы"
          description={`Вы выбрали дверь из другой коллекции. Пожалуйста, выберите подходящую раму в разделе "Выбор рамы".`}
          type="error"
          showIcon
          style={{
            position: 'sticky',
            top: 10,
            zIndex: 1000,
            width: '100%',
            marginBottom: 16
          }}
        />
      )}
      
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