// OptionsPresentation.jsx
import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const OptionsPresentation = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Фильтруем продукты с типом option
  const options = suborder.suborder_products.filter(product => product.type === "option");
  
  if (options.length === 0) return null;

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  return (
    <div className="options-presentation">
      <Divider orientation="left"> {translations.options} </Divider>
      <Descriptions 
        bordered 
        column={2} 
        size="small"
        styles={{ label: { backgroundColor: '#fdf5e6', fontWeight: 'bold' } }}
      >
        {options.map((product, index) => (
          <React.Fragment key={index}>
            <Descriptions.Item label={translations.title}>
              {translations[product.product?.title] || product.product?.title || '-'}
              {product.amount !== null ? ` (${product.amount} ${translations.pcs})` : ''}
            </Descriptions.Item>
            <Descriptions.Item label={translations.priceNetto}>
              <div style={{textAlign: 'right', fontWeight: 'bold'}}> 
                {/* {formatPrice(product.productCostNetto * product?.amount || 1)}  */}
              {formatPrice(product.productCostNetto)}
              </div>
            </Descriptions.Item>
          </React.Fragment>
        ))}
      </Descriptions>
    </div>
  );
};

export default OptionsPresentation;
