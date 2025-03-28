import React, { useContext } from "react";
import { Descriptions, Row, Col, Card, Tooltip } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";

const SkirtingPresentation = ({ suborder, renderImage }) => {
  const { translations } = useContext(LanguageContext);

  const skirtingProduct = suborder.suborder_products.find(product => 
    product.type === 'skirting'
  );
  
  if (!skirtingProduct) return null;
  
  const productImage = skirtingProduct.product?.image?.url || skirtingProduct.customImage?.url;
  const sizes = skirtingProduct.sizes || {};
  const hasSkirtingMilling = suborder.suborder_products.some(product => product.type === 'skirtingMilling');
  
  // Функция для открытия изображения в новой вкладке
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl) {
      const fullUrl = `https://dev.api.boki-groupe.com${imageUrl}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  return (
    <div className="skirting-presentation">
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
                  {renderImage(productImage, skirtingProduct.product?.title || skirtingProduct.customTitle, 'skirting')}
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
              {translations.skirtingImage || 'Skirting Image'}
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
              {skirtingProduct.product?.title || skirtingProduct.customTitle || '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.length}>
              {sizes.length ? `${sizes.length} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations["Milling insert"]}>
              {hasSkirtingMilling ? translations.yes : translations.no}
            </Descriptions.Item>
          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};

export default SkirtingPresentation;
