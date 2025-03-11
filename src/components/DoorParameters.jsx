// import React, { useState } from "react";
// import { Row, Col, Form, Radio, InputNumber, Select, Divider } from "antd";
// import { Typography } from "antd";

// const { Title } = Typography;
// const { Option } = Select;

// const DoorParameters = ({ selectedDoor }) => {
//   // Размеры
//   const [dimensionType, setDimensionType] = useState("door");
//   const [doorHeight, setDoorHeight] = useState(2000);
//   const [doorWidth, setDoorWidth] = useState(800);
//   const [wallThickness, setWallThickness] = useState(100);
//   const [doorQuantity, setDoorQuantity] = useState(1); // Перенесено из стартовых данных

//   // Врезка и уплотнение
//   const [handleCutout, setHandleCutout] = useState(false);
//   const [boltCutout, setBoltCutout] = useState(false);
//   const [thresholdCutout, setThresholdCutout] = useState(false);
//   const [doorSeal, setDoorSeal] = useState("none");
//   const [lockCutout, setLockCutout] = useState("none");

//   if (!selectedDoor) {
//     return (
//       <div style={{ textAlign: "center", padding: "20px" }}>
//         <Title level={4}>Пожалуйста, выберите дверь</Title>
//       </div>
//     );
//   }

//   return (
//     <div>
//       <Title level={4}>Параметры двери</Title>
      
//       {/* Размеры */}
//       <Divider orientation="left">Размеры</Divider>
//       <Row gutter={[16, 16]}>
//         <Col span={24}>
//           <Form.Item label="Тип размеров">
//             <Radio.Group
//               value={dimensionType}
//               onChange={(e) => setDimensionType(e.target.value)}
//             >
//               <Radio value="door">Размер двери</Radio>
//               <Radio value="opening">Размер проема</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Высота (мм)">
//             <InputNumber
//               min={1000}
//               max={3000}
//               value={doorHeight}
//               onChange={setDoorHeight}
//               style={{ width: "100%" }}
//             />
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Ширина (мм)">
//             <InputNumber
//               min={500}
//               max={1500}
//               value={doorWidth}
//               onChange={setDoorWidth}
//               style={{ width: "100%" }}
//             />
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Толщина стены (мм)">
//             <InputNumber
//               min={50}
//               max={500}
//               value={wallThickness}
//               onChange={setWallThickness}
//               style={{ width: "100%" }}
//             />
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Количество">
//             <InputNumber
//               min={1}
//               max={100}
//               value={doorQuantity}
//               onChange={setDoorQuantity}
//               style={{ width: "100%" }}
//             />
//           </Form.Item>
//         </Col>
//       </Row>

//       {/* Врезка и уплотнение */}
//       <Divider orientation="left">Врезка и уплотнение</Divider>
//       <Row gutter={[16, 16]}>
//         <Col span={12}>
//           <Form.Item label="Врезка ручки">
//             <Radio.Group
//               value={handleCutout}
//               onChange={(e) => setHandleCutout(e.target.value)}
//             >
//               <Radio value={false}>Нет</Radio>
//               <Radio value={true}>Да</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//         <Col span={12}>
//           <Form.Item label="Врезка замка">
//             <Select
//               value={lockCutout}
//               onChange={setLockCutout}
//               style={{ width: "100%" }}
//             >
//               <Option value="none">Нет</Option>
//               <Option value="standard">Стандартный</Option>
//               <Option value="magnetic">Магнитный</Option>
//             </Select>
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Врезка шпингалета">
//             <Radio.Group
//               value={boltCutout}
//               onChange={(e) => setBoltCutout(e.target.value)}
//             >
//               <Radio value={false}>Нет</Radio>
//               <Radio value={true}>Да</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Врезка порога">
//             <Radio.Group
//               value={thresholdCutout}
//               onChange={(e) => setThresholdCutout(e.target.value)}
//             >
//               <Radio value={false}>Нет</Radio>
//               <Radio value={true}>Да</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//         <Col span={8}>
//           <Form.Item label="Уплотнение">
//             <Select
//               value={doorSeal}
//               onChange={setDoorSeal}
//               style={{ width: "100%" }}
//             >
//               <Option value="none">Нет</Option>
//               <Option value="standard">Стандартное</Option>
//               <Option value="premium">Премиум</Option>
//             </Select>
//           </Form.Item>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default DoorParameters;


import React, { useState, useEffect } from "react";
import { Row, Col, Form, Radio, InputNumber, Select, Divider, Spin, Empty } from "antd";
import { Typography } from "antd";

const { Title } = Typography;
const { Option } = Select;

const DoorParameters = ({ selectedDoor, onParametersChange }) => {
  // Размеры
  const [dimensionType, setDimensionType] = useState("door");
  const [doorHeight, setDoorHeight] = useState(2000);
  const [doorWidth, setDoorWidth] = useState(800);
  const [wallThickness, setWallThickness] = useState(100);
  const [doorQuantity, setDoorQuantity] = useState(1); // Перенесено из стартовых данных

  // Врезка и уплотнение
  const [handleCutout, setHandleCutout] = useState(false);
  const [boltCutout, setBoltCutout] = useState(false);
  const [thresholdCutout, setThresholdCutout] = useState(false);
  const [doorSeal, setDoorSeal] = useState("none");
  const [lockCutout, setLockCutout] = useState("none");

  // Эффект для обновления параметров при выборе новой двери
  useEffect(() => {
    if (selectedDoor) {
      // Можно установить значения по умолчанию на основе выбранной двери
      // Например, если у двери есть свойства с размерами по умолчанию
      if (selectedDoor.defaultHeight) {
        setDoorHeight(selectedDoor.defaultHeight);
      }
      if (selectedDoor.defaultWidth) {
        setDoorWidth(selectedDoor.defaultWidth);
      }
    }
  }, [selectedDoor]);

  // Эффект для отправки изменений параметров в родительский компонент
  useEffect(() => {
    if (onParametersChange) {
      const parameters = {
        dimensionType,
        doorHeight,
        doorWidth,
        wallThickness,
        doorQuantity,
        handleCutout,
        boltCutout,
        thresholdCutout,
        doorSeal,
        lockCutout
      };
      
      onParametersChange(parameters);
    }
  }, [
    dimensionType, 
    doorHeight, 
    doorWidth, 
    wallThickness, 
    doorQuantity, 
    handleCutout, 
    boltCutout, 
    thresholdCutout, 
    doorSeal, 
    lockCutout,
    onParametersChange
  ]);

  // Обработчики изменения параметров
  const handleDimensionTypeChange = (e) => {
    setDimensionType(e.target.value);
  };

  const handleDoorHeightChange = (value) => {
    setDoorHeight(value);
  };

  const handleDoorWidthChange = (value) => {
    setDoorWidth(value);
  };

  const handleWallThicknessChange = (value) => {
    setWallThickness(value);
  };

  const handleDoorQuantityChange = (value) => {
    setDoorQuantity(value);
  };

  const handleHandleCutoutChange = (e) => {
    setHandleCutout(e.target.value);
  };

  const handleBoltCutoutChange = (e) => {
    setBoltCutout(e.target.value);
  };

  const handleThresholdCutoutChange = (e) => {
    setThresholdCutout(e.target.value);
  };

  const handleDoorSealChange = (value) => {
    setDoorSeal(value);
  };

  const handleLockCutoutChange = (value) => {
    setLockCutout(value);
  };

  if (!selectedDoor) {
    return (
      <div style={{ textAlign: "center", padding: "20px" }}>
        <Title level={4}>Пожалуйста, выберите дверь</Title>
      </div>
    );
  }

  return (
    <div>
      <Title level={4}>Параметры двери</Title>
      
      {/* Размеры */}
      <Divider orientation="left">Размеры</Divider>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item label="Тип размеров">
            <Radio.Group
              value={dimensionType}
              onChange={(e) => setDimensionType(e.target.value)}
            >
              <Radio value="door">Размер двери</Radio>
              <Radio value="opening">Размер проема</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={dimensionType === "door" ? 12 : 8}>
          <Form.Item label="Высота (мм)">
            <InputNumber
              min={1000}
              max={3000}
              value={doorHeight}
              onChange={setDoorHeight}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        <Col span={dimensionType === "door" ? 12 : 8}>
          <Form.Item label="Ширина (мм)">
            <InputNumber
              min={500}
              max={1500}
              value={doorWidth}
              onChange={setDoorWidth}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
        {dimensionType === "opening" && (
          <Col span={8}>
            <Form.Item label="Толщина стены (мм)">
              <InputNumber
                min={50}
                max={500}
                value={wallThickness}
                onChange={setWallThickness}
                style={{ width: "100%" }}
              />
            </Form.Item>
          </Col>
        )}
        <Col span={8}>
          <Form.Item label="Количество">
            <InputNumber
              min={1}
              max={100}
              value={doorQuantity}
              onChange={setDoorQuantity}
              style={{ width: "100%" }}
            />
          </Form.Item>
        </Col>
      </Row>

      {/* Врезка и уплотнение */}
      <Divider orientation="left">Врезка и уплотнение</Divider>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <Form.Item label="Врезка ручки">
            <Radio.Group
              value={handleCutout}
              onChange={handleHandleCutoutChange}
            >
              <Radio value={false}>Нет</Radio>
              <Radio value={true}>Да</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Врезка замка">
            <Select
              value={lockCutout}
              onChange={handleLockCutoutChange}
              style={{ width: "100%" }}
            >
              <Option value="none">Нет</Option>
              <Option value="standard">Стандартный</Option>
              <Option value="magnetic">Магнитный</Option>
            </Select>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Врезка шпингалета">
            <Radio.Group
              value={boltCutout}
              onChange={handleBoltCutoutChange}
            >
              <Radio value={false}>Нет</Radio>
              <Radio value={true}>Да</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Врезка порога">
            <Radio.Group
              value={thresholdCutout}
              onChange={handleThresholdCutoutChange}
            >
              <Radio value={false}>Нет</Radio>
              <Radio value={true}>Да</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={8}>
          <Form.Item label="Уплотнение">
            <Select
              value={doorSeal}
              onChange={handleDoorSealChange}
              style={{ width: "100%" }}
            >
              <Option value="none">Нет</Option>
              <Option value="standard">Стандартное</Option>
              <Option value="premium">Премиум</Option>
            </Select>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default DoorParameters;
