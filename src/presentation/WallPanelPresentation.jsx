import React, { useContext } from "react";
import { Descriptions, Row, Col, Card, Tooltip } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";

const WallPanelPresentation = ({ suborder, renderImage }) => {
  const { translations } = useContext(LanguageContext);

  const wallPanelProduct = suborder.suborder_products.find(product => 
    product.type === 'wallPanel'
  );
  
  if (!wallPanelProduct) return null;
  
  const productImage = wallPanelProduct.product?.image?.url || wallPanelProduct.customImage?.url;
  const sizes = wallPanelProduct.sizes || {};
  const area = sizes.height && sizes.width ? Math.round((sizes.height * sizes.width) / 1000000) : 0;
  
  // Функция для открытия изображения в новой вкладке
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl) {
      const fullUrl = `https://dev.api.boki-groupe.com${imageUrl}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  return (
    <div className="wall-panel-presentation">
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
                  {renderImage(productImage, wallPanelProduct.product?.title || wallPanelProduct.customTitle, 'wallPanel')}
                  <Tooltip title={translations.openInNewTab}>
                    <a 
                      href={`https://dev.api.boki-groupe.com${productImage}`}
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
            {/* <div style={{ textAlign: 'center' }}>
              {translations.wallPanelImage || 'Wall Panel Image'}
            </div> */}
          </Card>
        </Col>
        <Col span={14}>
          <Descriptions 
            bordered 
            column={1} 
            size="small"
            styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
          >
            <Descriptions.Item label={translations.title}>
              {wallPanelProduct.product?.title || wallPanelProduct.customTitle || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.height} (${translations[sizes.type]})`}>
              {sizes.height ? `${sizes.height} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.width} (${translations[sizes.type]})`}>
              {sizes.width ? `${sizes.width} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.area}>
              {area > 0 ? `${area} m²` : '-'}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};

export default WallPanelPresentation;
