import React, { useContext } from "react";
import { Descriptions, Divider } from "antd";
import { LanguageContext } from "../context/LanguageContext";
import { CurrencyContext } from "../context/CurrencyContext";

const TotalPriceFactory = ({ suborders }) => {
  const { translations } = useContext(LanguageContext);
  const { convertFromEUR, getCurrencySymbol } = useContext(CurrencyContext);

  // Считаем сумму без CharmWood, customOption, knob
  const totalBasicCostEUR = suborders.reduce((sum, suborder) => {
    const suborderSum = suborder.suborder_products.reduce((subSum, product) => {
      // const type = product.product?.type;
      const type = product?.type;
      const brand = product.product?.brand;

      // Условия для пропуска
      const skip =
      // type === undefined ||
        type === "customOption" ||
        type === "knob" ||
        (type === "wallPanel" && brand === "CharmWood");

      if (skip) return subSum;

      return subSum + (product.productCostBasic || 0);
    }, 0);
    return sum + suborderSum;
  }, 0);


  // Конвертируем в нужную валюту
  const converted = convertFromEUR(totalBasicCostEUR).toFixed(2);
  const symbol = getCurrencySymbol();
  
  return (
    <div>
      <Divider style={{ borderColor: '#fdf5e6' }} orientation="center"> {translations.totalPrice} </Divider>   
        <Descriptions 
        bordered 
        column={1} 
        size="small"
        styles={{ 
            label: { backgroundColor: '#fdf5e6', fontWeight: '600', width: '50%' },
            content: { width: '50%' } 
        }}
        >
        <Descriptions.Item style={{fontWeight: '700'}} label={translations.price}>
          <div style={{textAlign: 'right', fontWeight: 'bold'}}> {translations.totalCost} {converted} {symbol} </div>
        </Descriptions.Item>

        </Descriptions>
    </div>
  );
};

export default TotalPriceFactory;
