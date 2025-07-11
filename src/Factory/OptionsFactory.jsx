import React, { useContext } from "react";
import { Descriptions } from "antd";
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
    <div style={{marginTop: 20}} className="options-presentation">
      <Descriptions 
        bordered 
        column={1} 
        size="small"
        styles={{ 
          label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
          content: { width: '50%' } 
        }}
      >
        {options.map((product, index) => (
          <React.Fragment key={index}>
            <Descriptions.Item 
              label={`${translations[product.product?.title]}${product.amount !== null ? ` (${product.amount} ${translations.pcs})` : ''}`}>
                <div style={{textAlign: 'right', fontWeight: 'bold'}}> 
                  {formatPrice(product.productCostBasic)} 
                </div>
            </Descriptions.Item>
          </React.Fragment>
        ))}
      </Descriptions>
    </div>
  );
};

export default OptionsPresentation;
