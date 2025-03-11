// // import React, { useState } from "react";
// // import { Row, Col, Form, Radio } from "antd";
// // import { Typography } from "antd";

// // const { Title } = Typography;

// // const StartData = ({ selectedDoor }) => {
// //   // Стартовые данные
// //   const [isDoubleDoor, setIsDoubleDoor] = useState(false);
// //   const [doorSide, setDoorSide] = useState("right");
// //   const [doorOpening, setDoorOpening] = useState("universal");

// //   if (!selectedDoor) {
// //     return (
// //       <div style={{ textAlign: "center", padding: "20px" }}>
// //         <Title level={4}>Пожалуйста, выберите дверь</Title>
// //       </div>
// //     );
// //   }

// //   return (
// //     <div>
// //       <Title level={4}>Стартовые данные</Title>
// //       <Row gutter={[16, 16]}>
// //         <Col span={24}>
// //           <Form.Item label="Двойная дверь">
// //             <Radio.Group
// //               value={isDoubleDoor}
// //               onChange={(e) => setIsDoubleDoor(e.target.value)}
// //             >
// //               <Radio value={false}>Нет</Radio>
// //               <Radio value={true}>Да</Radio>
// //             </Radio.Group>
// //           </Form.Item>
// //         </Col>
// //         <Col span={12}>
// //           <Form.Item label="Сторона двери">
// //             <Radio.Group
// //               value={doorSide}
// //               onChange={(e) => setDoorSide(e.target.value)}
// //             >
// //               <Radio value="left">Левая</Radio>
// //               <Radio value="right">Правая</Radio>
// //             </Radio.Group>
// //           </Form.Item>
// //         </Col>
// //         <Col span={12}>
// //           <Form.Item label="Открывание">
// //             <Radio.Group
// //               value={doorOpening}
// //               onChange={(e) => setDoorOpening(e.target.value)}
// //             >
// //               <Radio value="in">Внутрь</Radio>
// //               <Radio value="out">Наружу</Radio>
// //               <Radio value="universal">Универсальное</Radio>
// //             </Radio.Group>
// //           </Form.Item>
// //         </Col>
// //       </Row>
// //     </div>
// //   );
// // };

// // export default StartData;


// import React, { useState } from "react";
// import { Row, Col, Form, Radio } from "antd";
// import { Typography } from "antd";

// const { Title } = Typography;

// const StartData = ({ selectedDoor }) => {
//   // Стартовые данные
//   const [isDoubleDoor, setIsDoubleDoor] = useState(false);
//   const [doorSide, setDoorSide] = useState("right");
//   const [doorOpening, setDoorOpening] = useState("universal");

//   return (
//     <div>
//       <Title level={4}>Стартовые данные</Title>
//       <Row gutter={[16, 16]}>
//         <Col span={24}>
//           <Form.Item label="Двойная дверь">
//             <Radio.Group
//               value={isDoubleDoor}
//               onChange={(e) => setIsDoubleDoor(e.target.value)}
//             >
//               <Radio value={false}>Нет</Radio>
//               <Radio value={true}>Да</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//         <Col span={12}>
//           <Form.Item label="Сторона двери">
//             <Radio.Group
//               value={doorSide}
//               onChange={(e) => setDoorSide(e.target.value)}
//             >
//               <Radio value="left">Левая</Radio>
//               <Radio value="right">Правая</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//         <Col span={12}>
//           <Form.Item label="Открывание">
//             <Radio.Group
//               value={doorOpening}
//               onChange={(e) => setDoorOpening(e.target.value)}
//             >
//               <Radio value="in">Внутрь</Radio>
//               <Radio value="out">Наружу</Radio>
//               <Radio value="universal">Универсальное</Radio>
//             </Radio.Group>
//           </Form.Item>
//         </Col>
//       </Row>
//     </div>
//   );
// };

// export default StartData;


import React, { useState, useEffect } from "react";
import { Row, Col, Form, Radio } from "antd";
import { Typography } from "antd";

const { Title } = Typography;

const StartData = ({ onDataChange }) => {
  // Стартовые данные
  const [isDoubleDoor, setIsDoubleDoor] = useState(false);
  const [doorSide, setDoorSide] = useState("right");
  const [doorOpening, setDoorOpening] = useState("universal");

  // Эффект для отправки изменений в родительский компонент
  useEffect(() => {
    if (onDataChange) {
      const startData = {
        isDoubleDoor,
        doorSide,
        doorOpening
      };
      
      onDataChange(startData);
    }
  }, [isDoubleDoor, doorSide, doorOpening, onDataChange]);

  // Обработчики изменений
  const handleDoubleDoorChange = (e) => {
    setIsDoubleDoor(e.target.value);
  };

  const handleDoorSideChange = (e) => {
    setDoorSide(e.target.value);
  };

  const handleDoorOpeningChange = (e) => {
    setDoorOpening(e.target.value);
  };

  return (
    <div>
      <Title level={4}>Стартовые данные</Title>
      <Row gutter={[16, 16]}>
        <Col span={24}>
          <Form.Item label="Двойная дверь">
            <Radio.Group
              value={isDoubleDoor}
              onChange={handleDoubleDoorChange}
            >
              <Radio value={false}>Нет</Radio>
              <Radio value={true}>Да</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Сторона двери">
            <Radio.Group
              value={doorSide}
              onChange={handleDoorSideChange}
            >
              <Radio value="left">Левая</Radio>
              <Radio value="right">Правая</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item label="Открывание">
            <Radio.Group
              value={doorOpening}
              onChange={handleDoorOpeningChange}
            >
              <Radio value="in">Внутрь</Radio>
              <Radio value="out">Наружу</Radio>
              <Radio value="universal">Универсальное</Radio>
            </Radio.Group>
          </Form.Item>
        </Col>
      </Row>
    </div>
  );
};

export default StartData;
