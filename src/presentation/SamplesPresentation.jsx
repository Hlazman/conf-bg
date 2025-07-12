import React, { useContext } from "react";
import { Descriptions } from "antd";
import { InfoCircleOutlined } from "@ant-design/icons";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const SamplesPresentation = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  const samplesProducts = suborder.suborder_products.filter(product => 
    product.type === 'sample'
  );
  
  if (!samplesProducts || samplesProducts.length === 0) return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;
  
  return (
    <div className="samples-presentation">

      {suborder?.amount > 1 && (
        <p> 
          <InfoCircleOutlined style={{ color: "#1890ff" }} /> 
          &nbsp; {translations.amountPrice} {suborder.amount}  
        </p>
      )}


      <Descriptions 
        bordered 
        column={1} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
      >
        {samplesProducts.map((product, index) => (
          // <Descriptions.Item key={index} label={translations.title}>
          //   {product.product?.title || product.customTitle || '-'}
          // </Descriptions.Item>

          <Descriptions.Item key={index} label={translations[product.product?.title]}>
            <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(product.productCostNetto)} </div>
          </Descriptions.Item>
        ))}
      </Descriptions>
    </div>
  );
};

export default SamplesPresentation;