import React, { useContext } from "react";
import { Descriptions, Row, Col, Card, Tooltip } from "antd";
import { ExpandOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

const DoorPresentation = ({ suborder, renderImage }) => {
  const { translations } = useContext(LanguageContext);

  // Находим продукт с типом door, hiddenDoor или slidingDoor
  const doorProduct = suborder.suborder_products.find(product => 
    ['door', 'hiddenDoor', 'slidingDoor'].includes(product.type)
  );
  
  if (!doorProduct) return null;

  const productImage = doorProduct.product?.image?.url || doorProduct.customImage?.url;
  const sizes = doorProduct.sizes || {};
  
  // Функция для открытия изображения в новой вкладке
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl) {
      // const fullUrl = `https://dev.api.boki-groupe.com${imageUrl}`;
      const fullUrl = `${baseUrl}${imageUrl}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  return (
    <div className="door-presentation">
      {suborder?.amount > 1 && (
        <p> 
          <InfoCircleOutlined style={{ color: "#1890ff" }} /> 
          &nbsp; {translations.amountPrice} {suborder.amount}  
          </p>
      )}

      <Row gutter={16}>
        <Col span={10}>
          <Card
            hoverable
            styles={{ 
              body: { 
                padding: '10px', 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center', 
                position: 'relative' 
              } 
            }}
            cover={
              productImage && (
                <div style={{ position: 'relative', padding: "15px 0 0 15px" }}>
                  {renderImage(productImage, doorProduct.product?.title || doorProduct.customTitle, 'door')}
                  <Tooltip title={translations.openInNewTab}>
                    <a 
                      // href={`https://dev.api.boki-groupe.com${productImage}`}
                      href={`${baseUrl}${productImage}`}
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => {
                        e.preventDefault();
                        openImageInNewTab(productImage);
                      }}
                      style={{
                        position: 'absolute',
                        top: '10px',
                        right: '10px',
                        background: 'rgba(255, 255, 255, 0.7)',
                        borderRadius: '50%',
                        padding: '5px',
                        cursor: 'pointer',
                        zIndex: 5
                      }}
                    >
                      <ExpandOutlined style={{ fontSize: '16px', color: '#1890ff' }} />
                    </a>
                  </Tooltip>
                </div>
              )
            }
          >
          </Card>
        </Col>
        <Col span={14}>
          <Descriptions 
            bordered 
            column={1} 
            size="small"
            styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
          >
            <Descriptions.Item label={translations.collection}>
              {doorProduct.product?.collections?.[0]?.title || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.title}>
              {doorProduct.product?.title || doorProduct.customTitle || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.type}>
              {doorProduct.type === 'door' ? translations.inDoor : 
               doorProduct.type === 'hiddenDoor' ? translations.hiDoor : 
               doorProduct.type === 'slidingDoor' ? translations.sliDoor : '-'}
            </Descriptions.Item>

            {/* <Descriptions.Item label={translations.amount}>
              {doorProduct?.amount}
              
            </Descriptions.Item> */}

            <Descriptions.Item label={translations.doubleDoor}>
              {suborder.double_door ? translations.yes : translations.no}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.doorOpening}>
              {translations[suborder.opening] || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.doorSide}>
              {translations[suborder.side] || '-'}
            </Descriptions.Item>
            
            {/* <Descriptions.Item label={`${translations.height} (${translations[sizes.type]})`}> */}
            <Descriptions.Item label={`${translations.height} (${translations.doorCanvas} / ${translations.block} / ${translations.holeWall})`}>
              {sizes.height ? `${sizes.height} mm` : '-'} {"/ "}
              {sizes.blockHeight ? `${sizes.blockHeight} mm` : '-'} {"/ "}
              {sizes.holeHeight ? `${sizes.holeHeight} mm` : '-'}
            </Descriptions.Item>
            
            {/* <Descriptions.Item label={`${translations.width} (${translations[sizes.type]})`}> */}
            <Descriptions.Item label={`${translations.width} (${translations.doorCanvas} / ${translations.block} / ${translations.holeWall})` }>
              {sizes.width ? `${sizes.width} mm` : '-'} {"/ "}
              {sizes.blockWidth ? `${sizes.blockWidth} mm` : '-'} {"/ "}
              {sizes.holeWidth ? `${sizes.holeWidth} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.thickness}>
              {sizes.thickness ? `${sizes.thickness} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.guarantee}>
              {doorProduct.product?.guarantee ? `${doorProduct.product.guarantee} ${translations.years}` : `2 ${translations.years}`}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.doorFilling}>
              {translations.doorFilling || '-'}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};

export default DoorPresentation;
