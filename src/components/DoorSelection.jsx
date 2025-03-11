// import React from "react";
// import { Tabs, Card, Row, Col, Typography, Spin, Empty } from "antd";

// const { Title } = Typography;

// const DoorSelection = ({ 
//   collections, 
//   doorsByCollection, 
//   selectedDoor, 
//   onDoorSelect, 
//   loading 
// }) => {
//   if (loading) return <Spin size="large" />;
  
//   if (collections.length === 0) {
//     return <Empty description="Нет доступных коллекций" />;
//   }
  
//   const doorTabItems = collections.map(collection => ({
//     label: collection.title,
//     key: collection.documentId,
//     children: (
//       <Row gutter={[16, 16]}>
//         {doorsByCollection[collection.documentId].map(door => (
//           <Col span={4} key={door.documentId}>
//             <Card
//               hoverable
//               cover={
//                 door.image?.url ? 
//                 <img 
//                   alt={door.title} 
//                   src={`https://dev.api.boki-groupe.com${door.image.url}`} 
//                   style={{ height: 200, objectFit: 'cover' }}
//                 /> : 
//                 <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
//                   Нет изображения
//                 </div>
//               }
//               onClick={() => onDoorSelect(door)}
//               style={{ 
//                 border: selectedDoor?.documentId === door.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
//               }}
//             >
//               <Card.Meta title={door.title} />
//             </Card>
//           </Col>
//         ))}
//       </Row>
//     )
//   }));
  
//   return <Tabs type="card" items={doorTabItems} />;
// };

// export default DoorSelection;


import React, { useState, useEffect } from "react";
import { Tabs, Card, Row, Col, Typography, Spin, Empty } from "antd";
import { useQuery } from "@apollo/client";
import { GET_PRODUCTS } from '../api/queries';

const { Title } = Typography;

const DoorSelection = ({ selectedDoor, onDoorSelect }) => {
  const { loading, error, data } = useQuery(GET_PRODUCTS, {
    variables: {
      pagination: {
        limit: 100
      },
      filters: {
        type: {
          eqi: "door"
        }
      }
    }
  });
  
  // Обработка данных после загрузки
  const doors = data?.products?.filter(product => 
    product.type === "door" && 
    product.collections && 
    product.collections.length > 0
  ) || [];
  
  // Получаем уникальные коллекции из дверей
  const collections = doors.reduce((acc, door) => {
    door.collections.forEach(collection => {
      if (!acc.some(c => c.documentId === collection.documentId)) {
        acc.push(collection);
      }
    });
    return acc;
  }, []);
  
  // Сортируем коллекции по алфавиту
  collections.sort((a, b) => a.title.localeCompare(b.title));
  
  // Группируем двери по коллекциям и сортируем внутри каждой коллекции по title
  const doorsByCollection = collections.reduce((acc, collection) => {
    acc[collection.documentId] = doors
      .filter(door => door.collections.some(c => c.documentId === collection.documentId))
      .sort((a, b) => a.title.localeCompare(b.title));
    return acc;
  }, {});
  
  if (loading) return <Spin size="large" />;
  
  if (error) return <Empty description={`Ошибка загрузки: ${error.message}`} />;
  
  if (collections.length === 0) {
    return <Empty description="Нет доступных коллекций" />;
  }
  
  const doorTabItems = collections.map(collection => ({
    label: collection.title,
    key: collection.documentId,
    children: (
      <Row gutter={[16, 16]}>
        {doorsByCollection[collection.documentId].map(door => (
          <Col span={4} key={door.documentId}>
            <Card
              hoverable
              cover={
                door.image?.url ? 
                <img 
                  alt={door.title} 
                  src={`https://dev.api.boki-groupe.com${door.image.url}`} 
                  style={{ height: 200, objectFit: 'cover' }}
                /> : 
                <div style={{ height: 200, background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  Нет изображения
                </div>
              }
              onClick={() => onDoorSelect(door)}
              style={{ 
                border: selectedDoor?.documentId === door.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0'
              }}
            >
              <Card.Meta title={door.title} />
            </Card>
          </Col>
        ))}
      </Row>
    )
  }));
  
  return <Tabs type="card" items={doorTabItems} />;
};

export default DoorSelection;
