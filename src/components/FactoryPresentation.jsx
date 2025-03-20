import React from "react";
import { Button, Typography, Space, Divider, Card } from "antd";
import html2pdf from "html2pdf.js";

const { Title, Text } = Typography;

const FactoryPresentation = ({ orderData }) => {
  // Функция для сохранения в PDF
  const saveToPDF = () => {
    const element = document.getElementById('factory-presentation-content');
    const options = {
      margin: 10,
      filename: `Factory_${orderData.orderNumber}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    html2pdf().set(options).from(element).save();
  };

  // Фильтрация продуктов: исключаем knob, customOption и wallPanel с brand=CharmWood
  const filterProducts = (products) => {
    if (!products) return [];
    
    return products.filter(product => {
      // Исключаем knob и customOption
      if (product.type === 'knob' || product.type === 'customOption') {
        return false;
      }
      
      // Исключаем wallPanel с brand=CharmWood
      if (product.type === 'wallPanel' && product.product?.brand === 'CharmWood') {
        return false;
      }
      
      return true;
    });
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '16px' }}>
        <Button type="primary" onClick={saveToPDF}>
          Сохранить в PDF
        </Button>
      </div>
      
      <div id="factory-presentation-content" style={{ padding: '20px' }}>
        <Title level={2}>Техническая спецификация</Title>
        {orderData.orderNumber && <Title level={3}>Заказ №{orderData.orderNumber}</Title>}
        
        <Divider />
        
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <Card title="Информация о заказе">
            {orderData.orderNumber && <p><strong>Номер заказа:</strong> {orderData.orderNumber}</p>}
            {orderData.comment && <p><strong>Комментарий:</strong> {orderData.comment}</p>}
            {orderData.totalCostBasic && <p><strong>Общая стоимость:</strong> {orderData.totalCostBasic}</p>}
          </Card>
          
          {orderData.suborders && orderData.suborders.map((suborder, index) => {
            // Фильтруем продукты
            const filteredProducts = filterProducts(suborder.suborder_products);
            
            return (
              <Card 
                key={suborder.documentId} 
                title={`Подзаказ ${index + 1}${suborder.suborder_type?.typeName ? ': ' + suborder.suborder_type.typeName : ''}`}
              >
                {suborder.side && <p><strong>Сторона:</strong> {suborder.side}</p>}
                {suborder.opening && <p><strong>Открывание:</strong> {suborder.opening}</p>}
                {suborder.double_door !== undefined && <p><strong>Двойная дверь:</strong> {suborder.double_door ? 'Да' : 'Нет'}</p>}
                {suborder.hidden !== undefined && <p><strong>Скрытая дверь:</strong> {suborder.hidden ? 'Да' : 'Нет'}</p>}
                {suborder.suborderCost && <p><strong>Стоимость подзаказа:</strong> {suborder.suborderCost}</p>}
                {suborder.comment && <p><strong>Комментарий:</strong> {suborder.comment}</p>}
                
                <Divider orientation="left">Продукты</Divider>
                {filteredProducts.length > 0 ? (
                  filteredProducts.map((product, prodIndex) => (
                    <Card 
                      key={product.documentId} 
                      type="inner" 
                      title={`${product.type}${product.product?.title ? ': ' + product.product.title : ''}`}
                      style={{ marginBottom: '16px' }}
                    >
                      {product.type && <p><strong>Тип:</strong> {product.type}</p>}
                      {product.amount && <p><strong>Количество:</strong> {product.amount}</p>}
                      
                      {product.sizes && (
                        <div>
                          <p><strong>Размеры:</strong></p>
                          <ul>
                          {product.sizes.height && product.sizes.height !== 0 && <li>Высота: {product.sizes.height}</li>}
                          {product.sizes.width && product.sizes.width !== 0 && <li>Ширина: {product.sizes.width}</li>}
                          {product.sizes.thickness && product.sizes.thickness !== 0 && <li>Толщина: {product.sizes.thickness}</li>}
                          {product.sizes.length && product.sizes.length !== 0 && <li>Длина: {product.sizes.length}</li>}
                          {product.sizes.type && <li>Тип размера: {product.sizes.type}</li>}
                          </ul>
                        </div>
                      )}
                      
                      {product.decor && (
                        <div>
                          {product.decor.title && <p><strong>Декор:</strong> {product.decor.title}</p>}
                          {product.decor.category && <p><strong>Категория декора:</strong> {product.decor.category}</p>}
                          {product.decor_type?.typeName && <p><strong>Тип декора:</strong> {product.decor_type.typeName}</p>}
                          {product.colorCode && <p><strong>Код цвета:</strong> {product.colorCode}</p>}
                          {product.veneerDirection && <p><strong>Направление шпона:</strong> {product.veneerDirection}</p>}
                        </div>
                      )}
                      
                      {product.secondSideDecor && (
                        <div>
                          {product.secondSideDecor.title && <p><strong>Декор второй стороны:</strong> {product.secondSideDecor.title}</p>}
                          {product.secondSideDecor.category && <p><strong>Категория декора второй стороны:</strong> {product.secondSideDecor.category}</p>}
                          {product.secondSideDecorType?.typeName && <p><strong>Тип декора второй стороны:</strong> {product.secondSideDecorType.typeName}</p>}
                          {product.secondSideVeneerDirection && <p><strong>Направление шпона второй стороны:</strong> {product.secondSideVeneerDirection}</p>}
                        </div>
                      )}
                      
                      {product.productCostBasic && <p><strong>Базовая стоимость:</strong> {product.productCostBasic}</p>}
                      
                      {/* Отображаем эти параграфы только для door, hiddenDoor или slidingDoor */}
                      {(product.type === 'door' || product.type === 'hiddenDoor' || product.type === 'slidingDoor') && (
                        <>
                          {product.doorSeal !== undefined && <p><strong>Уплотнитель двери:</strong> {product.doorSeal ? 'Да' : 'Нет'}</p>}
                          {product.knobInsertion !== undefined && <p><strong>Установка ручки:</strong> {product.knobInsertion ? 'Да' : 'Нет'}</p>}
                          {product.lockInsertion !== undefined && <p><strong>Установка замка:</strong> {product.lockInsertion ? 'Да' : 'Нет'}</p>}
                          {product.spindleInsertion !== undefined && <p><strong>Установка шпинделя:</strong> {product.spindleInsertion ? 'Да' : 'Нет'}</p>}
                          {product.thresholdInsertion !== undefined && <p><strong>Установка порога:</strong> {product.thresholdInsertion ? 'Да' : 'Нет'}</p>}
                        </>
                      )}
                    </Card>
                  ))
                ) : (
                  <Text>Нет продуктов для отображения</Text>
                )}
              </Card>
            );
          })}
        </Space>
      </div>
    </div>
  );
};

export default FactoryPresentation;
