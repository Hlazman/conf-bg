import React, { useContext } from "react";
import { Descriptions, Row, Col, Divider, Card, Tooltip } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";

const DecorPresentation = ({ product, isFrontSide = true, customTitle = null, renderImage, getColorFromCode }) => {
  const { translations } = useContext(LanguageContext);

  if (!product) return null;
  
  const decorType = isFrontSide ? product.decor_type : product.secondSideDecorType;
  const decor = isFrontSide ? product.decor : product.secondSideDecor;
  const colorCode = isFrontSide ? product.colorCode : product.secondSideColorCode;
  const veneerDirection = isFrontSide ? product.veneerDirection : product.secondSideVeneerDirection;
  
  // Проверяем, есть ли decorType и (decor ИЛИ colorCode для типов Paint)
  if (!decorType || (!decor && !colorCode)) return null;
  
  const isPaintType = decorType && ['Paint', 'Paint glass', 'Paint veneer'].includes(decorType.typeName);
  const title = customTitle || (isFrontSide ? translations.decorFront : translations.decorBack);
  
  // Функция для открытия изображения в новой вкладке
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl) {
      const fullUrl = `https://dev.api.boki-groupe.com${imageUrl}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  return (
    <div className="decor-presentation" style={{ marginTop: '20px', marginBottom: '20px' }}>
      <Divider orientation="left">{translations[product.type]} ({translations.decor})</Divider>
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
              isPaintType && colorCode ? (
                <div 
                  style={{ 
                    width: '150px', 
                    height: '150px', 
                    backgroundColor: getColorFromCode(colorCode) || '#ccc',
                    margin: "15px 0 0 15px"
                  }} 
                />
              ) : (
                decor?.image?.url && (
                  <div style={{ position: 'relative', padding: "15px 0 0 15px" }}>
                    {renderImage(decor.image.url, decor?.title || '', 'decor')}
                    <Tooltip title={translations.openInNewTab}>
                      <a 
                        href={`https://dev.api.boki-groupe.com${decor.image.url}`}
                        target="_blank" 
                        rel="noopener noreferrer"
                        onClick={(e) => {
                          e.preventDefault();
                          openImageInNewTab(decor.image.url);
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
              )
            }
          >
            {/* <div style={{ textAlign: 'center' }}>
              {isFrontSide ? translations.decorImage : `${translations.decorImage} (${translations.side} 2)`}
            </div> */}
          </Card>
        </Col>
        <Col span={14}>
          <Descriptions 
            bordered 
            column={1} 
            size="small"
            title={title}
            styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
          >
            <Descriptions.Item label={translations.type}>
              {translations[decorType.typeName] || decorType.typeName}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.decor}>
              {decor?.title || ''}{isPaintType && colorCode ? ` (${colorCode})` : ''}
            </Descriptions.Item>
            
            {decorType.typeName === 'Veneer' && veneerDirection && (
              <Descriptions.Item label={translations.direction}>
                {translations[veneerDirection] || veneerDirection}
              </Descriptions.Item>
            )}
          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};

export default DecorPresentation;
