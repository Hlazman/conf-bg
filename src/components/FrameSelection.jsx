// import React from "react";
// import { Card, Row, Col, Typography, Spin, Empty } from "antd";

// const { Title } = Typography;

// const FrameSelection = ({
//   frames,
//   selectedFrame,
//   onFrameSelect,
//   loading,
//   error
// }) => {
//   if (loading) return <Spin size="large" />;
  
//   if (error) return <Empty description="Ошибка при загрузке рам" />;
  
//   if (!frames || frames.length === 0) {
//     return <Empty description="Нет доступных рам" />;
//   }

//   return (
//     <div>
//       <Row gutter={[16, 16]}>
//         {frames.map(frame => (
//           <Col key={frame.documentId} xs={24} sm={12} md={8} lg={6}>
//             <Card
//               hoverable
//               onClick={() => onFrameSelect(frame)}
//               style={{
//                 border: selectedFrame?.documentId === frame.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0',
//                 textAlign: 'center',
//                 padding: '10px'
//               }}
//             >
//               {frame.title}
//             </Card>
//           </Col>
//         ))}
//       </Row>
//     </div>
//   );
// };

// export default FrameSelection;


import React from "react";
import { Card, Row, Col, Typography, Spin, Empty } from "antd";
import { useQuery } from "@apollo/client";
import { GET_FRAMES } from '../api/queries';

const { Title } = Typography;

const FrameSelection = ({
  doorId,
  collectionId,
  selectedFrame,
  onFrameSelect
}) => {
  // Запрос для получения рам
  const { loading, error, data } = useQuery(GET_FRAMES, {
    variables: {
      filters: {
        type: {
          eqi: "frame"
        },
        collections: collectionId ? {
          documentId: {
            eq: collectionId
          }
        } : undefined
      }
    },
    skip: !collectionId
  });

  const frames = data?.products || [];
  
  if (loading) return <Spin size="large" />;
  
  if (error) return <Empty description={`Ошибка при загрузке рам: ${error.message}`} />;
  
  if (!frames || frames.length === 0) {
    return <Empty description="Нет доступных рам для выбранной двери" />;
  }

  return (
    <div>
      <Row gutter={[16, 16]}>
        {frames.map(frame => (
          <Col key={frame.documentId} xs={24} sm={12} md={8} lg={6}>
            <Card
              hoverable
              onClick={() => onFrameSelect(frame)}
              style={{
                border: selectedFrame?.documentId === frame.documentId ? '2px solid #1890ff' : '1px solid #f0f0f0',
                textAlign: 'center',
                padding: '10px'
              }}
            >
              {frame.title}
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default FrameSelection;
