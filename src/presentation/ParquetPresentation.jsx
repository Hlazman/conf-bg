import React, { useContext } from "react";
import { Descriptions, Row, Col, Card, Tooltip } from "antd";
import { ExpandOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

const ParquetPresentation = ({ suborder, renderImage }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  const parquetProduct = suborder.suborder_products.find(product => 
    product.type === 'parquet'
  );
  
  if (!parquetProduct) return null;

  const productImage = parquetProduct.product?.image?.url || parquetProduct.customImage?.url;
  const sizes = parquetProduct.sizes || {};
  const area = parseFloat(((sizes.height * sizes.width) / 1000000).toFixed(2));

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;
  
  // Функция для открытия изображения в новой вкладке
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl) {
      // const fullUrl = `https://dev.api.boki-groupe.com${imageUrl}`;
      const fullUrl = `${baseUrl}${imageUrl}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  return (
    <div className="parquet-presentation">
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
                  {renderImage(productImage, parquetProduct.product?.title || parquetProduct.customTitle, 'parquet')}
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
            <Descriptions.Item label={translations.title}>
              {/* {parquetProduct.product?.title} */}
              {translations[parquetProduct.product?.title]}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.height}`}>
              {sizes.height ? `${sizes.height} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={`${translations.width}`}>
              {sizes.width ? `${sizes.width} mm` : '-'}
            </Descriptions.Item>
            
            <Descriptions.Item label={translations.area}>
              {`${area} m²`}
            </Descriptions.Item>

            <Descriptions.Item label={translations.parquet_grade}>
              {translations[parquetProduct?.parquet_grade?.title]}
            </Descriptions.Item>

            <Descriptions.Item label={translations.parquetColoringVariants}>
              {parquetProduct?.parquetColoringVariants === 'standard' 
                ? parquetProduct.parquetColorTitle
                : translations[parquetProduct?.parquetColoringVariants] 
              }
            </Descriptions.Item>

            <Descriptions.Item label={translations.parquetSize}>
              {parquetProduct?.parquetSize}
            </Descriptions.Item>

            {parquetProduct.parquetColorLink && (
                <Descriptions.Item label={translations.parquetColorLink}>
                  <a 
                    href={parquetProduct.parquetColorLink} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    >
                    {translations.goTo}
                  </a>
                </Descriptions.Item>
            )}

            <Descriptions.Item label={translations.AdditionalSurface}>
            {[
                parquetProduct.parquetLacquering && translations.parquetLacquering,
                parquetProduct.parquetBrushing && translations.parquetBrushing,
                parquetProduct.parquetSmoking && translations.parquetSmoking,
                parquetProduct.parquetFixedLength && translations.parquetFixedLength,
                parquetProduct.parquetOiling && translations.parquetOiling,
            ]
                .filter(Boolean)
                .join(', ') || '-'}
            </Descriptions.Item>

            <Descriptions.Item label={translations.priceNetto}>
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(parquetProduct.productCostNetto)} </div>
            </Descriptions.Item>

          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};

export default ParquetPresentation;
