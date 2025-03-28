// CustomOptionsPresentation.jsx
import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const CustomOptionsPresentation = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Фильтруем продукты с типом customOption
  const customOptions = suborder.suborder_products.filter(product => product.type === "customOption");

  if (customOptions.length === 0) return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div className="custom-options-presentation">
      <Divider orientation="left"> {translations.customOptions} </Divider>
      <Descriptions 
        bordered 
        column={2} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
      >
        {customOptions.map((product, index) => (
          <React.Fragment key={index}>
            <Descriptions.Item label={translations.title}>
              {product?.customTitle || '-'}
              {product.amount > 1 ? ` (${product.amount} ${translations.pcs})` : ''}
            </Descriptions.Item>
            <Descriptions.Item label={translations.priceNetto}>
            <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(product.productCostNetto)} </div>
              {/* {formatPrice(product.productCostNetto)} */}
            </Descriptions.Item>
          </React.Fragment>
        ))}
      </Descriptions>
    </div>
  );
};

export default CustomOptionsPresentation;
