import React, { useContext } from "react";
import { Descriptions, Row, Col, Card, Tooltip } from "antd";
import { ExpandOutlined, InfoCircleOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

const SkirtingPresentation = ({ suborder, renderImage }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  const skirtingProduct = suborder.suborder_products.find(product => 
    product.type === 'skirting'
  );
  
  if (!skirtingProduct) return null;
  
  const productImage = skirtingProduct.product?.image?.url || skirtingProduct.customImage?.url;
  const sizes = skirtingProduct.sizes || {};
  const hasSkirtingMilling = suborder.suborder_products.some(product => product.type === 'skirtingMilling');

  // Считаем общую стоимость продуктов в субордере
  const calculateTotalNettoPrice = () => {
    const productTypes = [
      "skirting",
      "skirtingInsert",
      "skirtingMilling"
    ];
    const totalNetto = suborder.suborder_products
      .filter(product => productTypes.includes(product.type))
      .reduce((sum, product) => sum + (product.productCostNetto || 0), 0);

    return convertFromEUR(totalNetto).toFixed(2);
  };
  
  // Функция для открытия изображения в новой вкладке
  const openImageInNewTab = (imageUrl) => {
    if (imageUrl) {
      // const fullUrl = `https://dev.api.boki-groupe.com${imageUrl}`;
      const fullUrl = `${baseUrl}${imageUrl}`;
      window.open(fullUrl, '_blank');
    }
  };
  
  return (
    <div className="skirting-presentation">

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
                  {renderImage(productImage, skirtingProduct.product?.title || skirtingProduct.customTitle, 'skirting')}
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

            <Descriptions.Item label={translations.priceNetto}>
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> {calculateTotalNettoPrice()} {getCurrencySymbol()} </div>
            </Descriptions.Item>

          </Descriptions>
        </Col>
      </Row>
    </div>
  );
};

export default SkirtingPresentation;
