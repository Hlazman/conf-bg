import React from "react";
import { Button, Typography, Space, Divider, Card } from "antd";
// import html2pdf from "html2pdf.js";
import html2pdf from 'html2pdf.js/dist/html2pdf.min.js';

const { Title, Text } = Typography;

const ClientPresentation = ({ orderData }) => {
  // Функция для сохранения в PDF
  const saveToPDF = () => {
    const element = document.getElementById('client-presentation-content');
    const options = {
      margin: 10,
      filename: `Order_Presentation_${orderData.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(options).from(element).save();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
        <Button type="primary" onClick={saveToPDF}>
          Сохранить в PDF
        </Button>
      </div>
      
      <div id="client-presentation-content" style={{ padding: '20px' }}>
        <Title level={2}>Презентация для клиента</Title>
        <Title level={3}>Заказ №{orderData.orderNumber}</Title>
        
        <Divider />
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Информация о заказе">
            <p><strong>Номер заказа:</strong> {orderData.orderNumber}</p>
            <p><strong>Клиент:</strong> {orderData.client?.name}</p>
            <p><strong>Менеджер:</strong> {orderData.agent?.name}</p>
            <p><strong>Комментарий:</strong> {orderData.comment || 'Нет комментария'}</p>
          </Card>
          
          <Card title="Финансовая информация">
            <p><strong>Общая стоимость (брутто):</strong> {orderData.totalCostBrutto}</p>
            <p><strong>Скидка клиента:</strong> {orderData.clientDiscount}%</p>
            <p><strong>Стоимость доставки:</strong> {orderData.deliveryCost}</p>
            <p><strong>Дополнительная оплата:</strong> {orderData.clientExtraPay}</p>
          </Card>
          
          <Card title="Подзаказы">
            {orderData.suborders && orderData.suborders.length > 0 ? (
              orderData.suborders.map((suborder, index) => (
                <Card 
                  key={suborder.documentId} 
                  type="inner" 
                  title={`Подзаказ ${index + 1}: ${suborder.suborder_type?.typeName || 'Без типа'}`}
                  style={{ marginBottom: '16px' }}
                >
                  <p><strong>Комментарий:</strong> {suborder.comment || 'Нет комментария'}</p>
                  <p><strong>Сторона:</strong> {suborder.side || 'Не указано'}</p>
                  <p><strong>Открывание:</strong> {suborder.opening || 'Не указано'}</p>
                  
                  <Divider orientation="left">Продукты</Divider>
                  {suborder.suborder_products && suborder.suborder_products.length > 0 ? (
                    suborder.suborder_products.map((product, prodIndex) => (
                      <div key={product.documentId} style={{ marginBottom: '10px' }}>
                        <p><strong>Продукт {prodIndex + 1}:</strong> {product.product?.title || product.customTitle || 'Без названия'}</p>
                        <p><strong>Тип:</strong> {product.type}</p>
                        {product.sizes && (
                          <p><strong>Размеры:</strong> {
                            Object.entries(product.sizes)
                              .filter(([key, value]) => value && ['height', 'width', 'thickness', 'length'].includes(key))
                              .map(([key, value]) => `${key}: ${value}`)
                              .join(', ')
                          }</p>
                        )}
                        {product.decor && (
                          <p><strong>Декор:</strong> {product.decor.title}</p>
                        )}
                      </div>
                    ))
                  ) : (
                    <Text>Нет продуктов</Text>
                  )}
                </Card>
              ))
            ) : (
              <Text>Нет подзаказов</Text>
            )}
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default ClientPresentation;
