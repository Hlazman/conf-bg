import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const SamplesFactory = ({ suborder }) => {
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
      <Divider style={{ borderColor: '#fdf5e6' }} orientation="center">{translations[suborder.suborder_type.typeName]}</Divider>
      <Descriptions 
        bordered 
        column={1} 
        size="small"
        styles={{ 
          label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
          content: { width: '50%' } 
        }}
      >
        {samplesProducts.map((product, index) => (
          <Descriptions.Item key={index} label={translations[product.product?.title]}>
          <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(product.productCostBasic)} </div>
        </Descriptions.Item>
        ))}

      </Descriptions>
    </div>
  );
};

export default SamplesFactory;
