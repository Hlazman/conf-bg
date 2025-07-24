import React, { useContext } from "react";
import { Descriptions, Card, Tooltip, Divider } from "antd";
import { ExpandOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const baseUrl = process.env.REACT_APP_BASE_URL;

const HardwarePresentation = ({ suborder, renderImage, isPdf }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

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

  // Фильтруем продукты с типами lock, knob, hinge
  const hardwareProducts = suborder.suborder_products.filter(product =>
    ["lock", "knob", "hinge"].includes(product.type)
  );

  if (hardwareProducts.length === 0) return null;

  return (
    <div className="hardware-presentation">
      <style>
        {`
          .hardware-presentation .ant-descriptions-item-label {
            background-color: #fdf5e6 !important;
            font-weight: bold;
          }
        `}
      </style>
      <Divider orientation="left"> {translations.fittings} </Divider>
      <Descriptions 
        layout="vertical"
        bordered 
        column={!isPdf ? 3 : 1} 
        size="small"
      >
        {hardwareProducts.map((product, index) => (
          <React.Fragment key={index}>
            <Descriptions.Item label={translations[product.type]}>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                <div style={{ marginRight: '10px', position: 'relative' }}>
                  {(product.product?.image?.url || product.customImage?.url) ? (
                    <Card
                      hoverable
                      size="small"
                      styles={{ 
                        body: { padding: 0 }
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        {renderImage(product.product?.image?.url || product.customImage?.url, product.product?.title || product.customTitle, 'hardware')}
                        <Tooltip title={translations.openInNewTab}>
                          <a 
                            // href={`https://dev.api.boki-groupe.com${product.product?.image?.url || product.customImage?.url}`}
                            href={`${baseUrl}${product.product?.image?.url || product.customImage?.url}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              openImageInNewTab(product.product?.image?.url || product.customImage?.url);
                            }}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(255, 255, 255, 0.7)',
                              borderRadius: '50%',
                              padding: '3px',
                              cursor: 'pointer',
                              zIndex: 5
                            }}
                          >
                            <ExpandOutlined style={{ fontSize: '14px', color: '#1890ff' }} />
                          </a>
                        </Tooltip>
                      </div>
                    </Card>
                  ) : (
                    renderImage(null, product.product?.title || product.customTitle, 'hardware')
                  )}

                {/* вторая картинка для ручки */}
                {/* {product.customImage?.url && (
                  <div style={{ marginRight: '10px', position: 'relative' }}>
                    <Card
                      hoverable
                      size="small"
                      styles={{ 
                        body: { padding: 0 }
                      }}
                    >
                      <div style={{ position: 'relative' }}>
                        {renderImage(product.product?.image?.url || product.customImage?.url, product.product?.title || product.customTitle, 'hardware')}
                        <Tooltip title={translations.openInNewTab}>
                          <a 
                            href={`${baseUrl}${product.product?.image?.url || product.customImage?.url}`}
                            target="_blank" 
                            rel="noopener noreferrer"
                            onClick={(e) => {
                              e.preventDefault();
                              openImageInNewTab(product.product?.image?.url || product.customImage?.url);
                            }}
                            style={{
                              position: 'absolute',
                              top: '5px',
                              right: '5px',
                              background: 'rgba(255, 255, 255, 0.7)',
                              borderRadius: '50%',
                              padding: '3px',
                              cursor: 'pointer',
                              zIndex: 5
                            }}
                          >
                            <ExpandOutlined style={{ fontSize: '14px', color: '#1890ff' }} />
                          </a>
                        </Tooltip>
                      </div>
                    </Card>
                  </div>
                )} */}

                  
                </div>
                <div>
                  <strong>{translations.title}:</strong> {product.type === "knob" ? product.customTitle || '-' : product.product?.title || '-'}
                  <br />
                  {product.type !== "lock" && (
                    <>
                      <strong>{translations.amount}:</strong> {product.amount || '-'}
                      <br />
                    </>
                  )}
                  <strong>{`${translations.priceNetto} ${translations[product.type]}`}: </strong> 
                  {/* {product.type === 'knob' 
                    ? formatPrice(product.productCostNetto * product.amount || 1) 
                    : formatPrice(product.productCostNetto)
                  }  */}
                  {formatPrice(product.productCostNetto)}
                </div>
              </div>
            </Descriptions.Item>
          </React.Fragment>
        ))}
      </Descriptions>
    </div>
  );
};

export default HardwarePresentation;

