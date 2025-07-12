import React, { useContext } from "react";
import { Descriptions } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const HardwareFactory = ({ suborder }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Функция для конвертации цены
  const formatPrice = (price) => `${convertFromEUR(price || 0).toFixed(2)} ${getCurrencySymbol()}`;

  // Фильтруем продукты с типами lock, knob, hinge
  const hardwareProducts = suborder.suborder_products.filter(product =>
    // ["lock", "knob", "hinge"].includes(product.type)
    ["lock", "hinge"].includes(product.type)
  );

  if (hardwareProducts.length === 0) return null;

  return (
    <div style={{marginTop: 20}} className="hardware-presentation">
      <Descriptions 
        bordered 
        column={1} 
        size="small"
        styles={{ 
            label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
            content: { width: '50%' } 
          }}
      >
        {hardwareProducts.map((product, index) => (
          <React.Fragment key={index}>
            <Descriptions.Item 
              label={
                `${translations[product.type]} : ${
                    product.type === "knob"
                        ? `${product.customTitle} (${product.amount} ${translations.pcs})`
                        : `${product.product?.title} (${product.amount || '1'} ${translations.pcs})`
                }`
                }>
                 <div style={{textAlign: 'right', fontWeight: 'bold'}}> {formatPrice(product.productCostBasic)}</div>
            </Descriptions.Item>
          </React.Fragment>
        ))}
      </Descriptions>
    </div>
  );
};

export default HardwareFactory;

